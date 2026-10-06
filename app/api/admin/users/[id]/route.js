import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '../../../../../lib/auth'
import connectDB from '../../../../../lib/mongodb'
import User from '../../../../../models/User'
import { deleteUser } from '../../../../../lib/cascadeDelete'

// GET /api/admin/users/[id] — basic info for the user the admin is managing
export async function GET(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  await connectDB()
  const user = await User.findById(params.id, '-password').lean()
  if (!user) return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })
  return NextResponse.json({ user })
}

// DELETE /api/admin/users/[id] — permanently remove the user and all their data
// (cases, deliveries, requests, messages, organization profile)
export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }
  if (params.id === session.user.id) {
    return NextResponse.json({ error: 'لا يمكنك حذف حسابك' }, { status: 400 })
  }

  await connectDB()
  const user = await User.findById(params.id).select('role')
  if (!user) return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })
  if (user.role === 'admin') return NextResponse.json({ error: 'لا يمكن حذف حساب مشرف' }, { status: 400 })

  const result = await deleteUser(params.id)
  return NextResponse.json({ message: 'تم حذف المستخدم وكل بياناته', ...result })
}
