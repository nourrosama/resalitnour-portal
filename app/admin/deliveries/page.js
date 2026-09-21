'use client'
import { useState, useEffect } from 'react'

const statusMap = {
  scheduled: { label: 'مجدول', cls: 'badge-pending' },
  delivered: { label: 'تم التسليم', cls: 'badge-active' },
  confirmed: { label: 'مؤكد', cls: 'badge-approved' },
  failed: { label: 'فشل', cls: 'badge-rejected' },
}

export default function AdminDeliveriesPage() {
  const [deliveries, setDeliveries] = useState([])
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    caseId: '', deliveryType: '', items: '', amount: '',
    deliveredAt: '', notes: '', status: 'scheduled',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/deliveries').then(r => r.json()),
      fetch('/api/cases').then(r => r.json()),
    ]).then(([dels, cas]) => {
      setDeliveries(Array.isArray(dels) ? dels : [])
      setCases(Array.isArray(cas) ? cas : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  async function handleCreate(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const res = await fetch('/api/deliveries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSubmitting(false)
    if (res.ok) {
      const newDel = await res.json()
      setDeliveries([newDel, ...deliveries])
      setShowForm(false)
      setForm({ caseId: '', deliveryType: '', items: '', amount: '', deliveredAt: '', notes: '', status: 'scheduled' })
    } else {
      setError('حدث خطأ أثناء الإنشاء')
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">إدارة التسليمات</h1>
        <button className="btn-primary text-sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'إلغاء' : '+ تسليم جديد'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">إضافة تسليم</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
                <select
                  value={form.caseId}
                  onChange={e => setForm({ ...form, caseId: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="">-- اختر الحالة --</option>
                  {cases.map(c => (
                    <option key={c._id} value={c._id}>{c.code} - {c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نوع التسليم</label>
                <input
                  type="text"
                  value={form.deliveryType}
                  onChange={e => setForm({ ...form, deliveryType: e.target.value })}
                  className="input-field"
                  placeholder="مثال: مساعدة شهرية، كرتونة رمضان"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الأصناف</label>
                <input
                  type="text"
                  value={form.items}
                  onChange={e => setForm({ ...form, items: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ (ج.م)</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  className="input-field"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ التسليم</label>
                <input
                  type="date"
                  value={form.deliveredAt}
                  onChange={e => setForm({ ...form, deliveredAt: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
                <select
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}
                  className="input-field"
                >
                  <option value="scheduled">مجدول</option>
                  <option value="delivered">تم التسليم</option>
                  <option value="confirmed">مؤكد</option>
                  <option value="failed">فشل</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
              <textarea
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                className="input-field"
                rows={2}
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'جاري الحفظ...' : 'إضافة التسليم'}
            </button>
          </form>
        </div>
      )}

      <div className="card">
        {loading ? (
          <div className="text-center py-8 text-gray-500">جاري التحميل...</div>
        ) : deliveries.length === 0 ? (
          <div className="text-center py-12 text-gray-400">لا توجد تسليمات</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">الحالة</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">نوع التسليم</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">الأصناف</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">المبلغ</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">الحالة</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">تاريخ التسليم</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map((d, i) => {
                  const s = statusMap[d.status] || { label: d.status, cls: 'badge-pending' }
                  return (
                    <tr key={d._id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 border-b">
                        <span className="font-mono text-primary-700">{d.caseId?.code}</span>
                        {' '}<span className="text-gray-700">{d.caseId?.name}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 border-b">{d.deliveryType}</td>
                      <td className="px-4 py-3 text-gray-600 border-b">{d.items || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 border-b">
                        {d.amount ? `${d.amount} ج.م` : '—'}
                      </td>
                      <td className="px-4 py-3 text-center border-b">
                        <span className={`badge ${s.cls}`}>{s.label}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-500 border-b text-xs">
                        {d.deliveredAt ? new Date(d.deliveredAt).toLocaleDateString('ar-EG') : '—'}
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
