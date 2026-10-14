// جدول الأصناف والحدود helpers. Client-safe parts (no DB imports).

export const FAMILY_COLUMNS = ['فرد', 'فردين', 'ثلاثة أفراد', 'أربعة أفراد', 'خمسة أفراد', 'ستة أفراد', 'سبعة أفراد وأكثر']

// The table from the association's sheet (used to fill the catalog the first time)
// [name, unit, weight, points, [1, 2, 3, 4, 5, 6, 7+]]
export const DEFAULT_CATALOG = [
  ['ارز', 'كيس', '800 جرام', 5, [1, 2, 3, 4, 5, 5, 5]],
  ['مكرونة', 'كيس', '350 جرام', 2, [1, 1, 2, 3, 3, 4, 5]],
  ['شعرية 350 جم', 'كيس', '350 جرام', 2, [1, 1, 1, 1, 1, 2, 3]],
  ['لوبيا', 'كيس', '400 جرام', 5, [1, 1, 1, 1, 1, 2, 2]],
  ['سكر', 'كيس', '400 جرام', 3, [1, 1, 2, 2, 3, 3, 4]],
  ['زيت 500 مل', 'زجاجة', '500 ملي', 10, [1, 1, 1, 2, 2, 3, 3]],
  ['دقيق', 'كجم', '1000 جرام', 5, [1, 1, 1, 1, 2, 2, 2]],
  ['عدس ص', 'كيس', '400 جرام', 4, [1, 1, 1, 1, 2, 2, 2]],
  ['عسل اسود 350 جم', 'علبة', '350 جرام', 4, [1, 1, 1, 1, 1, 2, 2]],
  ['كاندبيف 340 جم', 'علبة', '340 جرام', 8, [1, 1, 2, 2, 3, 3, 4]],
  ['جبنة فيتا 250 جم', 'علبة', '250 جرام', 3, [1, 1, 2, 2, 3, 3, 4]],
  ['لسان عصفور', 'كيس', '350 جرام', 2, [1, 1, 1, 1, 2, 2, 3]],
  ['صلصة 400 جم', 'برطمان', '400 جرام', 7, [0, 1, 1, 1, 1, 1, 1]],
  ['شاي 100 جم', 'عبوة', '100 جرام', 3, [1, 1, 1, 1, 1, 1, 1]],
  ['فول', 'كجم', '400 جرام', 3, [1, 1, 1, 1, 1, 1, 1]],
  ['زبيب 250 جم', 'كجم', '250 جرام', 10, [1, 1, 1, 1, 1, 1, 1]],
  ['ملح 400 جم', 'كيس', '400 جرام', 1, [1, 1, 1, 1, 1, 1, 1]],
]

// Column index for a family size: 1 → 0 … 7 or more → 6. null when unknown.
export function familyIndex(familyMembers) {
  const n = Number(familyMembers)
  if (!Number.isFinite(n) || n < 1) return null
  return Math.min(7, Math.floor(n)) - 1
}

// الحد الأقصى of one catalog item for a family size (null = no rule / unknown family size)
export function limitFor(limits, familyMembers) {
  const i = familyIndex(familyMembers)
  if (i === null || !Array.isArray(limits)) return null
  const v = Number(limits[i])
  return Number.isFinite(v) ? v : null
}

// Normalise Arabic names for matching old المخزن rows to catalog rows
export function normName(s) {
  return String(s || '')
    .replace(/[ً-ْـ]/g, '')
    .replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
    .replace(/[0-9٠-٩]+/g, ' ').replace(/\b(جم|مل|جرام|كجم)\b/g, ' ')
    .replace(/\s+/g, ' ').trim()
}
export function firstWord(s) {
  return normName(s).split(' ')[0] || ''
}

// Report for one delivery: per item what was offered (المخزن when the delivery opened),
// how much the beneficiaries took and how much was left (stayed in المخزن).
function qtyNum(q) {
  if (typeof q === 'number') return q
  const s = String(q ?? '').replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace('٫', '.')
  const m = s.match(/\d+(\.\d+)?/)
  return m ? Number(m[0]) : 0
}
const r3 = n => Math.round(n * 1000) / 1000
export function deliveryReport(delivery) {
  const rows = new Map()
  ;(delivery.items || []).forEach((it, idx) => {
    const k = it.stockItemId ? String(it.stockItemId) : `i${idx}`
    rows.set(k, { name: it.name, unit: it.unit, offered: qtyNum(it.quantity), taken: 0, points: 0 })
  })
  for (const b of delivery.beneficiaries || []) {
    for (const t of b.takenItems || []) {
      const k = t.stockItemId ? String(t.stockItemId) : `i${t.itemIndex}`
      if (!rows.has(k)) rows.set(k, { name: t.name, unit: t.unit, offered: 0, taken: 0, points: 0 })
      const r = rows.get(k)
      r.taken = r3(r.taken + (Number(t.quantity) || 0))
      r.points = r3(r.points + (Number(t.quantity) || 0) * (Number(t.points) || 0))
    }
  }
  return [...rows.values()].map(r => ({ ...r, remaining: r3(Math.max(0, r.offered - r.taken)) }))
}
