'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

// Admin home: pick a user (organization) to manage.
// Each user's cases/requests/deliveries live in their own workspace at /admin/users/[id]
export default function AdminHomePage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)

  useEffect(() => {
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(data => {
        setUsers(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = users.filter(u => {
    if (!showInactive && u.isActive === false) return false
    if (!search) return true
    return [u.name, u.email, u.organization, u.governorate].some(v => v?.includes(search))
  })

  const totalCases = users.reduce((n, u) => n + (u.stats?.total || 0), 0)
  const totalPending = users.reduce((n, u) => n + (u.stats?.pending || 0), 0)
  const activeUsers = users.filter(u => u.isActive !== false).length

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">المستخدمون</h1>
          <p className="text-gray-500 mt-1">اختر مستخدمًا لإدارة حالاته وطلباته</p>
        </div>
        <Link href="/admin/users" className="btn-primary text-sm">+ إضافة / إدارة الحسابات</Link>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card text-center">
          <p className="text-3xl font-bold text-indigo-600">{activeUsers}</p>
          <p className="text-sm text-gray-500 mt-1">مستخدمون نشطون</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-primary-700">{totalCases}</p>
          <p className="text-sm text-gray-500 mt-1">إجمالي الحالات</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-yellow-600">{totalPending}</p>
          <p className="text-sm text-gray-500 mt-1">قيد المراجعة</p>
        </div>
      </div>

      <div className="flex gap-4 mb-4 flex-wrap items-center">
        <input
          type="text"
          placeholder="بحث بالاسم أو الجهة أو المحافظة أو البريد..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field flex-1 min-w-48"
        />
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} />
          عرض الحسابات المعطلة
        </label>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">جاري التحميل...</div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">لا يوجد مستخدمون</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(u => (
            <Link
              key={u._id}
              href={`/admin/users/${u._id}`}
              className="card block hover:shadow-md hover:border-primary-300 border border-transparent transition-all"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-800 flex items-center justify-center text-lg font-bold shrink-0">
                  {u.name?.[0] || 'م'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-gray-900 truncate">{u.name}</p>
                  <p className="text-sm text-gray-500 truncate">{u.organization || u.email}</p>
                </div>
                {u.isActive === false && <span className="badge badge-rejected">معطل</span>}
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                <span>{u.governorate || '—'}</span>
                <span className="truncate mr-2" dir="ltr">{u.email}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center border-t pt-3">
                <div>
                  <p className="text-lg font-bold text-primary-700">{u.stats?.total || 0}</p>
                  <p className="text-xs text-gray-500">الحالات</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-blue-600">{u.stats?.approved || 0}</p>
                  <p className="text-xs text-gray-500">معتمدة</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-yellow-600">{u.stats?.pending || 0}</p>
                  <p className="text-xs text-gray-500">قيد المراجعة</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
