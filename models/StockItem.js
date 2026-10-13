import mongoose from 'mongoose'

// المخزن — one row per صنف in one user's (organization's) storage.
// Both the admin (inside the user's workspace) and the user can add / edit / remove rows.
// Stock goes down when a beneficiary actually receives items at "تسليم المستفيد".
const StockItemSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  unit: { type: String, trim: true, default: 'كيلو' },  // الوحدة: كيلو، لتر، علبة، كرتونة...
  quantity: { type: Number, default: 0, min: 0 },       // الكمية / الوزن المتاح في المخزن
  points: { type: Number, default: 0, min: 0 },         // عدد النقاط لكل وحدة
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

StockItemSchema.index({ userId: 1, name: 1 }, { unique: true })

export default mongoose.models.StockItem || mongoose.model('StockItem', StockItemSchema)
