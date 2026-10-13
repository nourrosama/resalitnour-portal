import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '../../../../lib/auth'
import connectDB from '../../../../lib/mongodb'
import StockItem from '../../../../models/StockItem'
import { cleanStockInput } from '../../../../lib/stockInput'
import { reservedByItem, round } from '../../../../lib/stock'

async function load(session, id) {
  const item = await StockItem.findById(id)
  if (!item) return { res: NextResponse.json({ error: 'الصنف غير موجود' }, { status: 404 }) }
  if (session.user.role !== 'admin' && String(item.userId) !== session.user.id) {
    return { res: NextResponse.json({ error: 'غير مصرح' }, { status: 403 }) }
  }
  return { item }
}

// PATCH /api/stock/[id]  { name?, unit?, quantity?, points? } — admin or the owner user
export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  await connectDB()
  const { item, res } = await load(session, params.id)
  if (res) return res

  const { data, error } = cleanStockInput(await req.json(), false)
  if (error) return NextResponse.json({ error }, { status: 400 })
  if (data.name && data.name !== item.name && await StockItem.exists({ userId: item.userId, name: data.name })) {
    return NextResponse.json({ error: 'يوجد صنف آخر بنفس الاسم' }, { status: 409 })
  }
  Object.assign(item, data)
  await item.save()

  const reserved = round((await reservedByItem(item.userId))[String(item._id)] || 0)
  return NextResponse.json({ ...item.toObject(), reserved, available: round(Math.max(0, item.quantity - reserved)) })
}

// DELETE /api/stock/[id] — remove a صنف from the المخزن
// (open deliveries keep their copy of the item; it just won't reduce any stock)
export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  await connectDB()
  const { item, res } = await load(session, params.id)
  if (res) return res
  await item.deleteOne()
  return NextResponse.json({ message: 'تم حذف الصنف' })
}
