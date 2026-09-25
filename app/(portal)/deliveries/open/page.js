'use client'
import { useState, useEffect, useCallback } from 'react'
import { Panel, DeliveriesTable } from '../../../../components/portal/DeliveryPanel'

export default function OpenDeliveriesPage() {
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/deliveries?status=open')
      .then(r => r.json())
      .then(data => setDeliveries(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div className="p-6">
      <Panel title="طلبات التسليم المفتوحة">
        <div className="flex items-center justify-between mb-4">
          <p className="font-semibold text-gray-800">
            عدد الطلبات المفتوحة <span className="mr-2">{deliveries.length}</span>
          </p>
          <button onClick={load} className="btn-primary text-sm px-10">↻ تحديث</button>
        </div>
        <DeliveriesTable deliveries={deliveries} loading={loading} />
      </Panel>
    </div>
  )
}
