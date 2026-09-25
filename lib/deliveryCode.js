import crypto from 'crypto'
import mongoose from 'mongoose'
import Delivery from '../models/Delivery'
import { sendSms, deliverySmsText } from './sms'

// I and O are left out so codes can't be confused with 1 and 0
const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'

export function normalizeCode(code) {
  return String(code || '').replace(/\s+/g, '').toUpperCase()
}

function randomLetters() {
  return LETTERS[crypto.randomInt(LETTERS.length)] + LETTERS[crypto.randomInt(LETTERS.length)]
}

// 2 random letters for a new delivery, not used by any other delivery of this user
// (falls back to "not used by an open delivery" if all 576 combinations were used)
export async function generateDeliveryPrefix(userId) {
  const used = new Set(await Delivery.find({ userId }).distinct('codePrefix'))
  const usedOpen = new Set(await Delivery.find({ userId, status: 'scheduled' }).distinct('codePrefix'))
  for (const taken of [used, usedOpen]) {
    const free = []
    for (const a of LETTERS) for (const b of LETTERS) if (!taken.has(a + b)) free.push(a + b)
    if (free.length) return free[crypto.randomInt(free.length)]
  }
  return randomLetters()
}

// prefix + 4 random digits, unique inside the delivery
export function generateCaseCode(prefix, usedCodes = new Set()) {
  for (let i = 0; i < 1000; i++) {
    const code = prefix + String(crypto.randomInt(0, 10000)).padStart(4, '0')
    if (!usedCodes.has(code)) {
      usedCodes.add(code)
      return code
    }
  }
  throw new Error('تعذر توليد كود فريد')
}

// Send the voucher code of one beneficiary by SMS and record the result (caller saves the delivery)
export async function sendBeneficiaryCode(delivery, beneficiary, caseDoc, orgName) {
  const text = deliverySmsText({ code: beneficiary.code, caseName: caseDoc?.name, orgName })
  if (!beneficiary.phone) {
    beneficiary.smsStatus = 'failed'
    beneficiary.smsError = 'لا يوجد رقم هاتف'
    return { ok: false, error: 'لا يوجد رقم هاتف لهذه الحالة', text }
  }
  const result = await sendSms(beneficiary.phone, text)
  beneficiary.smsStatus = result.ok ? (result.queued ? 'queued' : 'sent') : result.manual ? 'manual' : 'failed'
  beneficiary.smsError = result.ok || result.manual ? undefined : result.error
  if (result.gatewayId) beneficiary.smsGatewayId = result.gatewayId
  if (result.state) beneficiary.smsState = result.state
  if (result.ok && !result.queued) beneficiary.smsSentAt = new Date()
  return { ...result, text }
}

// One-time conversion of deliveries created with the old single-case format
// ({ caseId, code, phone, smsStatus, ... } at the top level) into the beneficiaries[] format.
export async function migrateLegacyDeliveries() {
  const col = Delivery.collection
  const legacy = await col.find({ caseId: { $exists: true }, beneficiaries: { $exists: false } }).toArray()
  if (!legacy.length) return 0
  const Case = mongoose.models.Case
  for (const d of legacy) {
    const caseDoc = Case ? await Case.findById(d.caseId).select('submittedBy phone').lean() : null
    const userId = d.userId || caseDoc?.submittedBy
    if (!userId) continue
    const prefix = await generateDeliveryPrefix(userId)
    const done = d.status && d.status !== 'scheduled'
    await col.updateOne({ _id: d._id }, {
      $set: {
        userId,
        codePrefix: prefix,
        items: d.items ? [{ name: String(d.items) }] : [],
        beneficiaries: [{
          _id: new mongoose.Types.ObjectId(),
          caseId: d.caseId,
          code: generateCaseCode(prefix),
          phone: d.phone || caseDoc?.phone || '',
          smsStatus: 'not_sent',
          status: done ? 'delivered' : 'pending',
          deliveredAt: done ? (d.deliveredAt || d.createdAt) : undefined,
          completedBy: d.completedBy,
        }],
      },
      $unset: { caseId: '', code: '', phone: '', smsStatus: '', smsSentAt: '', smsError: '', completedBy: '' },
    })
  }
  // the old unique index on the top-level "code" field is no longer used
  await col.dropIndex('code_1').catch(() => {})
  return legacy.length
}

// Close the delivery when every beneficiary has received it
export function closeIfComplete(delivery) {
  if (delivery.status === 'scheduled' && delivery.beneficiaries.length > 0 &&
      delivery.beneficiaries.every(b => b.status === 'delivered')) {
    delivery.status = 'delivered'
    delivery.deliveredAt = new Date()
  }
}

// Voucher codes/phones must come from the beneficiary — never send them to the user
export function sanitizeForUser(d) {
  const o = typeof d.toObject === 'function' ? d.toObject() : d
  return {
    ...o,
    beneficiaries: (o.beneficiaries || []).map(({ code, phone, smsError, smsStatus, smsSentAt, smsGatewayId, smsState, ...b }) => b),
  }
}
