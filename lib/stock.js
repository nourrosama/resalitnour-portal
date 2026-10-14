// المخزن helpers (server only)
import mongoose from 'mongoose'
import StockItem from '../models/StockItem'
import Delivery from '../models/Delivery'
import { loadCatalog } from './catalogServer'
import { normName, firstWord, limitFor } from './catalog'
import CatalogItem from '../models/CatalogItem'

// Make sure the user's المخزن has exactly one row per catalog item.
//  - old rows (from before the catalog) are linked by name when they match one catalog item;
//    if that catalog item already has a row, the quantities are merged
//  - old rows that match nothing are kept only if they still hold a quantity (shown as "not in the table")
export async function ensureStock(userId) {
  const uid = new mongoose.Types.ObjectId(String(userId))
  const catalog = await loadCatalog()
  const rows = await StockItem.find({ userId: uid })
  const byCatalog = new Map(rows.filter(r => r.catalogItemId).map(r => [String(r.catalogItemId), r]))

  // link old rows
  for (const r of rows.filter(x => !x.catalogItemId)) {
    const w = firstWord(r.name)
    const matches = catalog.filter(c => normName(c.name) === normName(r.name) || firstWord(c.name) === w)
    const cat = matches.length === 1 ? matches[0] : null
    if (!cat) {
      if (!(r.quantity > 0)) await r.deleteOne()
      continue
    }
    const existing = byCatalog.get(String(cat._id))
    if (existing) {
      existing.quantity = round((existing.quantity || 0) + (r.quantity || 0))
      await existing.save()
      await r.deleteOne()
    } else {
      r.catalogItemId = cat._id
      r.name = cat.name
      r.unit = cat.unit
      r.points = cat.points
      await r.save().catch(async () => { await r.deleteOne() })
      byCatalog.set(String(cat._id), r)
    }
  }

  // add missing rows
  const missing = catalog.filter(c => !byCatalog.has(String(c._id)))
  if (missing.length) {
    await StockItem.insertMany(
      missing.map(c => ({ userId: uid, catalogItemId: c._id, name: c.name, unit: c.unit, points: c.points, quantity: 0 })),
      { ordered: false },
    ).catch(() => {})
  }
  return catalog
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

// Stock list (in catalog order) with catalog data + reserved / available-for-new-deliveries figures
export async function stockWithReserved(userId) {
  const catalog = await ensureStock(userId)
  const [items, reserved] = await Promise.all([
    StockItem.find({ userId }).lean(),
    reservedByItem(userId),
  ])
  const catById = Object.fromEntries(catalog.map(c => [String(c._id), c]))
  const order = Object.fromEntries(catalog.map((c, i) => [String(c._id), i]))
  return items
    .map(s => {
      const cat = s.catalogItemId ? catById[String(s.catalogItemId)] : null
      const r = round(reserved[String(s._id)] || 0)
      return {
        ...s,
        name: cat?.name ?? s.name,
        unit: cat?.unit ?? s.unit,
        weight: cat?.weight || '',
        points: cat ? cat.points : (s.points || 0),
        limits: cat?.limits || null,
        inCatalog: !!cat,
        reserved: r,
        available: round(Math.max(0, (s.quantity || 0) - r)),
      }
    })
    .sort((a, b) => (order[String(a.catalogItemId)] ?? 1e9) - (order[String(b.catalogItemId)] ?? 1e9))
}

// Rules for each delivery item for one case, from the live جدول الأصناف:
//   { linked, limit, points, unit }
// Items made before the table existed (no catalogItemId) are matched to the table by name
// (أرز → ارز ...) so they get the same limit, points and unit. limit null = no rule
// (no matching table row, or the case has no family size).
export async function resolveDeliveryItems(delivery, familyMembers) {
  const items = delivery.items || []
  const needsName = items.some(it => !it.catalogItemId)
  const ids = items.map(it => it.catalogItemId).filter(Boolean)
  const cats = needsName
    ? await loadCatalog()
    : (ids.length ? await CatalogItem.find({ _id: { $in: ids } }).lean() : [])
  const byId = Object.fromEntries(cats.map(c => [String(c._id), c]))
  return items.map(it => {
    let cat = it.catalogItemId ? byId[String(it.catalogItemId)] : null
    const linkedById = !!cat
    if (!cat && !it.catalogItemId) {
      const m = cats.filter(c => normName(c.name) === normName(it.name) || firstWord(c.name) === firstWord(it.name))
      cat = m.length === 1 ? m[0] : null
    }
    if (!cat) return { linked: false, limit: null, points: Number(it.points) || 0, unit: it.unit }
    return {
      linked: true,
      limit: limitFor(cat.limits, familyMembers),
      // linked items keep the points saved when the delivery was made; old ones use the table
      points: linkedById ? (Number(it.points) || 0) : (Number(cat.points) || 0),
      unit: it.unit || cat.unit,
    }
  })
}
