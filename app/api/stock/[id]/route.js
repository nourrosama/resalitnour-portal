import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '../../../../lib/auth'
import connectDB from '../../../../lib/mongodb'
import StockItem from '../../../../models/StockItem'
import CatalogItem from '../../../../models/CatalogItem'
import { reservedByItem, round } from '../../../../lib/stock'

async function load(session, id) {
  const item = await StockItem.findById(id)
  if (!item) return { res: NextResponse.json({ error: 'الصنف غير موجود' }, { status: 404 }) }
  if (session.user.role !== 'admin' && String(item.userId) !== session.user.id) {
    return { res: NextResponse.json({ error: 'غير مصرح' }, { status: 403 }) }
  }
  return { item }
}

// PATCH /api/stock/[id]  { quantity } — admin or the owner user.
// Name / unit / points / limits come from جدول الأصناف and can't be changed here.
export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  await connectDB()
  const { item, res } = await load(session, params.id)
  if (res) return res

  const body = await req.json()
  const q = body.quantity === '' || body.quantity == null ? 0 : Number(body.quantity)
  if (!Number.isFinite(q) || q < 0) return NextResponse.json({ error: 'الكمية يجب أن تكون رقمًا موجبًا' }, { status: 400 })
  item.quantity = round(q)
  item.updatedAt = new Date()
  await item.save()

  const cat = item.catalogItemId ? await CatalogItem.findById(item.catalogItemId).lean() : null
  const reserved = round((await reservedByItem(item.userId))[String(item._id)] || 0)
  return NextResponse.json({
    ...item.toObject(),
    name: cat?.name ?? item.name, unit: cat?.unit ?? item.unit, weight: cat?.weight || '',
    points: cat ? cat.points : item.points, limits: cat?.limits || null, inCatalog: !!cat,
    reserved, available: round(Math.max(0, item.quantity - reserved)),
  })
}

// DELETE /api/stock/[id] — only for old rows that are not in جدول الأصناف
// (table items are removed by the admin from the table itself)
export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  await connectDB()
  const { item, res } = await load(session, params.id)
  if (res) return res
  if (item.catalogItemId && await CatalogItem.exists({ _id: item.catalogItemId })) {
    return NextResponse.json({ error: 'هذا الصنف من جدول الأصناف — اجعل كميته 0 بدلًا من حذفه' }, { status: 400 })
  }
  await item.deleteOne()
  return NextResponse.json({ message: 'تم حذف الصنف' })
}
