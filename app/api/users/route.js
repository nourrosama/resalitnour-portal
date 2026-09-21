import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '../../../lib/auth'
import connectDB from '../../../lib/mongodb'
import User from '../../../models/User'

export async function GET(req) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  await connectDB()
  const users = await User.find({}, '-password').sort({ createdAt: -1 })
  return NextResponse.json(users)
}

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  await connectDB()
  const { name, email, password, phone, organization, governorate } = await req.json()

  const existing = await User.findOne({ email })
  if (existing) {
    return NextResponse.json({ error: 'البريد الإلكتروني مستخدم بالفعل' }, { status: 400 })
  }

  const user = await User.create({
    name,
    email,
    password,
    phone,
    organization,
    governorate,
    role: 'user',
    isActive: true,
    mustChangePassword: true,
    createdBy: session.user.id,
  })

  const { password: _, ...userWithoutPassword } = user.toObject()
  return NextResponse.json(userWithoutPassword, { status: 201 })
}
