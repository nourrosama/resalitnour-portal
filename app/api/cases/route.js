import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '../../../lib/auth'
import connectDB from '../../../lib/mongodb'
import Case from '../../../models/Case'
import { USER_EDITABLE_FIELDS, toCount } from '../../../lib/caseOptions'

export async function GET(req) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  await connectDB()
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const caseType = searchParams.get('caseType')
  const period = searchParams.get('period') // 'monthly' | 'seasonal'
  const isAdmin = session.user.role === 'admin'

  let query = {}
  // Non-admins only see their own cases
  if (!isAdmin) {
    query.submittedBy = session.user.id
  } else if (searchParams.get('userId')) {
    // Admin working inside a specific user's workspace
    query.submittedBy = searchParams.get('userId')
  }
  if (status && status !== 'all') query.status = status
  if (caseType) query.caseType = caseType
  if (period === 'monthly') query.caseType = { $regex: 'شهري', $options: 'i' }
  if (period === 'seasonal') query.caseType = { $regex: 'موسم', $options: 'i' }

  let q = Case.find(query)
  if (!isAdmin) q = q.select('-points') // عدد النقاط is admin-only
  const cases = await q
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
  const isAdmin = session.user.role === 'admin'

  // Users can only set their own fields; points/status are admin-only
  const data = {}
  for (const k of USER_EDITABLE_FIELDS) if (k in body) data[k] = body[k]
  data.familyMembers = toCount(body.familyMembers)
  if (data.familyMembers === null) {
    return NextResponse.json({ error: 'عدد أفراد الأسرة مطلوب' }, { status: 400 })
  }
  if (isAdmin && 'points' in body) {
    const p = toCount(body.points)
    if (p === null) return NextResponse.json({ error: 'عدد النقاط مطلوب' }, { status: 400 })
    data.points = p
  }

  const newCase = await Case.create({
    ...data,
    submittedBy: session.user.id,
    status: 'pending',
  })

  return NextResponse.json(newCase, { status: 201 })
}
