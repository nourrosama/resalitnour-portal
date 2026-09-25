import mongoose from 'mongoose'

// One تسليمة (delivery) = one distribution for one user (organization), covering one or more cases.
//
// Voucher code per case = <2 letters of the delivery> + <4 digits of the case>, e.g. KT4821
//   - codePrefix: 2 random English letters, the same for every case in this delivery,
//                 unique among this user's deliveries
//   - beneficiaries[].code: prefix + 4 random digits, unique inside the delivery
//
// Lifecycle:
//   beneficiary: pending -> delivered (user enters the beneficiary's code at "تسليم المستفيد")
//   delivery:    scheduled ("طلبات التسليم المفتوحة") -> delivered ("طلبات التسليم المغلقة")
//                closes automatically when every beneficiary has received it

const ItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: String }, // free text, e.g. "2 كيلو"
}, { _id: false })

const BeneficiarySchema = new mongoose.Schema({
  caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', required: true },
  code: { type: String, required: true },
  phone: { type: String },
  smsStatus: { type: String, enum: ['not_sent', 'queued', 'sent', 'failed', 'manual'], default: 'not_sent' },
  smsGatewayId: { type: String },
  smsState: { type: String }, // raw gateway state: Pending / Processed / Sent / Delivered / Failed
  smsSentAt: { type: Date },
  smsError: { type: String },
  status: { type: String, enum: ['pending', 'delivered'], default: 'pending' },
  deliveredAt: { type: Date },
  completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String },
})

const DeliverySchema = new mongoose.Schema({
  requestNo: { type: String, unique: true, sparse: true }, // رقم الطلب, e.g. DL-00001
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, // owner organization
  codePrefix: { type: String, required: true },
  deliveryType: { type: String, required: true }, // اسم الطلب / نوع التسليم
  items: [ItemSchema], // الأصناف
  amount: { type: Number },
  location: { type: String }, // مكان التسليم
  scheduledFor: { type: Date }, // شهر/سنة التسليم
  notes: { type: String },
  beneficiaries: [BeneficiarySchema],

  status: {
    type: String,
    enum: ['scheduled', 'delivered', 'confirmed', 'failed'],
    default: 'scheduled',
  },
  deliveredAt: { type: Date }, // when the delivery closed
  deliveredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // admin who created it
  createdAt: { type: Date, default: Date.now },
})

DeliverySchema.index({ userId: 1, codePrefix: 1 })
DeliverySchema.index({ userId: 1, 'beneficiaries.code': 1 })

DeliverySchema.pre('save', async function (next) {
  if (!this.requestNo) {
    const last = await mongoose.model('Delivery').findOne({ requestNo: /^DL-\d+$/ }).sort({ requestNo: -1 }).select('requestNo').lean()
    const n = last ? parseInt(last.requestNo.slice(3), 10) + 1 : 1
    this.requestNo = `DL-${String(n).padStart(5, '0')}`
  }
  next()
})

// In dev, hot reload keeps the previously compiled model in memory. If that cached model
// was built from an older schema (no beneficiaries[]), drop it so the new schema is used.
if (mongoose.models.Delivery && !mongoose.models.Delivery.schema.path('beneficiaries.smsState')) {
  mongoose.deleteModel('Delivery')
}

export default mongoose.models.Delivery || mongoose.model('Delivery', DeliverySchema)
