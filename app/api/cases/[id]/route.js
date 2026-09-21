import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '../../../../lib/auth'
import connectDB from '../../../../lib/mongodb'
import Case from '../../../../models/Case'

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  await connectDB()
  const caseItem = await Case.findById(params.id)
    .populate('submittedBy', 'name email phone')
    .populate('reviewedBy', 'name')

  if (!caseItem) return NextResponse.json({ error: 'الحالة غير موجودة' }, { status: 404 })

  // Non-admins can only view their own cases
  if (session.user.role !== 'admin' && caseItem.submittedBy._id.toString() !== session.user.id) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  return NextResponse.json(caseItem)
}

export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  await connectDB()
  const body = await req.json()

  // Only admins can change status/decision
  if ((body.status || body.adminDecision) && session.user.role !== 'admin') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const updateData = { ...body, updatedAt: new Date() }
  if (body.status && session.user.role === 'admin') {
    updateData.reviewedBy = session.user.id
    updateData.reviewedAt = new Date()
  }

  const updated = await Case.findByIdAndUpdate(params.id, updateData, { new: true })
  return NextResponse.json(updated)
}

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  await connectDB()
  await Case.findByIdAndDelete(params.id)
  return NextResponse.json({ message: 'تم الحذف' })
}
