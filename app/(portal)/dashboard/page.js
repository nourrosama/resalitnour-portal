'use client'
import { useState, useEffect } from 'react'

const statusLabels = {
  total: 'الإجمالي',
  active: 'نشطة',
  approved: 'معتمدة',
  pending: 'قيد المراجعة',
  rejected: 'مرفوضة',
}

function StatsTable({ title, data }) {
  if (!data || data.length === 0) return null
  return (
    <div className="card mb-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4">{title}</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-primary-50">
              <th className="text-right px-4 py-3 font-semibold text-gray-700 border-b">نوع الحالة</th>
              {Object.keys(statusLabels).map(key => (
                <th key={key} className="text-center px-4 py-3 font-semibold text-gray-700 border-b">
                  {statusLabels[key]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-3 font-medium text-gray-800 border-b">{row.label}</td>
                {Object.keys(statusLabels).map(key => (
                  <td key={key} className="text-center px-4 py-3 text-gray-600 border-b">
                    {row[key] || 0}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(data => {
        setStats(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">جاري التحميل...</div>
      </div>
    )
  }

  const totals = stats?.totals || {}

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">الصفحة الرئيسية</h1>
        <p className="text-gray-500 mt-1">نظرة عامة على حالاتك</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card text-center">
          <p className="text-3xl font-bold text-primary-700">{totals.total || 0}</p>
          <p className="text-sm text-gray-500 mt-1">إجمالي الحالات</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-green-600">{totals.active || 0}</p>
          <p className="text-sm text-gray-500 mt-1">حالات نشطة</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-blue-600">{totals.approved || 0}</p>
          <p className="text-sm text-gray-500 mt-1">حالات معتمدة</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-yellow-600">{totals.pending || 0}</p>
          <p className="text-sm text-gray-500 mt-1">قيد المراجعة</p>
        </div>
      </div>

      <StatsTable title="الحالات الشهرية" data={stats?.monthly} />
      <StatsTable title="الحالات الموسمية" data={stats?.seasonal} />
    </div>
  )
}
