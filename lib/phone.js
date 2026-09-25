// Egyptian numbers: 01xxxxxxxxx -> +201xxxxxxxxx (safe to import from client components)
export function toInternational(phone) {
  let p = String(phone || '').replace(/[^\d+]/g, '')
  if (p.startsWith('00')) p = '+' + p.slice(2)
  if (p.startsWith('+')) return p
  if (p.startsWith('20') && p.length === 12) return '+' + p
  if (p.startsWith('01') && p.length === 11) return '+2' + p
  return p ? '+' + p : ''
}

export function whatsappLink(phone, text) {
  return `https://wa.me/${toInternational(phone).replace('+', '')}?text=${encodeURIComponent(text)}`
}

export function smsLink(phone, text) {
  return `sms:${toInternational(phone)}?body=${encodeURIComponent(text)}`
}

// Egyptian mobile: 01[0|1|2|5] + 8 digits (11 digits), also accepts +20 / 0020 forms
export function isValidEgyptMobile(phone) {
  return /^\+201[0125]\d{8}$/.test(toInternational(phone))
}
