// المخزن helpers (server only)
import mongoose from 'mongoose'
import StockItem from '../models/StockItem'
import Delivery from '../models/Delivery'
import User from '../models/User'
import { FOOD_ITEMS } from './foodItems'

// First time a user's المخزن is opened, fill it with the default الأصناف (quantity 0)
export async function seedStock(userId) {
  const res = await User.updateOne({ _id: userId, stockSeeded: { $ne: true } }, { $set: { stockSeeded: true } })
  if (!res.modifiedCount) return
  const existing = new Set((await StockItem.find({ userId }).select('name').lean()).map(s => s.name))
  const docs = FOOD_ITEMS.filter(n => !existing.has(n)).map(name => ({ userId, name, unit: 'كيلو', quantity: 0, points: 0 }))
  if (docs.length) await StockItem.insertMany(docs, { ordered: false }).catch(() => {})
}

// How much of each stock item is still reserved by OPEN deliveries
// (delivery quantity minus what beneficiaries already took). Map stockItemId -> number
export async function reservedByItem(userId, excludeDeliveryId) {
  const q = { userId: new mongoose.Types.ObjectId(String(userId)), status: 'scheduled', 'items.stockItemId': { $exists: true } }
  if (excludeDeliveryId) q._id = { $ne: excludeDeliveryId }
  const open = await Delivery.find(q).select('items beneficiaries.takenItems').lean()
  const map = {}
  for (const d of open) {
    const remaining = remainingPerItem(d)
    d.items.forEach((it, idx) => {
      if (!it.stockItemId) return
      const k = String(it.stockItemId)
      map[k] = (map[k] || 0) + Math.max(0, remaining[idx])
    })
  }
  return map
}

// For one delivery: how much of each item (by index) has not been handed out yet
export function remainingPerItem(delivery) {
  const taken = {}
  for (const b of delivery.beneficiaries || []) {
    for (const t of b.takenItems || []) taken[t.itemIndex] = (taken[t.itemIndex] || 0) + (Number(t.quantity) || 0)
  }
  return (delivery.items || []).map((it, idx) => round(numQty(it.quantity) - (taken[idx] || 0)))
}

export function numQty(q) {
  if (typeof q === 'number') return q
  const s = String(q ?? '').replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace('٫', '.')
  const m = s.match(/\d+(\.\d+)?/)
  return m ? Number(m[0]) : 0
}

export function round(n) {
  return Math.round(n * 1000) / 1000
}

// Stock list with reserved / available-for-new-deliveries figures
export async function stockWithReserved(userId) {
  const [items, reserved] = await Promise.all([
    StockItem.find({ userId }).sort({ createdAt: 1, name: 1 }).lean(),
    reservedByItem(userId),
  ])
  return items.map(s => {
    const r = round(reserved[String(s._id)] || 0)
    return { ...s, reserved: r, available: round(Math.max(0, (s.quantity || 0) - r)) }
  })
}
