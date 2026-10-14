import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '../../../../lib/auth'
import connectDB from '../../../../lib/mongodb'
import Delivery from '../../../../models/Delivery'

// DELETE /api/deliveries/[id] (admin) — permanently remove a delivery and its voucher codes
export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  await connectDB()
  const res = await Delivery.deleteOne({ _id: params.id })
  if (!res.deletedCount) return NextResponse.json({ error: 'التسليم غير موجود' }, { status: 404 })
  return NextResponse.json({ message: 'تم حذف التسليم' })
}

// PATCH /api/deliveries/[id] (admin)  { action: 'close' }
// Closes an open delivery early: beneficiaries who didn't come stay "لم يستلم".
// Nothing has to be returned to المخزن — stock only goes down for what was actually handed out.
export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }
  await connectDB()
  const { action } = await req.json().catch(() => ({}))
  if (action !== 'close') return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 })

  const delivery = await Delivery.findById(params.id)
  if (!delivery) return NextResponse.json({ error: 'التسليم غير موجود' }, { status: 404 })
  if (delivery.status !== 'scheduled') return NextResponse.json({ error: 'التسليم مغلق بالفعل' }, { status: 409 })
  delivery.status = 'delivered'
  delivery.deliveredAt = new Date()
  await delivery.save({ validateModifiedOnly: true })

  const populated = await Delivery.findById(delivery._id)
    .populate('beneficiaries.caseId', 'code name caseType phone points familyMembers')
    .populate('deliveredBy', 'name')
  return NextResponse.json({ delivery: populated })
}
