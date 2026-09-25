import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '../../../lib/auth'
import connectDB from '../../../lib/mongodb'
import Message from '../../../models/Message'

export async function GET(req) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  await connectDB()
  const messages = await Message.find({ to: session.user.id })
    .populate('from', 'name')
    .populate('caseId', 'code name')
    .sort({ createdAt: -1 })

  return NextResponse.json(messages)
}

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'غير مصرح - الإدارة فقط' }, { status: 403 })
  }

  await connectDB()
  const body = await req.json()
  if (!body.caseId) delete body.caseId
  const message = await Message.create({ ...body, from: session.user.id })
  return NextResponse.json(message, { status: 201 })
}
