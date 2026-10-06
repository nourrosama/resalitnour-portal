import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '../../../../../lib/auth'
import connectDB from '../../../../../lib/mongodb'
import Delivery from '../../../../../models/Delivery'
import Case from '../../../../../models/Case'
import User from '../../../../../models/User'
import { sendBeneficiaryCode } from '../../../../../lib/deliveryCode'

// Sending waits for the gateway phone to confirm (~12s); allow longer than the default on hosts like Vercel
export const maxDuration = 30

// POST /api/deliveries/[id]/send-sms (admin)
// { beneficiaryId?, phone? } — one beneficiary, or every beneficiary who hasn't received yet
export async function POST(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  await connectDB()
  const { beneficiaryId, phone } = await req.json().catch(() => ({}))
  const delivery = await Delivery.findById(params.id)
  if (!delivery) return NextResponse.json({ error: 'التسليم غير موجود' }, { status: 404 })
  const owner = await User.findById(delivery.userId).select('name organization')

  const targets = beneficiaryId
    ? delivery.beneficiaries.filter(b => String(b._id) === String(beneficiaryId))
    : delivery.beneficiaries.filter(b => b.status === 'pending')
  if (!targets.length) return NextResponse.json({ error: 'لا يوجد مستفيدون للإرسال' }, { status: 400 })

  const cases = await Case.find({ _id: { $in: targets.map(b => b.caseId) } }).select('name phone')
  const caseById = Object.fromEntries(cases.map(c => [String(c._id), c]))

  const sms = []
  for (const b of targets) {
    if (beneficiaryId && phone) b.phone = String(phone).trim()
    if (!b.phone && caseById[String(b.caseId)]?.phone) b.phone = caseById[String(b.caseId)].phone
    const r = await sendBeneficiaryCode(delivery, b, caseById[String(b.caseId)], owner?.organization || owner?.name)
    sms.push({ beneficiaryId: b._id, code: b.code, ...r })
  }
  await delivery.save()

  const populated = await Delivery.findById(delivery._id)
    .populate('beneficiaries.caseId', 'code name caseType phone points familyMembers')
    .populate('deliveredBy', 'name')
  return NextResponse.json({ sms, delivery: populated })
}
