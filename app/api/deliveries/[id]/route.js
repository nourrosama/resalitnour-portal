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
