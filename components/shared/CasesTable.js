'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const statusMap = {
  pending: { label: 'قيد المراجعة', cls: 'badge-pending' },
  active: { label: 'نشطة', cls: 'badge-active' },
  approved: { label: 'معتمدة', cls: 'badge-approved' },
  rejected: { label: 'مرفوضة', cls: 'badge-rejected' },
  suspended: { label: 'موقوفة', cls: 'badge-suspended' },
}

export default function CasesTable({ period, title }) {
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch(`/api/cases?period=${period}`)
      .then(r => r.json())
      .then(data => {
        setCases(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [period])

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
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">الحالة</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">تاريخ الإضافة</th>
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
                      <td className="px-4 py-3 text-center border-b">
                        <span className={`badge ${s.cls}`}>{s.label}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-500 border-b text-xs">
                        {new Date(c.createdAt).toLocaleDateString('ar-EG')}
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
