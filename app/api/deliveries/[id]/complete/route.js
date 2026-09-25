import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '../../../../../lib/auth'
import connectDB from '../../../../../lib/mongodb'
import Delivery from '../../../../../models/Delivery'
import { normalizeCode, closeIfComplete } from '../../../../../lib/deliveryCode'

// POST /api/deliveries/[id]/complete  { code, notes? }
// Marks that beneficiary as delivered; the delivery closes when all beneficiaries have received it.
export async function POST(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  await connectDB()
  const { code, notes } = await req.json()
  const delivery = await Delivery.findById(params.id)
  if (!delivery) return NextResponse.json({ error: 'التسليم غير موجود' }, { status: 404 })
  if (session.user.role !== 'admin' && String(delivery.userId) !== session.user.id) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const b = delivery.beneficiaries.find(x => x.code === normalizeCode(code))
  if (!b) return NextResponse.json({ error: 'الكود غير صحيح' }, { status: 400 })
  if (b.status === 'delivered') return NextResponse.json({ error: 'تم استلام هذه القسيمة بالفعل' }, { status: 409 })
  if (delivery.status !== 'scheduled') return NextResponse.json({ error: 'هذا الطلب مغلق' }, { status: 409 })

  b.status = 'delivered'
  b.deliveredAt = new Date()
  b.completedBy = session.user.id
  if (notes) b.notes = notes
  closeIfComplete(delivery)
  await delivery.save()

  return NextResponse.json({
    ok: true,
    requestNo: delivery.requestNo,
    closed: delivery.status !== 'scheduled',
    delivered: delivery.beneficiaries.filter(x => x.status === 'delivered').length,
    total: delivery.beneficiaries.length,
  })
}
