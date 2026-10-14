import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '../../../../../lib/auth'
import connectDB from '../../../../../lib/mongodb'
import Delivery from '../../../../../models/Delivery'
import Case from '../../../../../models/Case'
import StockItem from '../../../../../models/StockItem'
import { normalizeCode, closeIfComplete } from '../../../../../lib/deliveryCode'
import { remainingPerItem, round, resolveDeliveryItems, liveItemsFor } from '../../../../../lib/stock'

// POST /api/deliveries/[id]/complete  { code, notes?, items: [{ key, quantity }] }
//   key = stock row id (live deliveries) or item index (older deliveries)
// The user hands this beneficiary the chosen الأصناف:
//   - each quantity must fit in what is left of that item in the delivery
//   - and in الحد الأقصى of جدول الأصناف for the case's family size
//   - Σ quantity × points must not exceed the case's points (a fixed allowance per handout, never deducted)
//   - the quantities are deducted from the user's المخزن
// The delivery closes when all beneficiaries have received.
export async function POST(req, ctx) {
  try {
    return await complete(req, ctx)
  } catch (err) {
    // never fail silently: log it and show the reason on the page
    console.error('deliveries/complete failed:', err)
    return NextResponse.json({ error: `خطأ في الخادم: ${err?.message || err}` }, { status: 500 })
  }
}

async function complete(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  await connectDB()
  const { code, notes, items = [] } = await req.json()
  const delivery = await Delivery.findById(params.id)
  if (!delivery) return NextResponse.json({ error: 'التسليم غير موجود' }, { status: 404 })
  if (session.user.role !== 'admin' && String(delivery.userId) !== session.user.id) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const b = delivery.beneficiaries.find(x => x.code === normalizeCode(code))
  if (!b) return NextResponse.json({ error: 'الكود غير صحيح' }, { status: 400 })
  if (b.status === 'delivered') return NextResponse.json({ error: 'تم استلام هذه القسيمة بالفعل' }, { status: 409 })
  if (delivery.status !== 'scheduled') return NextResponse.json({ error: 'هذا الطلب مغلق' }, { status: 409 })

  // ---- the case: points + family size (for the limits in جدول الأصناف)
  const caseDoc = await Case.findById(b.caseId).select('points name familyMembers')
  if (!caseDoc) return NextResponse.json({ error: 'الحالة غير موجودة' }, { status: 404 })
  const fm = caseDoc.familyMembers
  const selections = (Array.isArray(items) ? items : [])
    .map(sel => ({ key: String(sel?.key ?? sel?.index ?? ''), qty: round(Number(sel?.quantity)) }))
    .filter(sel => sel.key && Number.isFinite(sel.qty) && sel.qty > 0)
  const taken = []
  const seen = new Set()
  let canTakeSomething

  if (delivery.stockMode === 'live') {
    // ---- the whole المخزن, live
    const live = await liveItemsFor(delivery.userId, fm)
    const byKey = Object.fromEntries(live.map(it => [it.key, it]))
    if (selections.length && !(Number(fm) >= 1)) {
      return NextResponse.json({ error: 'حدد عدد أفراد الأسرة لهذه الحالة أولًا (من صفحة الحالات)' }, { status: 400 })
    }
    for (const sel of selections) {
      const it = byKey[sel.key]
      if (!it || seen.has(sel.key)) return NextResponse.json({ error: 'صنف غير متوفر في المخزن' }, { status: 400 })
      seen.add(sel.key)
      if (it.limit !== null && sel.qty > it.limit) {
        return NextResponse.json({ error: `الحد الأقصى من ${it.name} لأسرة من ${fm} أفراد هو ${it.limit}` }, { status: 400 })
      }
      if (sel.qty > it.available) {
        return NextResponse.json({ error: `المتوفر من ${it.name} في المخزن ${it.available} فقط` }, { status: 400 })
      }
      taken.push({ stockItemId: it.stockItemId, catalogItemId: it.catalogItemId, name: it.name, unit: it.unit, quantity: sel.qty, points: it.points })
    }
    canTakeSomething = live.some(it => it.limit !== 0 && it.points <= (caseDoc.points || 0))
  } else {
    // ---- older deliveries: fixed quantities per item
    const rules = await resolveDeliveryItems(delivery, fm)
    const remaining = remainingPerItem(delivery)
    for (const sel of selections) {
      const idx = Number(sel.key)
      const it = delivery.items[idx]
      if (!it || seen.has(idx)) return NextResponse.json({ error: 'صنف غير صالح' }, { status: 400 })
      seen.add(idx)
      if (rules[idx].linked && rules[idx].limit === null) {
        return NextResponse.json({ error: 'حدد عدد أفراد الأسرة لهذه الحالة أولًا (من صفحة الحالات)' }, { status: 400 })
      }
      if (rules[idx].limit !== null && sel.qty > rules[idx].limit) {
        return NextResponse.json({ error: `الحد الأقصى من ${it.name} لأسرة من ${fm} أفراد هو ${rules[idx].limit}` }, { status: 400 })
      }
      if (sel.qty > remaining[idx]) {
        return NextResponse.json({ error: `المتبقي من ${it.name} في هذا التسليم ${Math.max(0, remaining[idx])} فقط` }, { status: 400 })
      }
      taken.push({ itemIndex: idx, stockItemId: it.stockItemId, name: it.name, unit: rules[idx].unit, quantity: sel.qty, points: rules[idx].points })
    }
    canTakeSomething = delivery.items.some((it, idx) =>
      remaining[idx] > 0 && rules[idx].limit !== 0 && rules[idx].points <= (caseDoc.points || 0))
  }
  // something this case could still take but nothing was chosen
  if (canTakeSomething && !taken.length) {
    return NextResponse.json({ error: 'اختر الأصناف التي سيستلمها المستفيد وكمياتها' }, { status: 400 })
  }
  const pointsUsed = round(taken.reduce((s, t) => s + t.quantity * t.points, 0))

  // ---- case points
  if (pointsUsed > (caseDoc.points || 0)) {
    return NextResponse.json({ error: `نقاط الأصناف المختارة (${pointsUsed}) أكبر من نقاط الحالة (${caseDoc.points || 0})` }, { status: 400 })
  }

  // ---- deduct from المخزن (conditional, rolled back on failure)
  const done = []
  async function rollback() {
    for (const d of done) await StockItem.updateOne({ _id: d.id }, { $inc: { quantity: d.qty } })
  }
  for (const t of taken) {
    if (!t.stockItemId) continue // old delivery item not linked to المخزن
    const r = await StockItem.updateOne(
      { _id: t.stockItemId, quantity: { $gte: t.quantity } },
      { $inc: { quantity: -t.quantity }, $set: { updatedAt: new Date() } },
    )
    if (r.modifiedCount) { done.push({ id: t.stockItemId, qty: t.quantity }); continue }
    if (await StockItem.exists({ _id: t.stockItemId })) {
      await rollback()
      return NextResponse.json({ error: `الكمية المتبقية من ${t.name} في المخزن أقل من ${t.quantity} — عدّل المخزن أولًا` }, { status: 409 })
    }
    // the صنف was removed from المخزن: hand it out without touching stock
  }

  // The case's points are a fixed allowance per handout — they are NOT deducted.

  b.status = 'delivered'
  b.deliveredAt = new Date()
  b.completedBy = session.user.id
  b.takenItems = taken
  b.pointsUsed = pointsUsed
  if (notes) b.notes = notes
  closeIfComplete(delivery)
  try {
    await delivery.save({ validateModifiedOnly: true })
  } catch (err) {
    // undo the stock deductions so nothing is lost
    await rollback()
    throw err
  }

  return NextResponse.json({
    ok: true,
    requestNo: delivery.requestNo,
    closed: delivery.status !== 'scheduled',
    delivered: delivery.beneficiaries.filter(x => x.status === 'delivered').length,
    total: delivery.beneficiaries.length,
    pointsUsed,
    casePoints: caseDoc.points || 0,
    takenItems: taken,
  })
}
