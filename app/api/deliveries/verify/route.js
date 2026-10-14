import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '../../../../lib/auth'
import connectDB from '../../../../lib/mongodb'
import Delivery from '../../../../models/Delivery'
import '../../../../models/Case'
import { normalizeCode, migrateLegacyDeliveries } from '../../../../lib/deliveryCode'
import { remainingPerItem, resolveDeliveryItems, liveItemsFor } from '../../../../lib/stock'

// POST /api/deliveries/verify  { code } — the user looks up a beneficiary by their voucher code
export async function POST(req) {
  try {
    return await verify(req)
  } catch (err) {
    console.error('deliveries/verify failed:', err)
    return NextResponse.json({ error: `خطأ في الخادم: ${err?.message || err}` }, { status: 500 })
  }
}

async function verify(req) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  await connectDB()
  await migrateLegacyDeliveries()
  const { code } = await req.json()
  const c = normalizeCode(code)
  if (!c) return NextResponse.json({ error: 'أدخل كود القسيمة' }, { status: 400 })

  const query = { 'beneficiaries.code': c }
  if (session.user.role !== 'admin') query.userId = session.user.id // only the user's own deliveries
  const delivery = await Delivery.findOne(query).populate('beneficiaries.caseId', 'code name caseType governorate points familyMembers')
  if (!delivery) return NextResponse.json({ error: 'الكود غير صحيح' }, { status: 404 })

  const b = delivery.beneficiaries.find(x => x.code === c)
  if (b.status === 'delivered') {
    return NextResponse.json({ error: `تم استلام هذه القسيمة بالفعل بتاريخ ${new Date(b.deliveredAt).toLocaleDateString('ar-EG')}` }, { status: 409 })
  }
  if (delivery.status !== 'scheduled') {
    return NextResponse.json({ error: 'هذا الطلب مغلق' }, { status: 409 })
  }

  const o = delivery.toObject()
  const familyMembers = b.caseId?.familyMembers
  let items, needsFamilySize
  if (o.stockMode === 'live') {
    // the whole المخزن, live: remaining = what's in stock right now
    const live = await liveItemsFor(o.userId, familyMembers)
    items = live.map(it => ({
      key: it.key, name: it.name, unit: it.unit, points: it.points,
      remaining: it.available, limit: it.limit,
      max: it.limit === null ? it.available : Math.max(0, Math.min(it.limit, it.available)),
    }))
    needsFamilySize = familyMembers == null || !(Number(familyMembers) >= 1)
  } else {
    // older deliveries: fixed quantities per item
    const remaining = remainingPerItem(o)
    const rules = await resolveDeliveryItems(o, familyMembers)
    items = (o.items || []).map((it, idx) => ({
      key: String(idx), name: it.name, unit: rules[idx].unit, points: rules[idx].points,
      remaining: Math.max(0, remaining[idx]),
      limit: rules[idx].limit, // الحد الأقصى for this case's family size (null = no rule)
      max: rules[idx].limit === null ? Math.max(0, remaining[idx]) : Math.max(0, Math.min(rules[idx].limit, remaining[idx])),
    }))
    needsFamilySize = rules.some(r => r.linked && r.limit === null)
  }
  const { code: _c, phone, smsError, smsStatus, smsSentAt, smsGatewayId, smsState, ...beneficiary } = b.toObject()
  return NextResponse.json({
    delivery: {
      _id: o._id, requestNo: o.requestNo, deliveryType: o.deliveryType, amount: o.amount,
      stockMode: o.stockMode || 'reserved',
      items,
      familyMembers: familyMembers ?? null,
      needsFamilySize,
      location: o.location, scheduledFor: o.scheduledFor, notes: o.notes,
      total: o.beneficiaries.length,
      delivered: o.beneficiaries.filter(x => x.status === 'delivered').length,
    },
    beneficiary,
  })
}
