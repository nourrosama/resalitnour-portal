'use client'
import { useState, useEffect } from 'react'

const UNITS = ['كيلو', 'جرام', 'لتر', 'علبة', 'كيس', 'زجاجة', 'كرتونة', 'قطعة', 'عبوة']
const emptyNew = { name: '', unit: 'كيلو', quantity: '', points: '' }

function fmt(n) {
  return Number(n || 0).toLocaleString('ar-EG', { maximumFractionDigits: 3 })
}

// المخزن of one user. Used by the user (/deliveries/stock) and by the admin inside that
// user's workspace (/admin/users/<id>/deliveries/stock) — both can edit, same data.
export default function StockPanel({ userId }) {
  const qs = userId ? `?userId=${userId}` : ''
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null) // id
  const [draft, setDraft] = useState({})
  const [newItem, setNewItem] = useState(emptyNew)
  const [showAdd, setShowAdd] = useState(false)
  const [busy, setBusy] = useState(null)
  const [msg, setMsg] = useState(null)

  function load() {
    setLoading(true)
    fetch(`/api/stock${qs}`)
      .then(r => r.json())
      .then(data => { setItems(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }
  useEffect(load, [qs])

  async function save(id) {
    setBusy(id)
    setMsg(null)
    const res = await fetch(`/api/stock/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    })
    setBusy(null)
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      setItems(items.map(i => (i._id === id ? data : i)))
      setEditing(null)
    } else setMsg({ type: 'err', text: data.error || 'تعذر الحفظ' })
  }

  async function remove(item) {
    if (!confirm(`حذف الصنف "${item.name}" من المخزن؟`)) return
    setBusy(item._id)
    const res = await fetch(`/api/stock/${item._id}`, { method: 'DELETE' })
    setBusy(null)
    const data = await res.json().catch(() => ({}))
    if (res.ok) setItems(items.filter(i => i._id !== item._id))
    else setMsg({ type: 'err', text: data.error || 'تعذر الحذف' })
  }

  async function add(e) {
    e.preventDefault()
    setMsg(null)
    setBusy('new')
    const res = await fetch(`/api/stock${qs}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem),
    })
    setBusy(null)
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      setItems([...items, data])
      setNewItem(emptyNew)
      setShowAdd(false)
      setMsg({ type: 'ok', text: `تمت إضافة ${data.name} إلى المخزن` })
    } else setMsg({ type: 'err', text: data.error || 'تعذرت الإضافة' })
  }

  const shown = items.filter(i => !search || i.name.includes(search))
  const inStock = items.filter(i => i.quantity > 0).length

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">المخزن</h1>
          <p className="text-sm text-gray-500 mt-1">
            {items.length} صنف — {inStock} متوفر. يُخصم من المخزن تلقائيًا عند تسليم الأصناف للمستفيدين.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary text-sm" onClick={load}>↻ تحديث</button>
          <button className="btn-primary text-sm" onClick={() => setShowAdd(!showAdd)}>{showAdd ? 'إلغاء' : '+ إضافة صنف'}</button>
        </div>
      </div>

      {msg && (
        <div className={`p-3 rounded-lg mb-4 text-sm border ${msg.type === 'ok' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {msg.text}
        </div>
      )}

      {showAdd && (
        <form onSubmit={add} className="card mb-6 grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
          <div className="col-span-2 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">اسم الصنف <span className="text-red-500">*</span></label>
            <input className="input-field" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الوحدة</label>
            <input className="input-field" list="stock-units" value={newItem.unit} onChange={e => setNewItem({ ...newItem, unit: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الكمية / الوزن</label>
            <input type="number" min="0" step="any" className="input-field" value={newItem.quantity} onChange={e => setNewItem({ ...newItem, quantity: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">النقاط لكل وحدة</label>
            <input type="number" min="0" step="any" className="input-field" value={newItem.points} onChange={e => setNewItem({ ...newItem, points: e.target.value })} />
          </div>
          <div className="col-span-2 md:col-span-5">
            <button type="submit" className="btn-primary" disabled={busy === 'new'}>{busy === 'new' ? 'جاري الإضافة...' : 'إضافة إلى المخزن'}</button>
          </div>
        </form>
      )}
      <datalist id="stock-units">{UNITS.map(u => <option key={u} value={u} />)}</datalist>

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
                  <th className="text-center px-3 py-3 font-semibold text-gray-700">الوحدة</th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-700">الكمية بالمخزن</th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-700">محجوز في تسليمات مفتوحة</th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-700">متاح لتسليمات جديدة</th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-700">النقاط لكل وحدة</th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-700">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((it, i) => {
                  const isEd = editing === it._id
                  return (
                    <tr key={it._id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-3 py-2 border-b font-medium text-gray-800">
                        {isEd ? <input className="input-field py-1" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} /> : it.name}
                      </td>
                      <td className="px-3 py-2 border-b text-center text-gray-600">
                        {isEd ? <input className="input-field py-1 w-24 mx-auto" list="stock-units" value={draft.unit} onChange={e => setDraft({ ...draft, unit: e.target.value })} /> : (it.unit || '—')}
                      </td>
                      <td className="px-3 py-2 border-b text-center">
                        {isEd
                          ? <input type="number" min="0" step="any" className="input-field py-1 w-24 mx-auto" value={draft.quantity} onChange={e => setDraft({ ...draft, quantity: e.target.value })} />
                          : <span className={`font-semibold ${it.quantity > 0 ? 'text-gray-800' : 'text-gray-400'}`}>{fmt(it.quantity)}</span>}
                      </td>
                      <td className="px-3 py-2 border-b text-center text-amber-700">{it.reserved ? fmt(it.reserved) : '—'}</td>
                      <td className={`px-3 py-2 border-b text-center font-semibold ${it.available > 0 ? 'text-green-700' : 'text-gray-400'}`}>{fmt(it.available)}</td>
                      <td className="px-3 py-2 border-b text-center">
                        {isEd
                          ? <input type="number" min="0" step="any" className="input-field py-1 w-20 mx-auto" value={draft.points} onChange={e => setDraft({ ...draft, points: e.target.value })} />
                          : <span className="font-semibold text-primary-800">{fmt(it.points)}</span>}
                      </td>
                      <td className="px-3 py-2 border-b text-center whitespace-nowrap">
                        {isEd ? (
                          <span className="inline-flex gap-3">
                            <button onClick={() => save(it._id)} disabled={busy === it._id} className="text-xs text-primary-700 font-semibold">{busy === it._id ? '...' : 'حفظ'}</button>
                            <button onClick={() => setEditing(null)} className="text-xs text-gray-500">إلغاء</button>
                          </span>
                        ) : (
                          <span className="inline-flex gap-3">
                            <button onClick={() => { setEditing(it._id); setDraft({ name: it.name, unit: it.unit || '', quantity: it.quantity ?? 0, points: it.points ?? 0 }) }} className="text-xs text-primary-700 hover:text-primary-900 font-medium">تعديل</button>
                            <button onClick={() => remove(it)} disabled={busy === it._id} className="text-xs text-red-600 hover:text-red-800 font-medium">حذف</button>
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
