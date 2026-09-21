import mongoose from 'mongoose'

export const REQUEST_TYPES = {
  TRANSFER: 'طلب نقل حالة',
  TARGETING: 'طلب استهداف',
  DISPOSAL: 'طلب إتلاف',
}

const RequestSchema = new mongoose.Schema({
  type: { type: String, required: true, enum: Object.values(REQUEST_TYPES) },
  caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', required: true },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  details: { type: String, required: true },
  // For transfer requests
  transferToGovernorate: { type: String },
  transferReason: { type: String },
  // Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  adminNote: { type: String },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
})

export default mongoose.models.Request || mongoose.model('Request', RequestSchema)
