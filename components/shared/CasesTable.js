'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MONTHLY_TYPES, SEASONAL_TYPES, GOVERNORATES } from '../../lib/caseOptions'

const statusMap = {
  pending: { label: 'قيد المراجعة', cls: 'badge-pending' },
  active: { label: 'نشطة', cls: 'badge-active' },
  approved: { label: 'معتمدة', cls: 'badge-approved' },
  rejected: { label: 'مرفوضة', cls: 'badge-rejected' },
  suspended: { label: 'موقوفة', cls: 'badge-suspended' },
}

const EDIT_FIELDS = ['name', 'age', 'familyMembers', 'phone', 'nationalId', 'passportNumber', 'caseType', 'governorate', 'address', 'comment']

function toForm(c) {
  return Object.fromEntries(EDIT_FIELDS.map(k => [k, c[k] ?? '']))
}

function EditCaseModal({ item, onClose, onSaved }) {
  const [form, setForm] = useState(() => toForm(item))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.name?.trim() || !form.caseType || form.familyMembers === '') {
      setError('يرجى ملء الحقول المطلوبة')
      return
    }
    setSaving(true)
    const res = await fetch(`/api/cases/${item._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    const data = await res.json().catch(() => ({}))
    if (res.ok) onSaved(data)
    else setError(data.error || 'حدث خطأ أثناء الحفظ')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">تعديل بيانات الحالة</h2>
          <p className="text-sm text-gray-500 mb-4">
            <span className="font-mono text-primary-700">{item.code}</span> — {item.name}
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الاسم الكامل <span className="text-red-500">*</span>
              </label>
              <input type="text" name="name" value={form.name} onChange={handleChange} className="input-field" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">العمر</label>
                <input type="number" name="age" value={form.age} onChange={handleChange} className="input-field" min="0" max="120" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  عدد أفراد الأسرة <span className="text-red-500">*</span>
                </label>
                <input type="number" name="familyMembers" value={form.familyMembers} onChange={handleChange} className="input-field" min="1" step="1" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
                <input type="text" name="phone" value={form.phone} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الرقم القومي</label>
                <input type="text" name="nationalId" value={form.nationalId} onChange={handleChange} className="input-field" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رقم جواز السفر</label>
                <input type="text" name="passportNumber" value={form.passportNumber} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المحافظة</label>
                <select name="governorate" value={form.governorate} onChange={handleChange} className="input-field">
                  <option value="">-- اختر المحافظة --</option>
                  {GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                نوع الحالة <span className="text-red-500">*</span>
              </label>
              <select name="caseType" value={form.caseType} onChange={handleChange} className="input-field" required>
                <option value="">-- اختر نوع الحالة --</option>
                <optgroup label="الحالات الشهرية">
                  {MONTHLY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </optgroup>
                <optgroup label="الحالات الموسمية">
                  {SEASONAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
              <input type="text" name="address" value={form.address} onChange={handleChange} className="input-field" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
              <textarea name="comment" value={form.comment} onChange={handleChange} className="input-field" rows={3} />
            </div>

            {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}

            <div className="flex gap-3">
              <button type="submit" className="btn-primary flex-1" disabled={saving}>
                {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </button>
              <button type="button" className="btn-secondary" onClick={onClose}>إلغاء</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function CasesTable({ period, title }) {
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)

  useEffect(() => {
    fetch(`/api/cases?period=${period}`)
      .then(r => r.json())
      .then(data => {
        setCases(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [period])

  function handleSaved(updated) {
    // if the case type moved it to the other list (monthly <-> seasonal), drop it from this one
    const stillHere = period === 'monthly' ? /شهري/.test(updated.caseType || '')
      : period === 'seasonal' ? /موسم/.test(updated.caseType || '') : true
    setCases(stillHere
      ? cases.map(c => (c._id === updated._id ? { ...c, ...updated } : c))
      : cases.filter(c => c._id !== updated._id))
    setEditing(null)
  }

  const filtered = cases.filter(c =>
    c.name?.includes(search) ||
    c.code?.includes(search) ||
    c.caseType?.includes(search)
  )

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <Link href="/cases/new" className="btn-primary text-sm">
          + طلب حالة جديدة
        </Link>
      </div>

      <div className="card">
        <div className="mb-4">
          <input
            type="text"
            placeholder="بحث بالاسم أو الكود أو نوع الحالة..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field max-w-md"
          />
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">جاري التحميل...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">لا توجد حالات</p>
            <p className="text-gray-400 text-sm mt-1">اضغط على "طلب حالة جديدة" لإضافة حالة</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">الكود</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">الاسم</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">نوع الحالة</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">المحافظة</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">عدد أفراد الأسرة</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">الحالة</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">تاريخ الإضافة</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => {
                  const s = statusMap[c.status] || { label: c.status, cls: 'badge-pending' }
                  return (
                    <tr key={c._id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 font-mono text-primary-700 font-medium border-b">
                        {c.code}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800 border-b">{c.name}</td>
                      <td className="px-4 py-3 text-gray-600 border-b">{c.caseType}</td>
                      <td className="px-4 py-3 text-gray-600 border-b">{c.governorate || '—'}</td>
                      <td className="px-4 py-3 text-center text-gray-700 border-b">
                        {c.familyMembers ?? <span className="text-xs text-amber-600">مطلوب — عدّل الحالة</span>}
                      </td>
                      <td className="px-4 py-3 text-center border-b">
                        <span className={`badge ${s.cls}`}>{s.label}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-500 border-b text-xs">
                        {new Date(c.createdAt).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="px-4 py-3 text-center border-b">
                        <button
                          onClick={() => setEditing(c)}
                          className="text-xs text-primary-700 hover:text-primary-900 font-medium"
                        >
                          تعديل
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <EditCaseModal item={editing} onClose={() => setEditing(null)} onSaved={handleSaved} />
      )}
    </div>
  )
}
