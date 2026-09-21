import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '../../../lib/auth'
import connectDB from '../../../lib/mongodb'
import Delivery from '../../../models/Delivery'

export async function GET(req) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  await connectDB()
  const { searchParams } = new URL(req.url)
  const caseId = searchParams.get('caseId')

  let query = {}
  if (caseId) query.caseId = caseId

  const deliveries = await Delivery.find(query)
    .populate('caseId', 'code name')
    .populate('deliveredBy', 'name')
    .sort({ createdAt: -1 })

  return NextResponse.json(deliveries)
}

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  await connectDB()
  const body = await req.json()
  const delivery = await Delivery.create({ ...body, deliveredBy: session.user.id })
  return NextResponse.json(delivery, { status: 201 })
}
