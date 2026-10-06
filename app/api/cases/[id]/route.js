import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '../../../../lib/auth'
import connectDB from '../../../../lib/mongodb'
import Case from '../../../../models/Case'
import { USER_EDITABLE_FIELDS, toCount } from '../../../../lib/caseOptions'

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  await connectDB()
  const isAdmin = session.user.role === 'admin'
  let q = Case.findById(params.id)
  if (!isAdmin) q = q.select('-points') // عدد النقاط is admin-only
  const caseItem = await q
    .populate('submittedBy', 'name email phone')
    .populate('reviewedBy', 'name')

  if (!caseItem) return NextResponse.json({ error: 'الحالة غير موجودة' }, { status: 404 })

  // Non-admins can only view their own cases
  if (!isAdmin && caseItem.submittedBy._id.toString() !== session.user.id) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  return NextResponse.json(caseItem)
}

export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  await connectDB()
  const body = await req.json()
  const isAdmin = session.user.role === 'admin'

  const existing = await Case.findById(params.id).select('submittedBy')
  if (!existing) return NextResponse.json({ error: 'الحالة غير موجودة' }, { status: 404 })
  if (!isAdmin && String(existing.submittedBy) !== session.user.id) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  // Users may only correct their own data fields; admins may also set status, note and points
  const allowed = isAdmin
    ? [...USER_EDITABLE_FIELDS, 'status', 'adminDecision', 'adminNote', 'points']
    : USER_EDITABLE_FIELDS
  const updateData = { updatedAt: new Date() }
  for (const k of allowed) if (k in body) updateData[k] = body[k]

  if ('name' in updateData && !String(updateData.name || '').trim()) {
    return NextResponse.json({ error: 'الاسم مطلوب' }, { status: 400 })
  }
  if ('caseType' in updateData && !updateData.caseType) {
    return NextResponse.json({ error: 'نوع الحالة مطلوب' }, { status: 400 })
  }
  // عدد أفراد الأسرة / عدد النقاط are mandatory
  if ('familyMembers' in updateData) {
    updateData.familyMembers = toCount(updateData.familyMembers)
    if (updateData.familyMembers === null) return NextResponse.json({ error: 'عدد أفراد الأسرة مطلوب' }, { status: 400 })
  }
  if ('points' in updateData) {
    updateData.points = toCount(updateData.points)
    if (updateData.points === null) return NextResponse.json({ error: 'عدد النقاط مطلوب' }, { status: 400 })
  }
  // empty optional fields are cleared instead of failing number/enum validation
  for (const k of ['age', 'governorate']) if (updateData[k] === '') updateData[k] = null

  if (isAdmin && body.status) {
    updateData.reviewedBy = session.user.id
    updateData.reviewedAt = new Date()
  }

  let q = Case.findByIdAndUpdate(params.id, updateData, { new: true, runValidators: true })
  if (!isAdmin) q = q.select('-points')
  try {
    const updated = await q
    return NextResponse.json(updated)
  } catch (err) {
    return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 })
  }
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
