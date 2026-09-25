import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '../../../lib/auth'
import connectDB from '../../../lib/mongodb'
import Request from '../../../models/Request'

export async function GET(req) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  await connectDB()
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')

  let query = {}
  if (session.user.role !== 'admin') query.submittedBy = session.user.id
  else if (searchParams.get('userId')) query.submittedBy = searchParams.get('userId')
  if (type) query.type = type

  const requests = await Request.find(query)
    .populate('caseId', 'code name caseType')
    .populate('submittedBy', 'name email')
    .populate('reviewedBy', 'name')
    .sort({ createdAt: -1 })

  return NextResponse.json(requests)
}

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  await connectDB()
  const body = await req.json()

  const request = await Request.create({
    ...body,
    submittedBy: session.user.id,
    status: 'pending',
  })

  return NextResponse.json(request, { status: 201 })
}
