import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '../../../lib/auth'
import connectDB from '../../../lib/mongodb'
import User from '../../../models/User'
import { stockWithReserved } from '../../../lib/stock'

// GET /api/stock[?userId=] — the user's المخزن: one row per item of the global جدول الأصناف,
// with quantity, reserved (open deliveries) and available. Admin passes ?userId=, a user gets their own.
export async function GET(req) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  await connectDB()
  const userId = session.user.role === 'admin' ? new URL(req.url).searchParams.get('userId') : session.user.id
  if (!userId) return NextResponse.json({ error: 'حدد المستخدم' }, { status: 400 })
  if (!(await User.exists({ _id: userId }))) return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })
  return NextResponse.json(await stockWithReserved(userId))
}

// New الأصناف are added by the admin in جدول الأصناف والحدود, not per user
export async function POST() {
  return NextResponse.json({ error: 'تُضاف الأصناف من "جدول الأصناف والحدود" بواسطة المشرف' }, { status: 405 })
}
