// Server-only: seed + load the global جدول الأصناف والحدود
import mongoose from 'mongoose'
import CatalogItem from '../models/CatalogItem'
import { DEFAULT_CATALOG } from './catalog'

// Fill the catalog from the association's sheet the first time only
// (a flag in "appsettings" keeps it from coming back if the admin empties the table)
export async function ensureCatalog() {
  const settings = mongoose.connection.collection('appsettings')
  const res = await settings.updateOne({ _id: 'catalogSeeded' }, { $setOnInsert: { at: new Date() } }, { upsert: true })
  if (!res.upsertedCount) return
  if (await CatalogItem.estimatedDocumentCount()) return
  await CatalogItem.insertMany(
    DEFAULT_CATALOG.map(([name, unit, weight, points, limits], i) => ({ name, unit, weight, points, limits, order: i + 1 })),
    { ordered: false },
  ).catch(() => {})
}

export async function loadCatalog() {
  await ensureCatalog()
  return CatalogItem.find().sort({ order: 1, createdAt: 1 }).lean()
}
