import mongoose from 'mongoose'

// All case types matching EFB portal categories
export const CASE_TYPES = {
  // Monthly
  MONTHLY_GENERAL: 'الحالات الشهرية',
  MONTHLY_FEMALE_BREADWINNER: 'الحاله الشهرية (المرأة المعيلة)',
  MONTHLY_DISABILITY: 'الحاله الشهرية (العجز والإعاقة)',
  MONTHLY_STUDENTS: 'الحاله الشهرية (الطلبة الوافدين)',
  MONTHLY_ELDERLY: 'الحاله الشهرية (كبار السن)',
  MONTHLY_KITCHEN: 'الحاله الشهرية (التكية)',
  MONTHLY_DWARFISM: 'مشروع التقزم',
  // Seasonal
  SEASONAL_GENERAL: 'الحالات الموسمية',
  SEASONAL_FEMALE_BREADWINNER: 'الحاله الموسمية (المرأة المعيلة)',
  SEASONAL_DISABILITY: 'الحاله الموسمية (العجز والإعاقة)',
  SEASONAL_STUDENTS: 'الحاله الموسمية (الطلبة الوافدين)',
  SEASONAL_ELDERLY: 'الحاله الموسمية (كبار السن)',
  SEASONAL_KITCHEN: 'مشروع التكية الموسمية',
}

export const GOVERNORATES = [
  'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'البحر الأحمر',
  'البحيرة', 'الفيوم', 'الغربية', 'الإسماعيلية', 'المنوفية',
  'المنيا', 'القليوبية', 'الوادي الجديد', 'السويس', 'أسوان',
  'أسيوط', 'بني سويف', 'بورسعيد', 'دمياط', 'الشرقية',
  'جنوب سيناء', 'كفر الشيخ', 'مطروح', 'الأقصر', 'قنا',
  'شمال سيناء', 'سوهاج',
]

const CaseSchema = new mongoose.Schema({
  code: { type: String, unique: true },
  name: { type: String, required: true },
  age: { type: Number },
  nationalId: { type: String },
  passportNumber: { type: String },
  caseType: { type: String, required: true, enum: Object.values(CASE_TYPES) },
  phone: { type: String },
  governorate: { type: String, enum: GOVERNORATES },
  address: { type: String },
  comment: { type: String },
  // Status tracking
  status: {
    type: String,
    enum: ['pending', 'active', 'approved', 'rejected', 'suspended'],
    default: 'pending',
  },
  adminDecision: { type: String },
  adminNote: { type: String },
  // Relationships
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

// Auto-generate code before saving
CaseSchema.pre('save', async function (next) {
  if (!this.code) {
    const count = await mongoose.model('Case').countDocuments()
    this.code = `RN-${String(count + 1).padStart(5, '0')}`
  }
  this.updatedAt = new Date()
  next()
})

export default mongoose.models.Case || mongoose.model('Case', CaseSchema)
