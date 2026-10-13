import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '../../../../lib/auth'
import connectDB from '../../../../lib/mongodb'
import CatalogItem from '../../../../models/CatalogItem'
import StockItem from '../../../../models/StockItem'
import { cleanCatalogInput } from '../../../../lib/catalogInput'

async function guard() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  await connectDB()
  return null
}

// PATCH /api/catalog/[id] (admin) — changes apply to every user's المخزن immediately
export async function PATCH(req, { params }) {
  const denied = await guard()
  if (denied) return denied
  const item = await CatalogItem.findById(params.id)
  if (!item) return NextResponse.json({ error: 'الصنف غير موجود' }, { status: 404 })
  const { data, error } = cleanCatalogInput(await req.json(), false)
  if (error) return NextResponse.json({ error }, { status: 400 })
  if (data.name && data.name !== item.name && await CatalogItem.exists({ name: data.name })) {
    return NextResponse.json({ error: 'يوجد صنف آخر بنفس الاسم' }, { status: 409 })
  }
  Object.assign(item, data)
  await item.save()
  // keep the copies in every user's المخزن in sync
  await StockItem.updateMany({ catalogItemId: item._id }, { $set: { name: item.name, unit: item.unit, points: item.points } })
  return NextResponse.json(item)
}

// DELETE /api/catalog/[id] (admin) — removes the صنف from the table and from every user's المخزن
export async function DELETE(req, { params }) {
  const denied = await guard()
  if (denied) return denied
  const item = await CatalogItem.findById(params.id)
  if (!item) return NextResponse.json({ error: 'الصنف غير موجود' }, { status: 404 })
  const stock = await StockItem.deleteMany({ catalogItemId: item._id })
  await item.deleteOne()
  return NextResponse.json({ message: 'تم حذف الصنف', stockRemoved: stock.deletedCount })
}
