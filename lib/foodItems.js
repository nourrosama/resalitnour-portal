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
