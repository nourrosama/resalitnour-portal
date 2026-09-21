import mongoose from 'mongoose'

const DeliverySchema = new mongoose.Schema({
  caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', required: true },
  deliveryType: { type: String, required: true }, // e.g. 'شهري', 'موسمي'
  items: { type: String }, // description of what was delivered
  amount: { type: Number },
  deliveredAt: { type: Date, default: Date.now },
  deliveredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String },
  status: {
    type: String,
    enum: ['scheduled', 'delivered', 'confirmed', 'failed'],
    default: 'scheduled',
  },
  createdAt: { type: Date, default: Date.now },
})

export default mongoose.models.Delivery || mongoose.model('Delivery', DeliverySchema)
