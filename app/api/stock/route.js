import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '../../../lib/auth'
import connectDB from '../../../lib/mongodb'
import StockItem from '../../../models/StockItem'
import User from '../../../models/User'
import { seedStock, stockWithReserved } from '../../../lib/stock'
import { cleanStockInput } from '../../../lib/stockInput'

// Admin works on ?userId=..., a user always on their own المخزن
async function ownerFor(session, req) {
  if (session.user.role !== 'admin') return session.user.id
  return new URL(req.url).searchParams.get('userId')
}

// GET /api/stock[?userId=] — the المخزن list with reserved / available amounts
export async function GET(req) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  await connectDB()
  const userId = await ownerFor(session, req)
  if (!userId) return NextResponse.json({ error: 'حدد المستخدم' }, { status: 400 })
  if (!(await User.exists({ _id: userId }))) return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })

  await seedStock(userId)
  return NextResponse.json(await stockWithReserved(userId))
}

// POST /api/stock[?userId=]  { name, unit, quantity, points } — add a صنف
export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  await connectDB()
  const userId = await ownerFor(session, req)
  if (!userId) return NextResponse.json({ error: 'حدد المستخدم' }, { status: 400 })

  const { data, error } = cleanStockInput(await req.json(), true)
  if (error) return NextResponse.json({ error }, { status: 400 })
  if (await StockItem.exists({ userId, name: data.name })) {
    return NextResponse.json({ error: 'هذا الصنف موجود بالفعل في المخزن' }, { status: 409 })
  }
  const item = await StockItem.create({ ...data, userId })
  return NextResponse.json({ ...item.toObject(), reserved: 0, available: item.quantity }, { status: 201 })
}
