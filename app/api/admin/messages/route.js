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
  const messages = await Message.find({ from: session.user.id })
    .populate('to', 'name email')
    .populate('caseId', 'code name')
    .sort({ createdAt: -1 })

  return NextResponse.json(messages)
}
