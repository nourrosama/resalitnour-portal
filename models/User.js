import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  phone: { type: String },
  organization: { type: String },
  governorate: { type: String },
  isActive: { type: Boolean, default: true },
  mustChangePassword: { type: Boolean, default: true },
  stockSeeded: { type: Boolean, default: false }, // المخزن filled with the default الأصناف once
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
})

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 10)
  next()
})

UserSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password)
}

// dev hot reload: drop a cached model that predates stockSeeded
if (mongoose.models.User && !mongoose.models.User.schema.path('stockSeeded')) {
  mongoose.deleteModel('User')
}

export default mongoose.models.User || mongoose.model('User', UserSchema)
