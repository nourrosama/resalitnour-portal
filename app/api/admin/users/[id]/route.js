import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '../../../../../lib/auth'
import connectDB from '../../../../../lib/mongodb'
import User from '../../../../../models/User'

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
