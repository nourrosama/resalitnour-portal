import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '../../../../lib/auth'
import connectDB from '../../../../lib/mongodb'
import Delivery from '../../../../models/Delivery'
import '../../../../models/Case'
import { normalizeCode, migrateLegacyDeliveries } from '../../../../lib/deliveryCode'
import { remainingPerItem, numQty, itemLimitsFor } from '../../../../lib/stock'

// POST /api/deliveries/verify  { code } — the user looks up a beneficiary by their voucher code
export async function POST(req) {
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
  const remaining = remainingPerItem(o)
  const familyMembers = b.caseId?.familyMembers
  const limits = await itemLimitsFor(o, familyMembers)
  const { code: _c, phone, smsError, smsStatus, smsSentAt, smsGatewayId, smsState, ...beneficiary } = b.toObject()
  return NextResponse.json({
    delivery: {
      _id: o._id, requestNo: o.requestNo, deliveryType: o.deliveryType, amount: o.amount,
      // each item with how much is still left in this delivery for the remaining beneficiaries
      items: (o.items || []).map((it, idx) => ({
        index: idx, name: it.name, unit: it.unit, points: Number(it.points) || 0,
        quantity: numQty(it.quantity), remaining: Math.max(0, remaining[idx]),
        limit: limits[idx], // الحد الأقصى for this case's family size (null = no rule)
        max: limits[idx] === null ? Math.max(0, remaining[idx]) : Math.max(0, Math.min(limits[idx], remaining[idx])),
      })),
      familyMembers: familyMembers ?? null,
      needsFamilySize: limits.some((l, i) => l === null && o.items[i]?.catalogItemId),
      location: o.location, scheduledFor: o.scheduledFor, notes: o.notes,
      total: o.beneficiaries.length,
      delivered: o.beneficiaries.filter(x => x.status === 'delivered').length,
    },
    beneficiary,
  })
}
