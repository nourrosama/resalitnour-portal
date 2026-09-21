'use client'
import { useState, useEffect } from 'react'

const statusMap = {
  pending: { label: 'قيد المراجعة', cls: 'badge-pending' },
  approved: { label: 'مقبول', cls: 'badge-approved' },
  rejected: { label: 'مرفوض', cls: 'badge-rejected' },
}

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('')
  const [selected, setSelected] = useState(null)
  const [actionForm, setActionForm] = useState({ status: '', adminNote: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const url = filterType ? `/api/requests?type=${encodeURIComponent(filterType)}` : '/api/requests'
    fetch(url)
      .then(r => r.json())
      .then(data => {
        setRequests(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [filterType])

  async function handleAction(e) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch(`/api/requests/${selected._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actionForm),
    })
    setSaving(false)
    if (res.ok) {
      const updated = await res.json()
      setRequests(requests.map(r => r._id === selected._id ? { ...r, ...updated } : r))
      setSelected(null)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">إدارة الطلبات</h1>

      <div className="card">
        <div className="mb-4">
          <select
            value={filterType}
            onChange={e => { setFilterType(e.target.value); setLoading(true) }}
            className="input-field w-64"
          >
            <option value="">كل الطلبات</option>
            <option value="طلب نقل حالة">طلبات نقل الحالات</option>
            <option value="طلب استهداف">طلبات الاستهداف</option>
            <option value="طلب إتلاف">طلبات الإتلاف</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">جاري التحميل...</div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12 text-gray-400">لا توجد طلبات</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">النوع</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">الحالة</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">مقدم بواسطة</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">التفاصيل</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">الحالة</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r, i) => {
                  const s = statusMap[r.status] || { label: r.status, cls: 'badge-pending' }
                  return (
                    <tr key={r._id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 text-gray-700 border-b font-medium">{r.type}</td>
                      <td className="px-4 py-3 border-b">
                        <span className="font-mono text-primary-700 text-xs">{r.caseId?.code}</span>
                        {' '}<span className="text-gray-700">{r.caseId?.name}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 border-b">{r.submittedBy?.name || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 border-b text-xs max-w-xs truncate">
                        {r.transferToGovernorate ? `نقل إلى: ${r.transferToGovernorate}` : r.details}
                      </td>
                      <td className="px-4 py-3 text-center border-b">
                        <span className={`badge ${s.cls}`}>{s.label}</span>
                      </td>
                      <td className="px-4 py-3 text-center border-b">
                        {r.status === 'pending' && (
                          <button
                            onClick={() => { setSelected(r); setActionForm({ status: 'approved', adminNote: '' }) }}
                            className="text-xs text-primary-700 hover:text-primary-900 font-medium"
                          >
                            مراجعة
                          </button>
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

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-1">مراجعة الطلب</h2>
              <p className="text-sm text-gray-500 mb-4">{selected.type} — {selected.caseId?.name}</p>
              <form onSubmit={handleAction} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">القرار</label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setActionForm({ ...actionForm, status: 'approved' })}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        actionForm.status === 'approved'
                          ? 'bg-green-600 text-white border-green-600'
                          : 'text-gray-600 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      قبول
                    </button>
                    <button
                      type="button"
                      onClick={() => setActionForm({ ...actionForm, status: 'rejected' })}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        actionForm.status === 'rejected'
                          ? 'bg-red-600 text-white border-red-600'
                          : 'text-gray-600 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      رفض
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظة</label>
                  <textarea
                    value={actionForm.adminNote}
                    onChange={e => setActionForm({ ...actionForm, adminNote: e.target.value })}
                    className="input-field"
                    rows={3}
                  />
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="btn-primary flex-1" disabled={saving}>
                    {saving ? 'جاري الحفظ...' : 'تأكيد القرار'}
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => setSelected(null)}>
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
