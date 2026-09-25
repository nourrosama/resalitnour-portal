import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '../../../../lib/auth'
import connectDB from '../../../../lib/mongodb'
import Delivery from '../../../../models/Delivery'
import '../../../../models/Case'
import { normalizeCode, migrateLegacyDeliveries } from '../../../../lib/deliveryCode'

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
  const delivery = await Delivery.findOne(query).populate('beneficiaries.caseId', 'code name caseType governorate')
  if (!delivery) return NextResponse.json({ error: 'الكود غير صحيح' }, { status: 404 })

  const b = delivery.beneficiaries.find(x => x.code === c)
  if (b.status === 'delivered') {
    return NextResponse.json({ error: `تم استلام هذه القسيمة بالفعل بتاريخ ${new Date(b.deliveredAt).toLocaleDateString('ar-EG')}` }, { status: 409 })
  }
  if (delivery.status !== 'scheduled') {
    return NextResponse.json({ error: 'هذا الطلب مغلق' }, { status: 409 })
  }

  const o = delivery.toObject()
  const { code: _c, phone, smsError, smsStatus, smsSentAt, smsGatewayId, smsState, ...beneficiary } = b.toObject()
  return NextResponse.json({
    delivery: {
      _id: o._id, requestNo: o.requestNo, deliveryType: o.deliveryType, items: o.items, amount: o.amount,
      location: o.location, scheduledFor: o.scheduledFor, notes: o.notes,
      total: o.beneficiaries.length,
      delivered: o.beneficiaries.filter(x => x.status === 'delivered').length,
    },
    beneficiary,
  })
}
