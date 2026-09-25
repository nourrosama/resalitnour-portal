'use client'
import { useState } from 'react'
import Link from 'next/link'
import { itemsToText } from '../../lib/foodItems'

// Panel with the green title bar used on the delivery pages (EFB style)
export function Panel({ title, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-l from-primary-800 to-primary-700 text-white text-center font-bold py-4">
        {title}
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString('ar-EG') : '—'
}
function fmtMonth(d) {
  if (!d) return '—'
  const x = new Date(d)
  return `${String(x.getMonth() + 1).padStart(2, '0')}/${x.getFullYear()}`
}

const PAGE_SIZE = 10

// Table: رقم الطلب | اسم الطلب | اسم المستفيد | تاريخ الانشاء | شهر/سنة التسليم | مكان التسليم | نوع المستفيدين | الإجراءات
export function DeliveriesTable({ deliveries, loading, closed = false }) {
  const [page, setPage] = useState(1)
  const pages = Math.max(1, Math.ceil(deliveries.length / PAGE_SIZE))
  const current = Math.min(page, pages)
  const rows = deliveries.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  return (
    <>
      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="text-right px-3 py-3 font-semibold text-gray-700">رقم الطلب</th>
              <th className="text-right px-3 py-3 font-semibold text-gray-700">اسم الطلب</th>
              <th className="text-right px-3 py-3 font-semibold text-gray-700">الأصناف</th>
              <th className="text-center px-3 py-3 font-semibold text-gray-700">المستفيدون</th>
              <th className="text-right px-3 py-3 font-semibold text-gray-700">تاريخ الانشاء</th>
              <th className="text-right px-3 py-3 font-semibold text-gray-700">{closed ? 'تاريخ التسليم' : 'شهر/سنة التسليم'}</th>
              <th className="text-right px-3 py-3 font-semibold text-gray-700">مكان التسليم</th>
              <th className="text-right px-3 py-3 font-semibold text-gray-700">نوع المستفيدين</th>
              <th className="text-center px-3 py-3 font-semibold text-gray-700">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="text-center py-12 text-gray-500">جاري التحميل...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-12 text-gray-400">لا توجد بيانات</td></tr>
            ) : rows.map((d, i) => (
              <tr key={d._id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-3 py-3 font-mono text-primary-700 border-b">{d.requestNo || '—'}</td>
                <td className="px-3 py-3 text-gray-800 font-medium border-b">{d.deliveryType}</td>
                <td className="px-3 py-3 text-gray-600 border-b text-xs max-w-[12rem]">{itemsToText(d.items) || '—'}</td>
                <td className="px-3 py-3 text-center border-b" title={(d.beneficiaries || []).map(b => b.caseId?.name).join('، ')}>
                  {(d.beneficiaries || []).filter(b => b.status === 'delivered').length} / {(d.beneficiaries || []).length}
                </td>
                <td className="px-3 py-3 text-gray-600 border-b text-xs">{fmtDate(d.createdAt)}</td>
                <td className="px-3 py-3 text-gray-600 border-b text-xs">
                  {closed ? fmtDate(d.deliveredAt) : fmtMonth(d.scheduledFor || d.createdAt)}
                </td>
                <td className="px-3 py-3 text-gray-600 border-b">{d.location || '—'}</td>
                <td className="px-3 py-3 text-gray-600 border-b text-xs">
                  {[...new Set((d.beneficiaries || []).map(b => b.caseId?.caseType).filter(Boolean))].join('، ') || '—'}
                </td>
                <td className="px-3 py-3 text-center border-b">
                  {closed ? (
                    <span className="badge badge-active">تم التسليم</span>
                  ) : (
                    <Link href="/deliveries/deliver" className="text-xs font-medium text-primary-700 hover:text-primary-900">
                      تسليم المستفيد
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center gap-2 mt-4">
        <button
          onClick={() => setPage(Math.max(1, current - 1))}
          disabled={current <= 1}
          className="w-8 h-8 border rounded text-gray-500 disabled:opacity-40"
        >‹</button>
        <span className="min-w-8 h-8 px-2 border rounded flex items-center justify-center text-sm">
          {deliveries.length ? current : 0}
        </span>
        <button
          onClick={() => setPage(Math.min(pages, current + 1))}
          disabled={current >= pages}
          className="w-8 h-8 border rounded text-gray-500 disabled:opacity-40"
        >›</button>
        {pages > 1 && <span className="text-xs text-gray-400 mr-2">من {pages}</span>}
      </div>
    </>
  )
}
