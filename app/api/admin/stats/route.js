import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '../../../../lib/auth'
import connectDB from '../../../../lib/mongodb'
import Case from '../../../../models/Case'
import { CASE_TYPES } from '../../../../models/Case'

export async function GET(req) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  await connectDB()

  // For regular users, scope to their own cases
  // Admins can scope to one user with ?userId=
  const { searchParams } = new URL(req.url)
  const targetUserId = searchParams.get('userId')
  const userFilter = session.user.role === 'admin'
    ? (targetUserId ? { submittedBy: targetUserId } : {})
    : { submittedBy: session.user.id }

  // Build stats per case type
  const allCases = await Case.find(userFilter)

  const buildStats = (types) => {
    return types.map((type) => {
      const typeCases = allCases.filter((c) => c.caseType === type)
      return {
        type,
        label: type,
        total: typeCases.length,
        active: typeCases.filter((c) => c.status === 'active').length,
        approved: typeCases.filter((c) => c.status === 'approved').length,
        pending: typeCases.filter((c) => c.status === 'pending').length,
        rejected: typeCases.filter((c) => c.status === 'rejected').length,
      }
    })
  }

  const monthlyTypes = Object.values(CASE_TYPES).filter((t) => t.includes('شهري') || t.includes('التقزم'))
  const seasonalTypes = Object.values(CASE_TYPES).filter((t) => t.includes('موسم') || t.includes('التكية الموسمية'))

  return NextResponse.json({
    monthly: buildStats(monthlyTypes),
    seasonal: buildStats(seasonalTypes),
    totals: {
      total: allCases.length,
      active: allCases.filter((c) => c.status === 'active').length,
      approved: allCases.filter((c) => c.status === 'approved').length,
      pending: allCases.filter((c) => c.status === 'pending').length,
      rejected: allCases.filter((c) => c.status === 'rejected').length,
    },
  })
}
