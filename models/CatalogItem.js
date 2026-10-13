import mongoose from 'mongoose'

// جدول الأصناف والحدود — ONE global table (admin only) used by every user.
// Each user's المخزن rows point to a row here; name / unit / weight / points / limits
// always come from this table.
//
// limits[i] = الحد الأقصى for a family of (i + 1) people; limits[6] = 7 people or more.
const CatalogItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true }, // الصنف
  unit: { type: String, trim: true },                                // الوحدة: كيس، علبة، زجاجة...
  weight: { type: String, trim: true },                              // الوزن: "800 جرام"
  points: { type: Number, default: 0, min: 0 },                      // النقاط لكل وحدة
  limits: {
    type: [Number],
    default: () => [1, 1, 1, 1, 1, 1, 1],
    validate: { validator: v => Array.isArray(v) && v.length === 7 && v.every(n => Number.isFinite(n) && n >= 0), message: 'limits must be 7 numbers' },
  },
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

export default mongoose.models.CatalogItem || mongoose.model('CatalogItem', CatalogItemSchema)
