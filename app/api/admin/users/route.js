import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '../../../../lib/auth'
import connectDB from '../../../../lib/mongodb'
import User from '../../../../models/User'
import Case from '../../../../models/Case'

// GET /api/admin/users — all non-admin users with per-user case counts
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  await connectDB()
  const users = await User.find({ role: { $ne: 'admin' } }, '-password').sort({ createdAt: -1 }).lean()

  const counts = await Case.aggregate([
    {
      $group: {
        _id: '$submittedBy',
        total: { $sum: 1 },
        pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
      },
    },
  ])
  const byUser = Object.fromEntries(counts.map(c => [String(c._id), c]))

  return NextResponse.json(
    users.map(u => {
      const c = byUser[String(u._id)] || {}
      return {
        ...u,
        stats: { total: c.total || 0, pending: c.pending || 0, active: c.active || 0, approved: c.approved || 0 },
      }
    })
  )
}
