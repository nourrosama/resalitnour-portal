import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '../../../../../lib/auth'
import connectDB from '../../../../../lib/mongodb'
import Delivery from '../../../../../models/Delivery'
import Case from '../../../../../models/Case'
import StockItem from '../../../../../models/StockItem'
import { normalizeCode, closeIfComplete } from '../../../../../lib/deliveryCode'
import { remainingPerItem, round } from '../../../../../lib/stock'

// POST /api/deliveries/[id]/complete  { code, notes?, items: [{ index, quantity }] }
// The user hands this beneficiary the chosen الأصناف:
//   - each quantity must fit in what is left of that item in the delivery
//   - Σ quantity × points is deducted from the case's points (must be enough)
//   - the quantities are deducted from the user's المخزن
// The delivery closes when all beneficiaries have received.
export async function POST(req, { params }) {
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

  // ---- validate the chosen items
  const remaining = remainingPerItem(delivery)
  const taken = []
  const seen = new Set()
  for (const sel of Array.isArray(items) ? items : []) {
    const idx = Number(sel?.index)
    const qty = round(Number(sel?.quantity))
    if (!Number.isFinite(qty) || qty <= 0) continue
    const it = delivery.items[idx]
    if (!it || seen.has(idx)) return NextResponse.json({ error: 'صنف غير صالح' }, { status: 400 })
    seen.add(idx)
    if (qty > remaining[idx]) {
      return NextResponse.json({ error: `المتبقي من ${it.name} في هذا التسليم ${Math.max(0, remaining[idx])} فقط` }, { status: 400 })
    }
    taken.push({ itemIndex: idx, stockItemId: it.stockItemId, name: it.name, unit: it.unit, quantity: qty, points: Number(it.points) || 0 })
  }
  const hasItemsLeft = remaining.some(r => r > 0)
  if (hasItemsLeft && !taken.length) {
    return NextResponse.json({ error: 'اختر الأصناف التي سيستلمها المستفيد وكمياتها' }, { status: 400 })
  }
  const pointsUsed = round(taken.reduce((s, t) => s + t.quantity * t.points, 0))

  // ---- case points
  const caseDoc = await Case.findById(b.caseId).select('points name')
  if (!caseDoc) return NextResponse.json({ error: 'الحالة غير موجودة' }, { status: 404 })
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

  // ---- deduct the case's points
  if (pointsUsed > 0) {
    const r = await Case.updateOne({ _id: caseDoc._id, points: { $gte: pointsUsed } }, { $inc: { points: -pointsUsed }, $set: { updatedAt: new Date() } })
    if (!r.modifiedCount) {
      await rollback()
      return NextResponse.json({ error: 'نقاط الحالة غير كافية' }, { status: 409 })
    }
  }

  b.status = 'delivered'
  b.deliveredAt = new Date()
  b.completedBy = session.user.id
  b.takenItems = taken
  b.pointsUsed = pointsUsed
  if (notes) b.notes = notes
  closeIfComplete(delivery)
  await delivery.save()

  return NextResponse.json({
    ok: true,
    requestNo: delivery.requestNo,
    closed: delivery.status !== 'scheduled',
    delivered: delivery.beneficiaries.filter(x => x.status === 'delivered').length,
    total: delivery.beneficiaries.length,
    pointsUsed,
    casePointsLeft: round((caseDoc.points || 0) - pointsUsed),
    takenItems: taken,
  })
}
