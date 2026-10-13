import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '../../../lib/auth'
import connectDB from '../../../lib/mongodb'
import CatalogItem from '../../../models/CatalogItem'
import { loadCatalog } from '../../../lib/catalogServer'
import { cleanCatalogInput } from '../../../lib/catalogInput'

// GET /api/catalog — جدول الأصناف والحدود (any signed-in user can read it)
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  await connectDB()
  return NextResponse.json(await loadCatalog())
}

// POST /api/catalog (admin) { name, unit, weight, points, limits[7] }
export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  await connectDB()
  const { data, error } = cleanCatalogInput(await req.json(), true)
  if (error) return NextResponse.json({ error }, { status: 400 })
  if (await CatalogItem.exists({ name: data.name })) return NextResponse.json({ error: 'هذا الصنف موجود بالفعل' }, { status: 409 })
  const last = await CatalogItem.findOne().sort({ order: -1 }).select('order').lean()
  const item = await CatalogItem.create({ ...data, order: (last?.order || 0) + 1 })
  return NextResponse.json(item, { status: 201 })
}
