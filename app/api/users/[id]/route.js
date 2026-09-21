import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '../../../../lib/auth'
import connectDB from '../../../../lib/mongodb'
import User from '../../../../models/User'

export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  // Users can only update themselves; admins can update anyone
  if (session.user.role !== 'admin' && session.user.id !== params.id) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  await connectDB()
  const body = await req.json()

  // Don't allow role changes unless admin
  if (body.role && session.user.role !== 'admin') delete body.role

  // Handle password change
  if (body.newPassword) {
    const user = await User.findById(params.id)
    user.password = body.newPassword
    user.mustChangePassword = false
    await user.save()
    return NextResponse.json({ message: 'تم تغيير كلمة المرور' })
  }

  const updated = await User.findByIdAndUpdate(
    params.id,
    { $set: body },
    { new: true, select: '-password' }
  )
  return NextResponse.json(updated)
}

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  await connectDB()
  // Soft delete — deactivate instead of removing data
  await User.findByIdAndUpdate(params.id, { isActive: false })
  return NextResponse.json({ message: 'تم تعطيل الحساب' })
}
