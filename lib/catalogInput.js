// Validates a جدول الأصناف row from the admin form
export function cleanCatalogInput(body, creating) {
  const data = { updatedAt: new Date() }
  if ('name' in body || creating) {
    const name = String(body.name || '').trim()
    if (!name) return { error: 'اسم الصنف مطلوب' }
    data.name = name
  }
  if ('unit' in body) data.unit = String(body.unit || '').trim()
  if ('weight' in body) data.weight = String(body.weight || '').trim()
  if ('points' in body || creating) {
    const p = body.points === '' || body.points == null ? 0 : Number(body.points)
    if (!Number.isFinite(p) || p < 0) return { error: 'النقاط يجب أن تكون رقمًا موجبًا' }
    data.points = p
  }
  if ('limits' in body || creating) {
    const raw = Array.isArray(body.limits) ? body.limits : []
    const limits = Array.from({ length: 7 }, (_, i) => (raw[i] === '' || raw[i] == null ? 0 : Number(raw[i])))
    if (limits.some(n => !Number.isFinite(n) || n < 0)) return { error: 'الحد الأقصى يجب أن يكون رقمًا موجبًا' }
    data.limits = limits
  }
  if ('order' in body) data.order = Number(body.order) || 0
  return { data }
}
