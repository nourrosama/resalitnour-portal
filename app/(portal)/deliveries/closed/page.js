'use client'
import { useState, useEffect, useCallback } from 'react'
import { Panel, DeliveriesTable } from '../../../../components/portal/DeliveryPanel'

function thisMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function ClosedDeliveriesPage() {
  const [month, setMonth] = useState(thisMonth())
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback((m) => {
    setLoading(true)
    fetch(`/api/deliveries?status=closed${m ? `&month=${m}` : ''}`)
      .then(r => r.json())
      .then(data => setDeliveries(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load(thisMonth()) }, [load])

  return (
    <div className="p-6">
      <Panel title="طلبات التسليم المغلقة">
        <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
          <div>
            <label className="block text-sm text-gray-700 mb-1">اختر الشهر والسنة</label>
            <input type="month" value={month} onChange={e => setMonth(e.target.value)} className="input-field w-64" />
          </div>
          <button onClick={() => load(month)} className="btn-primary text-sm px-12">بحث</button>
          <p className="font-semibold text-gray-800">
            عدد الطلبات المغلقة: <span className="mr-2">{deliveries.length}</span>
          </p>
        </div>
        <DeliveriesTable deliveries={deliveries} loading={loading} closed />
      </Panel>
    </div>
  )
}
