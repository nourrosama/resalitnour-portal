// Run with: node scripts/seed.js
// Creates the first admin account

const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
require('dotenv').config({ path: '.env.local' })

const MONGODB_URI = process.env.MONGODB_URI

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: String,
  isActive: Boolean,
  mustChangePassword: Boolean,
  createdAt: Date,
})

const User = mongoose.models.User || mongoose.model('User', UserSchema)

async function seed() {
  await mongoose.connect(MONGODB_URI)
  console.log('✅ Connected to MongoDB')

  const existing = await User.findOne({ role: 'admin' })
  if (existing) {
    console.log('⚠️  Admin account already exists:', existing.email)
    process.exit(0)
  }

  const hashedPassword = await bcrypt.hash('Admin@1234', 10)
  await User.create({
    name: 'مدير النظام',
    email: 'admin@resalitnour.org',
    password: hashedPassword,
    role: 'admin',
    isActive: true,
    mustChangePassword: true,
    createdAt: new Date(),
  })

  console.log('✅ Admin account created!')
  console.log('   Email:    admin@resalitnour.org')
  console.log('   Password: Admin@1234')
  console.log('   ⚠️  Change the password after first login!')
  process.exit(0)
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
