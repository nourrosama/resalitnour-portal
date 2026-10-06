'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

const statusMap = {
  pending: { label: 'قيد المراجعة', cls: 'badge-pending' },
  active: { label: 'نشطة', cls: 'badge-active' },
  approved: { label: 'معتمدة', cls: 'badge-approved' },
  rejected: { label: 'مرفوضة', cls: 'badge-rejected' },
  suspended: { label: 'موقوفة', cls: 'badge-suspended' },
}

export default function AdminUserCasesPage() {
  const { id: userId } = useParams()
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [selected, setSelected] = useState(null)
  const [actionForm, setActionForm] = useState({ status: '', adminNote: '', familyMembers: '', points: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/cases?userId=${userId}`)
      .then(r => r.json())
      .then(data => {
        setCases(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [userId])

  async function handleAction(e) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch(`/api/cases/${selected._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actionForm),
    })
    setSaving(false)
    if (res.ok) {
      const updated = await res.json()
      setCases(cases.map(c => c._id === selected._id ? { ...c, ...updated } : c))
      setSelected(null)
    }
  }

  const filtered = cases.filter(c => {
    const matchSearch = !search || c.name?.includes(search) || c.code?.includes(search)
    const matchStatus = !filterStatus || c.status === filterStatus
    return matchSearch && matchStatus
  })

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">إدارة الحالات</h1>

      <div className="card">
        <div className="flex gap-4 mb-4 flex-wrap">
          <input
            type="text"
            placeholder="بحث بالاسم أو الكود..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field flex-1 min-w-48"
          />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="input-field w-48"
          >
            <option value="">كل الحالات</option>
            {Object.entries(statusMap).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">جاري التحميل...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">لا توجد حالات</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">الكود</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">الاسم</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">نوع الحالة</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">عدد أفراد الأسرة</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">عدد النقاط</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">الحالة</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => {
                  const s = statusMap[c.status] || { label: c.status, cls: 'badge-pending' }
                  return (
                    <tr key={c._id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 font-mono text-primary-700 font-medium border-b">{c.code}</td>
                      <td className="px-4 py-3 font-medium text-gray-800 border-b">{c.name}</td>
                      <td className="px-4 py-3 text-gray-600 border-b text-xs">{c.caseType}</td>
                      <td className="px-4 py-3 text-center text-gray-700 border-b">{c.familyMembers ?? '—'}</td>
                      <td className="px-4 py-3 text-center font-semibold text-primary-800 border-b">{c.points ?? '—'}</td>
                      <td className="px-4 py-3 text-center border-b">
                        <span className={`badge ${s.cls}`}>{s.label}</span>
                      </td>
                      <td className="px-4 py-3 text-center border-b">
                        <button
                          onClick={() => { setSelected(c); setActionForm({ status: c.status, adminNote: c.adminNote || '', familyMembers: c.familyMembers ?? '', points: c.points ?? '' }) }}
                          className="text-xs text-primary-700 hover:text-primary-900 font-medium"
                        >
                          تحديث
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

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-1">تحديث الحالة</h2>
              <p className="text-sm text-gray-500 mb-4">
                <span className="font-mono text-primary-700">{selected.code}</span> — {selected.name}
              </p>
              <form onSubmit={handleAction} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الحالة الجديدة</label>
                  <select
                    value={actionForm.status}
                    onChange={e => setActionForm({ ...actionForm, status: e.target.value })}
                    className="input-field"
                    required
                  >
                    {Object.entries(statusMap).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">عدد أفراد الأسرة</label>
                    <input
                      type="number"
                      min="0"
                      value={actionForm.familyMembers}
                      onChange={e => setActionForm({ ...actionForm, familyMembers: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">عدد النقاط</label>
                    <input
                      type="number"
                      min="0"
                      value={actionForm.points}
                      onChange={e => setActionForm({ ...actionForm, points: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظة الإدارة</label>
                  <textarea
                    value={actionForm.adminNote}
                    onChange={e => setActionForm({ ...actionForm, adminNote: e.target.value })}
                    className="input-field"
                    rows={3}
                  />
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="btn-primary flex-1" disabled={saving}>
                    {saving ? 'جاري الحفظ...' : 'حفظ'}
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
