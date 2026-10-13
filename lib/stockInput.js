// Validates المخزن form input. requireName = true when creating.
export function cleanStockInput(body, requireName) {
  const data = {}
  if ('name' in body || requireName) {
    const name = String(body.name || '').trim()
    if (!name) return { error: 'اسم الصنف مطلوب' }
    data.name = name
  }
  if ('unit' in body) data.unit = String(body.unit || '').trim()
  for (const [k, label] of [['quantity', 'الكمية'], ['points', 'عدد النقاط']]) {
    if (!(k in body)) continue
    const v = body[k] === '' || body[k] == null ? 0 : Number(body[k])
    if (!Number.isFinite(v) || v < 0) return { error: `${label} يجب أن تكون رقمًا موجبًا` }
    data[k] = v
  }
  data.updatedAt = new Date()
  return { data }
}
