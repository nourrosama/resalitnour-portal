import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '../../../lib/auth'
import connectDB from '../../../lib/mongodb'
import Delivery from '../../../models/Delivery'
import Case from '../../../models/Case'
import User from '../../../models/User'
import {
  generateDeliveryPrefix, generateCaseCode, sendBeneficiaryCode, migrateLegacyDeliveries, sanitizeForUser,
} from '../../../lib/deliveryCode'
import { itemsTotalPoints, casesPoints } from '../../../lib/foodItems'
import StockItem from '../../../models/StockItem'
import { reservedByItem, round } from '../../../lib/stock'

// Sending waits for the gateway phone to confirm (~12s); allow longer than the default on hosts like Vercel
export const maxDuration = 30

// GET /api/deliveries
//   ?status=open|closed   open = scheduled, closed = delivered/confirmed
//   ?month=YYYY-MM        filter (closed: by closing date, otherwise by creation date)
//   ?caseId=...           deliveries that include this case
//   ?userId=...           admin only: one user's deliveries
export async function GET(req) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  await connectDB()
  await migrateLegacyDeliveries()

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const month = searchParams.get('month')
  const caseId = searchParams.get('caseId')
  const isAdmin = session.user.role === 'admin'

  const query = {}
  const ownerId = isAdmin ? searchParams.get('userId') : session.user.id
  if (ownerId) query.userId = ownerId
  if (caseId) query['beneficiaries.caseId'] = caseId
  if (status === 'open') query.status = 'scheduled'
  if (status === 'closed') query.status = { $in: ['delivered', 'confirmed'] }
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split('-').map(Number)
    query[status === 'closed' ? 'deliveredAt' : 'createdAt'] = { $gte: new Date(y, m - 1, 1), $lt: new Date(y, m, 1) }
  }

  const deliveries = await Delivery.find(query)
    .populate('beneficiaries.caseId', isAdmin ? 'code name caseType phone points familyMembers' : 'code name caseType phone familyMembers')
    .populate('deliveredBy', 'name')
    .sort({ createdAt: -1 })

  return NextResponse.json(isAdmin ? deliveries : deliveries.map(sanitizeForUser))
}

// POST /api/deliveries (admin)
// { userId, beneficiaries: [{ caseId, phone }], deliveryType, items: [{ stockItemId, quantity, points? }],
//   location, scheduledFor, notes, sendSms }
export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  await connectDB()
  const { userId, beneficiaries = [], items = [], sendSms: shouldSend, ...body } = await req.json()

  const owner = await User.findById(userId).select('name organization')
  if (!owner) return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })

  // unique cases, all belonging to this user
  const wanted = [...new Map(beneficiaries.filter(b => b?.caseId).map(b => [String(b.caseId), b])).values()]
  if (!wanted.length) return NextResponse.json({ error: 'اختر حالة واحدة على الأقل' }, { status: 400 })
  const cases = await Case.find({ _id: { $in: wanted.map(b => b.caseId) }, submittedBy: userId })
  if (cases.length !== wanted.length) {
    return NextResponse.json({ error: 'بعض الحالات المختارة لا تخص هذا المستخدم' }, { status: 400 })
  }
  const caseById = Object.fromEntries(cases.map(c => [String(c._id), c]))

  // الأصناف come from this user's المخزن; each quantity must fit in what is still available
  // (stock minus what other open deliveries have reserved)
  const wantedItems = items.filter(i => i?.stockItemId && Number(i.quantity) > 0)
  if (!wantedItems.length) return NextResponse.json({ error: 'اختر صنفًا واحدًا على الأقل من المخزن' }, { status: 400 })
  const stockRows = await StockItem.find({ _id: { $in: wantedItems.map(i => i.stockItemId) }, userId })
  const stockById = Object.fromEntries(stockRows.map(r => [String(r._id), r]))
  const reserved = await reservedByItem(userId)
  const cleanItems = []
  for (const i of wantedItems) {
    const row = stockById[String(i.stockItemId)]
    if (!row) return NextResponse.json({ error: 'بعض الأصناف غير موجودة في مخزن هذا المستخدم' }, { status: 400 })
    const qty = round(Number(i.quantity))
    const available = round((row.quantity || 0) - (reserved[String(row._id)] || 0))
    if (qty > available) {
      return NextResponse.json({ error: `كمية ${row.name} (${qty}) أكبر من المتاح بالمخزن (${Math.max(0, available)})` }, { status: 400 })
    }
    const pts = i.points === '' || i.points == null ? row.points : Number(i.points)
    cleanItems.push({
      stockItemId: row._id,
      name: row.name,
      unit: row.unit,
      quantity: String(qty),
      points: Number.isFinite(pts) && pts >= 0 ? pts : (row.points || 0),
    })
  }
  const totalPoints = itemsTotalPoints(cleanItems) // Σ الكمية × عدد النقاط
  const deliveryPoints = casesPoints(cases)       // Σ نقاط الحالات المستفيدة

  const codePrefix = await generateDeliveryPrefix(userId)
  const used = new Set()
  const delivery = new Delivery({
    deliveryType: body.deliveryType,
    location: body.location,
    notes: body.notes,
    scheduledFor: body.scheduledFor || undefined,
    items: cleanItems,
    totalPoints,
    deliveryPoints,
    userId,
    codePrefix,
    status: 'scheduled',
    deliveredBy: session.user.id,
    beneficiaries: wanted.map(b => ({
      caseId: b.caseId,
      code: generateCaseCode(codePrefix, used),
      phone: String(b.phone || caseById[String(b.caseId)]?.phone || '').trim(),
    })),
  })
  await delivery.save()

  let sms = null
  if (shouldSend) {
    sms = []
    for (const b of delivery.beneficiaries) {
      const r = await sendBeneficiaryCode(delivery, b, caseById[String(b.caseId)], owner.organization || owner.name)
      sms.push({ beneficiaryId: b._id, code: b.code, ...r })
    }
    await delivery.save()
  }

  const populated = await Delivery.findById(delivery._id)
    .populate('beneficiaries.caseId', 'code name caseType phone points familyMembers')
    .populate('deliveredBy', 'name')
  return NextResponse.json({ delivery: populated, sms }, { status: 201 })
}
