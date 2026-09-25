import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '../../../../lib/auth'
import connectDB from '../../../../lib/mongodb'
import Message from '../../../../models/Message'

export async function GET(req) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  await connectDB()
  const { searchParams } = new URL(req.url)
  const query = { from: session.user.id }
  if (searchParams.get('userId')) query.to = searchParams.get('userId')
  const messages = await Message.find(query)
    .populate('to', 'name email')
    .populate('caseId', 'code name')
    .sort({ createdAt: -1 })

  return NextResponse.json(messages)
}
