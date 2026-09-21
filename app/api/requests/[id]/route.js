import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '../../../../lib/auth'
import connectDB from '../../../../lib/mongodb'
import Request from '../../../../models/Request'

export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'غير مصرح - الإدارة فقط' }, { status: 403 })
  }

  await connectDB()
  const body = await req.json()
  const updated = await Request.findByIdAndUpdate(
    params.id,
    {
      $set: {
        ...body,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
      },
    },
    { new: true }
  )
    .populate('caseId', 'code name')
    .populate('submittedBy', 'name email')

  return NextResponse.json(updated)
}
