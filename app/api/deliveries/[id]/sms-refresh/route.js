import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '../../../../../lib/auth'
import connectDB from '../../../../../lib/mongodb'
import Delivery from '../../../../../models/Delivery'
import '../../../../../models/Case'
import { checkSmsgateMessage } from '../../../../../lib/sms'

// Sending waits for the gateway phone to confirm (~12s); allow longer than the default on hosts like Vercel
export const maxDuration = 30

// POST /api/deliveries/[id]/sms-refresh (admin)
// Ask SMS Gateway again for the real state of messages still waiting on the phone
export async function POST(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  await connectDB()
  const delivery = await Delivery.findById(params.id)
  if (!delivery) return NextResponse.json({ error: 'التسليم غير موجود' }, { status: 404 })

  const sms = []
  for (const b of delivery.beneficiaries.filter(x => x.smsGatewayId && x.smsStatus === 'queued')) {
    const r = await checkSmsgateMessage(b.smsGatewayId)
    if (r.state) b.smsState = r.state
    if (r.ok && !r.queued) { b.smsStatus = 'sent'; b.smsSentAt = new Date(); b.smsError = undefined }
    if (!r.ok) { b.smsStatus = 'failed'; b.smsError = r.error }
    sms.push({ beneficiaryId: b._id, code: b.code, ...r })
  }
  await delivery.save()

  const populated = await Delivery.findById(delivery._id)
    .populate('beneficiaries.caseId', 'code name caseType phone')
    .populate('deliveredBy', 'name')
  return NextResponse.json({ sms, delivery: populated })
}
