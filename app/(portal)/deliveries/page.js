'use client'
import { useState, useEffect } from 'react'

const statusMap = {
  scheduled: { label: 'مجدول', cls: 'badge-pending' },
  delivered: { label: 'تم التسليم', cls: 'badge-active' },
  confirmed: { label: 'مؤكد', cls: 'badge-approved' },
  failed: { label: 'فشل', cls: 'badge-rejected' },
}

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/deliveries')
      .then(r => r.json())
      .then(data => {
        setDeliveries(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">التسليمات</h1>

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
                      <td className="px-4 py-3 text-gray-600 border-b max-w-xs truncate">{d.items || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 border-b">
                        {d.amount ? `${d.amount} ج.م` : '—'}
                      </td>
                      <td className="px-4 py-3 text-center border-b">
                        <span className={`badge ${s.cls}`}>{s.label}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-500 border-b text-xs">
                        {d.deliveredAt
                          ? new Date(d.deliveredAt).toLocaleDateString('ar-EG')
                          : '—'}
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
