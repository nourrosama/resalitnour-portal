import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '../../../../lib/auth'
import { smsConfig } from '../../../../lib/sms'

export const dynamic = 'force-dynamic'

// GET /api/admin/sms-status — is a real SMS service configured? (no secrets returned)
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }
  return NextResponse.json(smsConfig())
}
