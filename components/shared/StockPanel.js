'use client'
import { useState, useEffect } from 'react'
import { FAMILY_COLUMNS } from '../../lib/catalog'

function fmt(n) {
  return Number(n || 0).toLocaleString('ar-EG', { maximumFractionDigits: 3 })
}

// المخزن of one user. Used by the user (/deliveries/stock) and by the admin inside that user's
// workspace (/admin/users/<id>/deliveries/stock) — same data, both can change quantities.
// The list of الأصناف, their units, points and limits come from the global جدول الأصناف والحدود.
export default function StockPanel({ userId, isAdmin = false }) {
  const qs = userId ? `?userId=${userId}` : ''
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [drafts, setDrafts] = useState({}) // id -> quantity being typed
  const [busy, setBusy] = useState(null)
  const [msg, setMsg] = useState(null)
  const [showLimits, setShowLimits] = useState(false)

  function load() {
    setLoading(true)
    fetch(`/api/stock${qs}`)
      .then(r => r.json())
      .then(data => { setItems(Array.isArray(data) ? data : []); setDrafts({}); setLoading(false) })
      .catch(() => setLoading(false))
  }
  useEffect(load, [qs])

  async function saveQty(it) {
    const value = drafts[it._id]
    if (value === undefined || Number(value) === Number(it.quantity)) return
    setBusy(it._id)
    setMsg(null)
    const res = await fetch(`/api/stock/${it._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: value }),
    })
    setBusy(null)
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      setItems(items.map(i => (i._id === it._id ? data : i)))
      const d = { ...drafts }; delete d[it._id]; setDrafts(d)
      setMsg({ type: 'ok', text: `تم تحديث كمية ${data.name} إلى ${fmt(data.quantity)}` })
    } else setMsg({ type: 'err', text: data.error || 'تعذر الحفظ' })
  }

  async function remove(item) {
    if (!confirm(`حذف "${item.name}" من المخزن؟`)) return
    setBusy(item._id)
    const res = await fetch(`/api/stock/${item._id}`, { method: 'DELETE' })
    setBusy(null)
    const data = await res.json().catch(() => ({}))
    if (res.ok) setItems(items.filter(i => i._id !== item._id))
    else setMsg({ type: 'err', text: data.error || 'تعذر الحذف' })
  }

  const table = items.filter(i => i.inCatalog)
  const legacy = items.filter(i => !i.inCatalog)
  const shown = table.filter(i => !search || i.name.includes(search))
  const inStock = table.filter(i => i.quantity > 0).length

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">المخزن</h1>
        <div className="flex gap-2">
          <button className="btn-secondary text-sm" onClick={() => setShowLimits(!showLimits)}>{showLimits ? 'إخفاء الحدود' : 'عرض الحد الأقصى لكل أسرة'}</button>
          <button className="btn-secondary text-sm" onClick={load}>↻ تحديث</button>
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-5">
        {table.length} صنف — {inStock} متوفر. حدّث الكمية الموجودة لديك من كل صنف؛ يُخصم من المخزن تلقائيًا عند تسليم الأصناف للمستفيدين.
        الأصناف ونقاطها والحد الأقصى لكل أسرة تحددها الإدارة {isAdmin && <>من <a href="/admin/catalog" className="text-primary-700 underline">جدول الأصناف والحدود</a></>}.
      </p>

      {msg && (
        <div className={`p-3 rounded-lg mb-4 text-sm border ${msg.type === 'ok' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {msg.text}
        </div>
      )}

      <div className="card">
        <input type="text" placeholder="بحث باسم الصنف..." value={search} onChange={e => setSearch(e.target.value)} className="input-field max-w-md mb-4" />
        {loading ? (
          <div className="text-center py-8 text-gray-500">جاري التحميل...</div>
        ) : shown.length === 0 ? (
          <div className="text-center py-12 text-gray-400">لا توجد أصناف</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-right px-3 py-3 font-semibold text-gray-700">الصنف</th>
                  <th className="text-center px-2 py-3 font-semibold text-gray-700">الوحدة</th>
                  <th className="text-center px-2 py-3 font-semibold text-gray-700">الوزن</th>
                  <th className="text-center px-2 py-3 font-semibold text-gray-700">النقاط</th>
                  <th className="text-center px-2 py-3 font-semibold text-gray-700">الكمية بالمخزن</th>
                  <th className="text-center px-2 py-3 font-semibold text-gray-700">محجوز في تسليمات مفتوحة</th>
                  <th className="text-center px-2 py-3 font-semibold text-gray-700">متاح لتسليمات جديدة</th>
                  {showLimits && FAMILY_COLUMNS.map((c, i) => <th key={i} className="text-center px-1 py-3 font-medium text-gray-600 text-xs">{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {shown.map((it, i) => {
                  const draft = drafts[it._id]
                  const changed = draft !== undefined && Number(draft) !== Number(it.quantity)
                  return (
                    <tr key={it._id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-3 py-2 border-b font-medium text-gray-800">{it.name}</td>
                      <td className="px-2 py-2 border-b text-center text-gray-600">{it.unit || '—'}</td>
                      <td className="px-2 py-2 border-b text-center text-gray-600">{it.weight || '—'}</td>
                      <td className="px-2 py-2 border-b text-center font-semibold text-primary-800">{fmt(it.points)}</td>
                      <td className="px-2 py-2 border-b text-center">
                        <div className="inline-flex items-center gap-1">
                          <input
                            type="number" min="0" step="any"
                            value={draft ?? it.quantity ?? 0}
                            onChange={e => setDrafts({ ...drafts, [it._id]: e.target.value })}
                            onKeyDown={e => { if (e.key === 'Enter') saveQty(it) }}
                            className={`w-24 text-center border rounded px-1.5 py-1 ${changed ? 'border-primary-500 bg-primary-50' : 'border-gray-300'}`}
                          />
                          {changed && (
                            <button onClick={() => saveQty(it)} disabled={busy === it._id} className="text-xs text-primary-700 font-semibold">
                              {busy === it._id ? '...' : 'حفظ'}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-2 border-b text-center text-amber-700">{it.reserved ? fmt(it.reserved) : '—'}</td>
                      <td className={`px-2 py-2 border-b text-center font-semibold ${it.available > 0 ? 'text-green-700' : 'text-gray-400'}`}>{fmt(it.available)}</td>
                      {showLimits && (it.limits || []).map((n, j) => (
                        <td key={j} className={`px-1 py-2 border-b text-center ${n === 0 ? 'text-red-500' : 'text-gray-700'}`}>{n}</td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {legacy.length > 0 && (
        <div className="card mt-6 border-amber-200">
          <h2 className="font-semibold text-amber-800 mb-1">أصناف غير موجودة في جدول الأصناف</h2>
          <p className="text-sm text-gray-600 mb-3">هذه أصناف قديمة لا يمكن استخدامها في التسليمات. انقل كمياتها إلى الصنف المطابق في الجدول ثم احذفها.</p>
          <ul className="divide-y">
            {legacy.map(it => (
              <li key={it._id} className="flex items-center justify-between py-2 text-sm">
                <span>{it.name} — {fmt(it.quantity)} {it.unit}</span>
                <button onClick={() => remove(it)} disabled={busy === it._id} className="text-xs text-red-600 font-medium">حذف</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
