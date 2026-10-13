import mongoose from 'mongoose'

// المخزن — one row per صنف of the global جدول الأصناف (CatalogItem) in one user's storage.
// The rows are created automatically for every catalog item; the admin and the user only manage
// the quantity. name / unit / points are copies kept in sync with the catalog.
// Stock goes down when a beneficiary actually receives items at "تسليم المستفيد".
const StockItemSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  catalogItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'CatalogItem', index: true }, // empty only for old rows not in the table
  name: { type: String, required: true, trim: true },
  unit: { type: String, trim: true, default: 'كيلو' },  // الوحدة: كيلو، لتر، علبة، كرتونة...
  quantity: { type: Number, default: 0, min: 0 },       // الكمية / الوزن المتاح في المخزن
  points: { type: Number, default: 0, min: 0 },         // عدد النقاط لكل وحدة
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

StockItemSchema.index({ userId: 1, name: 1 }, { unique: true })

if (mongoose.models.StockItem && !mongoose.models.StockItem.schema.path('catalogItemId')) {
  mongoose.deleteModel('StockItem')
}

export default mongoose.models.StockItem || mongoose.model('StockItem', StockItemSchema)
