'use client'
import { useState, useEffect } from 'react'
import { FAMILY_COLUMNS } from '../../../lib/catalog'

const emptyRow = { name: '', unit: '', weight: '', points: '', limits: ['', '', '', '', '', '', ''] }
const SHORT = ['1', '2', '3', '4', '5', '6', '7+']

function rowToDraft(r) {
  return { name: r.name, unit: r.unit || '', weight: r.weight || '', points: r.points ?? 0, limits: [...(r.limits || [])].map(n => n ?? 0) }
}

function LimitInputs({ value, onChange }) {
  return value.map((v, i) => (
    <td key={i} className="px-1 py-1.5 border-b text-center">
      <input type="number" min="0" step="1" value={v} onChange={e => onChange(value.map((x, j) => (j === i ? e.target.value : x)))}
        className="w-12 text-center border border-gray-300 rounded px-1 py-1 text-sm" />
    </td>
  ))
}

// جدول الأصناف والحدود — global, applies to every user
export default function CatalogPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [draft, setDraft] = useState(null)
  const [adding, setAdding] = useState(false)
  const [newRow, setNewRow] = useState(emptyRow)
  const [busy, setBusy] = useState(null)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    fetch('/api/catalog').then(r => r.json())
      .then(d => { setRows(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function save(id) {
    setBusy(id); setMsg(null)
    const res = await fetch(`/api/catalog/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) })
    setBusy(null)
    const data = await res.json().catch(() => ({}))
    if (res.ok) { setRows(rows.map(r => (r._id === id ? data : r))); setEditing(null); setMsg({ type: 'ok', text: `تم حفظ ${data.name} — يُطبق على كل المستخدمين` }) }
    else setMsg({ type: 'err', text: data.error || 'تعذر الحفظ' })
  }

  async function add(e) {
    e.preventDefault()
    setBusy('new'); setMsg(null)
    const res = await fetch('/api/catalog', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newRow) })
    setBusy(null)
    const data = await res.json().catch(() => ({}))
    if (res.ok) { setRows([...rows, data]); setNewRow(emptyRow); setAdding(false); setMsg({ type: 'ok', text: `تمت إضافة ${data.name} — يظهر الآن في مخزن كل المستخدمين` }) }
    else setMsg({ type: 'err', text: data.error || 'تعذرت الإضافة' })
  }

  async function remove(r) {
    if (!confirm(`حذف "${r.name}" من الجدول؟\nسيُحذف أيضًا من مخزن كل المستخدمين (مع كمياته). لا يمكن التراجع.`)) return
    setBusy(r._id); setMsg(null)
    const res = await fetch(`/api/catalog/${r._id}`, { method: 'DELETE' })
    setBusy(null)
    const data = await res.json().catch(() => ({}))
    if (res.ok) setRows(rows.filter(x => x._id !== r._id))
    else setMsg({ type: 'err', text: data.error || 'تعذر الحذف' })
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">جدول الأصناف والحدود</h1>
        <button className="btn-primary text-sm" onClick={() => setAdding(!adding)}>{adding ? 'إلغاء' : '+ إضافة صنف'}</button>
      </div>
      <p className="text-sm text-gray-500 mb-5">
        جدول عام لكل المستخدمين: يحدد الأصناف ووحداتها ونقاطها والحد الأقصى الذي تستلمه الحالة حسب عدد أفراد الأسرة.
        أي تعديل هنا يظهر فورًا في مخزن كل المستخدمين وعند تسليم المستفيد.
      </p>

      {msg && (
        <div className={`p-3 rounded-lg mb-4 text-sm border ${msg.type === 'ok' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-700'}`}>{msg.text}</div>
      )}

      <div className="card overflow-x-auto">
        {loading ? <div className="text-center py-8 text-gray-500">جاري التحميل...</div> : (
          <form onSubmit={add}>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th rowSpan={2} className="text-right px-3 py-2 border-b font-semibold text-gray-700">الصنف</th>
                  <th rowSpan={2} className="text-center px-2 py-2 border-b font-semibold text-gray-700">الوحدة</th>
                  <th rowSpan={2} className="text-center px-2 py-2 border-b font-semibold text-gray-700">الوزن</th>
                  <th rowSpan={2} className="text-center px-2 py-2 border-b font-semibold text-gray-700 bg-gray-800 text-white">النقاط</th>
                  <th colSpan={7} className="text-center px-2 py-1 font-semibold text-gray-700">الحد الأقصى حسب عدد أفراد الأسرة</th>
                  <th rowSpan={2} className="text-center px-2 py-2 border-b font-semibold text-gray-700">إجراء</th>
                </tr>
                <tr className="bg-gray-50 border-b">
                  {SHORT.map((s, i) => <th key={s} title={FAMILY_COLUMNS[i]} className="text-center px-1 py-1 font-medium text-gray-600 text-xs">{FAMILY_COLUMNS[i]}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => editing === r._id ? (
                  <tr key={r._id} className="bg-primary-50">
                    <td className="px-2 py-1.5 border-b"><input className="input-field py-1" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} /></td>
                    <td className="px-1 py-1.5 border-b"><input className="input-field py-1 w-20" value={draft.unit} onChange={e => setDraft({ ...draft, unit: e.target.value })} /></td>
                    <td className="px-1 py-1.5 border-b"><input className="input-field py-1 w-24" value={draft.weight} onChange={e => setDraft({ ...draft, weight: e.target.value })} /></td>
                    <td className="px-1 py-1.5 border-b"><input type="number" min="0" step="any" className="input-field py-1 w-16" value={draft.points} onChange={e => setDraft({ ...draft, points: e.target.value })} /></td>
                    <LimitInputs value={draft.limits} onChange={limits => setDraft({ ...draft, limits })} />
                    <td className="px-2 py-1.5 border-b text-center whitespace-nowrap">
                      <button type="button" onClick={() => save(r._id)} disabled={busy === r._id} className="text-xs text-primary-700 font-semibold ml-3">{busy === r._id ? '...' : 'حفظ'}</button>
                      <button type="button" onClick={() => setEditing(null)} className="text-xs text-gray-500">إلغاء</button>
                    </td>
                  </tr>
                ) : (
                  <tr key={r._id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-3 py-2 border-b font-medium text-gray-800">{r.name}</td>
                    <td className="px-2 py-2 border-b text-center text-gray-600">{r.unit || '—'}</td>
                    <td className="px-2 py-2 border-b text-center text-gray-600">{r.weight || '—'}</td>
                    <td className="px-2 py-2 border-b text-center font-bold text-primary-800">{r.points}</td>
                    {(r.limits || []).map((n, j) => (
                      <td key={j} className={`px-1 py-2 border-b text-center ${n === 0 ? 'text-red-500' : 'text-gray-800'}`}>{n}</td>
                    ))}
                    <td className="px-2 py-2 border-b text-center whitespace-nowrap">
                      <button type="button" onClick={() => { setEditing(r._id); setDraft(rowToDraft(r)) }} className="text-xs text-primary-700 hover:text-primary-900 font-medium ml-3">تعديل</button>
                      <button type="button" onClick={() => remove(r)} disabled={busy === r._id} className="text-xs text-red-600 hover:text-red-800 font-medium">حذف</button>
                    </td>
                  </tr>
                ))}
                {adding && (
                  <tr className="bg-green-50">
                    <td className="px-2 py-1.5 border-b"><input className="input-field py-1" placeholder="اسم الصنف" value={newRow.name} onChange={e => setNewRow({ ...newRow, name: e.target.value })} required /></td>
                    <td className="px-1 py-1.5 border-b"><input className="input-field py-1 w-20" placeholder="كيس" value={newRow.unit} onChange={e => setNewRow({ ...newRow, unit: e.target.value })} /></td>
                    <td className="px-1 py-1.5 border-b"><input className="input-field py-1 w-24" placeholder="400 جرام" value={newRow.weight} onChange={e => setNewRow({ ...newRow, weight: e.target.value })} /></td>
                    <td className="px-1 py-1.5 border-b"><input type="number" min="0" step="any" className="input-field py-1 w-16" value={newRow.points} onChange={e => setNewRow({ ...newRow, points: e.target.value })} /></td>
                    <LimitInputs value={newRow.limits} onChange={limits => setNewRow({ ...newRow, limits })} />
                    <td className="px-2 py-1.5 border-b text-center">
                      <button type="submit" disabled={busy === 'new'} className="text-xs text-green-700 font-semibold">{busy === 'new' ? '...' : 'إضافة'}</button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </form>
        )}
        <p className="text-xs text-gray-500 mt-3">الحد الأقصى 0 يعني أن الحالة بهذا العدد لا تستلم هذا الصنف.</p>
      </div>
    </div>
  )
}
