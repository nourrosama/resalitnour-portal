// Shared (client-safe) options for case forms
export const MONTHLY_TYPES = [
  'الحالات الشهرية',
  'الحاله الشهرية (المرأة المعيلة)',
  'الحاله الشهرية (العجز والإعاقة)',
  'الحاله الشهرية (الطلبة الوافدين)',
  'الحاله الشهرية (كبار السن)',
  'الحاله الشهرية (التكية)',
  'مشروع التقزم',
]

export const SEASONAL_TYPES = [
  'الحالات الموسمية',
  'الحاله الموسمية (المرأة المعيلة)',
  'الحاله الموسمية (العجز والإعاقة)',
  'الحاله الموسمية (الطلبة الوافدين)',
  'الحاله الموسمية (كبار السن)',
  'مشروع التكية الموسمية',
]

export const GOVERNORATES = [
  'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'البحر الأحمر',
  'البحيرة', 'الفيوم', 'الغربية', 'الإسماعيلية', 'المنوفية',
  'المنيا', 'القليوبية', 'الوادي الجديد', 'السويس', 'أسوان',
  'أسيوط', 'بني سويف', 'بورسعيد', 'دمياط', 'الشرقية',
  'جنوب سيناء', 'كفر الشيخ', 'مطروح', 'الأقصر', 'قنا',
  'شمال سيناء', 'سوهاج',
]

// Fields a regular user may fill / correct on their own case (no points, no status)
export const USER_EDITABLE_FIELDS = [
  'name', 'age', 'nationalId', 'passportNumber', 'caseType', 'phone',
  'governorate', 'address', 'comment', 'familyMembers',
]

// Returns a non-negative integer, or null if the value is empty/invalid
export function toCount(v) {
  if (v === '' || v == null) return null
  const n = Number(v)
  return Number.isInteger(n) && n >= 0 ? n : null
}
