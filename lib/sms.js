// SMS sending with pluggable providers. Pick one with SMS_PROVIDER in .env.local:
//
//   SMS_PROVIDER=smsgate   -> "SMS Gateway for Android" (https://sms-gate.app)
//                              Free & open source: an Android phone with a SIM card sends the SMS.
//                              Cost = your normal SIM SMS bundle.
//                              SMSGATE_USER=...  SMSGATE_PASS=...  (shown in the app after "Cloud server" is enabled)
//                              SMSGATE_URL=https://api.sms-gate.app/3rdparty/v1   (optional; change for local/self-hosted mode)
//   SMS_PROVIDER=twilio    -> Twilio (paid; trial only sends to verified numbers)
//                              TWILIO_ACCOUNT_SID=...  TWILIO_AUTH_TOKEN=...  TWILIO_FROM=+1...
//   (unset / none)         -> nothing is sent; admin gets WhatsApp / SMS-app buttons to send manually

import { toInternational, isValidEgyptMobile } from './phone'

// Read an env var, tolerating spaces and surrounding quotes pasted into hosting dashboards
export function env(name) {
  return String(process.env[name] || '').trim().replace(/^['"]|['"]$/g, '').trim()
}

export function smsProvider() {
  return (env('SMS_PROVIDER') || 'none').toLowerCase()
}

// What the admin page shows at the top: is a real SMS service configured?
export function smsConfig() {
  const provider = smsProvider()
  const need = provider === 'smsgate' ? ['SMSGATE_USER', 'SMSGATE_PASS']
    : provider === 'twilio' ? ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_FROM'] : []
  const missing = need.filter(k => !env(k))
  return {
    provider,
    configured: ['smsgate', 'twilio'].includes(provider) && missing.length === 0,
    missing,
    unknownProvider: provider !== 'none' && !['smsgate', 'twilio'].includes(provider),
    // which variables this server can see (names only, never values)
    seen: Object.fromEntries(['SMS_PROVIDER', 'SMSGATE_USER', 'SMSGATE_PASS'].map(k => [k, !!env(k)])),
    deployment: process.env.VERCEL_ENV || process.env.NODE_ENV || '',
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

// Pending = waiting for the phone, Processed = phone handed it to Android (not sent yet!)
const FINAL_STATES = ['Sent', 'Delivered', 'Failed']

// Translate common Android send errors into something the admin can act on
function explainReason(reason) {
  const r = String(reason || '').toLowerCase()
  if (r.includes('service') && r.includes('unavailable')) return 'لا توجد شبكة على شريحة هاتف البوابة (تأكد من وجود شريحة مفعّلة وإشارة، وأن وضع الطيران مغلق)'
  if (r.includes('no sim') || r.includes('sim')) return 'مشكلة في شريحة هاتف البوابة'
  if (r.includes('radio off') || r.includes('airplane')) return 'الشبكة مغلقة على هاتف البوابة (وضع الطيران؟)'
  if (r.includes('permission')) return 'تطبيق البوابة لا يملك صلاحية إرسال الرسائل'
  if (r.includes('generic')) return 'فشل عام من شبكة المحمول (غالبًا لا يوجد رصيد كافٍ)'
  return reason || 'فشل الإرسال من الهاتف'
}

function smsgateAuth() {
  return {
    base: env('SMSGATE_URL') || 'https://api.sms-gate.app/3rdparty/v1',
    auth: Buffer.from(`${env('SMSGATE_USER')}:${env('SMSGATE_PASS')}`).toString('base64'),
  }
}

// Turn a gateway state object into our result shape
function smsgateResult(id, st) {
  const state = st?.state || 'Pending'
  if (state === 'Failed') {
    const raw = st?.reason || st?.recipients?.find(r => r.error)?.error || st?.error
    return { ok: false, error: explainReason(raw), gatewayId: id, state }
  }
  if (state === 'Sent' || state === 'Delivered') return { ok: true, gatewayId: id, state }
  return { ok: true, queued: true, gatewayId: id, state } // Pending / Processed: not sent yet
}

// Re-check a message later (used by the "تحديث الحالة" button)
export async function checkSmsgateMessage(id) {
  const { base, auth } = smsgateAuth()
  const r = await fetch(`${base}/messages/${id}`, { headers: { Authorization: `Basic ${auth}` }, cache: 'no-store' })
  if (!r.ok) return { ok: false, error: `SMS Gateway: ${r.status}`, gatewayId: id }
  const st = await r.json()
  console.log(`[SMS] smsgate refresh id=${id} state=${st.state} details=${JSON.stringify(st.recipients)}`)
  return smsgateResult(id, st)
}

// SMS Gateway only *queues* the message; the Android phone has to pick it up and send it.
// Poll its state for a few seconds so the admin sees what really happened.
async function smsgateState(base, auth, id) {
  let last = null
  for (let i = 0; i < 6; i++) {
    await sleep(2000)
    try {
      const r = await fetch(`${base}/messages/${id}`, { headers: { Authorization: `Basic ${auth}` }, cache: 'no-store' })
      if (!r.ok) continue
      last = await r.json()
      if (FINAL_STATES.includes(last.state)) break
    } catch {}
  }
  return last
}

// Returns { ok: true, queued?, gatewayId?, state? } | { ok: false, manual: true } | { ok: false, error }
export async function sendSms(phone, text) {
  const to = toInternational(phone)
  if (!to || !isValidEgyptMobile(phone)) return { ok: false, error: 'رقم الهاتف غير صالح (يجب أن يكون 11 رقمًا ويبدأ بـ 010 أو 011 أو 012 أو 015)' }

  const provider = smsProvider()
  const cfg = smsConfig()
  if (provider !== 'none' && !cfg.configured) {
    console.warn(`[SMS] provider=${provider} but missing: ${cfg.missing.join(', ')}`)
    return { ok: false, error: `إعدادات خدمة الرسائل ناقصة: ${cfg.missing.join(', ')}` }
  }
  try {
    if (provider === 'smsgate') {
      const { base, auth } = smsgateAuth()
      const res = await fetch(`${base}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
        body: JSON.stringify({ textMessage: { text }, phoneNumbers: [to] }),
      })
      if (!res.ok) {
        const body = await res.text()
        console.error(`[SMS] smsgate POST failed ${res.status}: ${body}`)
        return { ok: false, error: res.status === 401 ? 'اسم المستخدم أو كلمة المرور الخاصة ببوابة الرسائل غير صحيحة' : `SMS Gateway: ${res.status} ${body}` }
      }
      const queued = await res.json().catch(() => ({}))
      console.log(`[SMS] smsgate queued id=${queued.id} to=${to} state=${queued.state}`)
      const st = queued.id ? await smsgateState(base, auth, queued.id) : null
      console.log(`[SMS] smsgate id=${queued.id} final state=${st?.state || queued.state} details=${JSON.stringify(st)}`)
      return smsgateResult(queued.id, st || queued)
    }

    if (provider === 'twilio') {
      const sid = env('TWILIO_ACCOUNT_SID')
      const auth = Buffer.from(`${sid}:${env('TWILIO_AUTH_TOKEN')}`).toString('base64')
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: `Basic ${auth}` },
        body: new URLSearchParams({ To: to, From: env('TWILIO_FROM'), Body: text }),
      })
      if (!res.ok) return { ok: false, error: `Twilio: ${res.status} ${await res.text()}` }
      return { ok: true }
    }
  } catch (e) {
    return { ok: false, error: e.message }
  }

  console.log(`[SMS] SMS_PROVIDER not set — nothing sent to ${to} (manual mode)`)
  return { ok: false, manual: true }
}

export function deliverySmsText({ code, caseName, orgName }) {
  return `رسالة نور للتنمية: ${caseName ? caseName + '، ' : ''}كود استلام المساعدة الخاص بك هو ${code}. يرجى تقديمه عند الاستلام${orgName ? ' لدى ' + orgName : ''}.`
}
