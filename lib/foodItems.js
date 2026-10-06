// Options for "الأصناف" in the delivery form. "أخرى" lets the admin type a custom item.
export const FOOD_ITEMS = [
  'أرز', 'مكرونة', 'عدس', 'شاي', 'سكر', 'لوبيا', 'صلصة', 'جبنة', 'بيف', 'ملح', 'زيت', 'لحمة', 'فراخ',
  'فول', 'فاصوليا', 'حمص', 'دقيق', 'سمن', 'تونة', 'شعرية', 'بلح', 'مربى', 'حلاوة طحينية',
  'لبن', 'بيض', 'عسل', 'بسكويت', 'خضروات', 'فاكهة',
]
export const OTHER_ITEM = 'أخرى'

export function itemsToText(items) {
  if (!Array.isArray(items) || items.length === 0) return ''
  return items.map(i => (i.quantity ? `${i.name} (${i.quantity})` : i.name)).join('، ')
}

// Number inside a quantity ("2", "٢", "2.5 كيلو"); 0 if none
export function parseQty(q) {
  if (q == null || q === '') return 0
  const s = String(q).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace('٫', '.')
  const m = s.match(/\d+(\.\d+)?/)
  return m ? Number(m[0]) : 0
}

// الكمية × عدد النقاط for one item
export function itemPoints(item) {
  return parseQty(item?.quantity) * (Number(item?.points) || 0)
}

// إجمالي نقاط التسليم = sum of (الكمية × عدد النقاط)
export function itemsTotalPoints(items) {
  return (items || []).reduce((s, i) => s + itemPoints(i), 0)
}

// عدد النقاط of a delivery = sum of the beneficiary cases' points
export function casesPoints(cases) {
  return (cases || []).reduce((s, c) => s + (Number(c?.points) || 0), 0)
}
