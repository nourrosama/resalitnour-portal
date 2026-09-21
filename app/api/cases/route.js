import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '../../../lib/auth'
import connectDB from '../../../lib/mongodb'
import Case from '../../../models/Case'

export async function GET(req) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  await connectDB()
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const caseType = searchParams.get('caseType')
  const period = searchParams.get('period') // 'monthly' | 'seasonal'

  let query = {}
  // Non-admins only see their own cases
  if (session.user.role !== 'admin') {
    query.submittedBy = session.user.id
  }
  if (status && status !== 'all') query.status = status
  if (caseType) query.caseType = caseType
  if (period === 'monthly') query.caseType = { $regex: 'شهري', $options: 'i' }
  if (period === 'seasonal') query.caseType = { $regex: 'موسم', $options: 'i' }

  const cases = await Case.find(query)
    .populate('submittedBy', 'name email')
    .populate('reviewedBy', 'name')
    .sort({ createdAt: -1 })

  return NextResponse.json(cases)
}

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  await connectDB()
  const body = await req.json()

  const newCase = await Case.create({
    ...body,
    submittedBy: session.user.id,
    status: 'pending',
  })

  return NextResponse.json(newCase, { status: 201 })
}
