'use client'
import { useState, useEffect } from 'react'

const statusMap = {
  pending: { label: 'قيد المراجعة', cls: 'badge-pending' },
  approved: { label: 'مقبول', cls: 'badge-approved' },
  rejected: { label: 'مرفوض', cls: 'badge-rejected' },
}

export default function TargetingRequestsPage() {
  const [requests, setRequests] = useState([])
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ caseId: '', details: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/requests?type=طلب استهداف').then(r => r.json()),
      fetch('/api/cases').then(r => r.json()),
    ]).then(([reqs, cas]) => {
      setRequests(Array.isArray(reqs) ? reqs : [])
      setCases(Array.isArray(cas) ? cas : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const res = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, type: 'طلب استهداف' }),
    })
    setSubmitting(false)
    if (res.ok) {
      const newReq = await res.json()
      setRequests([newReq, ...requests])
      setShowForm(false)
      setForm({ caseId: '', details: '' })
    } else {
      setError('حدث خطأ أثناء الإرسال')
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">طلبات الاستهداف</h1>
        <button className="btn-primary text-sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'إلغاء' : '+ طلب استهداف جديد'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">طلب استهداف</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">تفاصيل الطلب</label>
              <textarea
                value={form.details}
                onChange={e => setForm({ ...form, details: e.target.value })}
                className="input-field"
                rows={4}
                required
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'جاري الإرسال...' : 'إرسال الطلب'}
            </button>
          </form>
        </div>
      )}

      <div className="card">
        {loading ? (
          <div className="text-center py-8 text-gray-500">جاري التحميل...</div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12 text-gray-400">لا توجد طلبات استهداف</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">الحالة</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">التفاصيل</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">الحالة</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">ملاحظة الإدارة</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r, i) => {
                  const s = statusMap[r.status] || { label: r.status, cls: 'badge-pending' }
                  return (
                    <tr key={r._id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 border-b">
                        <span className="font-mono text-primary-700">{r.caseId?.code}</span>
                        {' '}<span className="text-gray-700">{r.caseId?.name}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 border-b max-w-xs truncate">{r.details}</td>
                      <td className="px-4 py-3 text-center border-b">
                        <span className={`badge ${s.cls}`}>{s.label}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 border-b text-xs">{r.adminNote || '—'}</td>
                      <td className="px-4 py-3 text-center text-gray-500 border-b text-xs">
                        {new Date(r.createdAt).toLocaleDateString('ar-EG')}
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
