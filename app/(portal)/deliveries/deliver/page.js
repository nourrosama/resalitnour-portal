'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Panel } from '../../../../components/portal/DeliveryPanel'
import { itemsToText } from '../../../../lib/foodItems'

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800 text-left">{value || '—'}</span>
    </div>
  )
}

export default function DeliverBeneficiaryPage() {
  const [code, setCode] = useState('')
  const [found, setFound] = useState(null) // { delivery, beneficiary }
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [searching, setSearching] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [done, setDone] = useState(null)

  async function handleSearch(e) {
    e.preventDefault()
    setError('')
    setFound(null)
    setDone(null)
    setSearching(true)
    const res = await fetch('/api/deliveries/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    setSearching(false)
    const data = await res.json().catch(() => ({}))
    if (res.ok) setFound(data)
    else setError(data.error || 'الكود غير صحيح')
  }

  async function handleComplete() {
    setError('')
    setCompleting(true)
    const res = await fetch(`/api/deliveries/${found.delivery._id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, notes }),
    })
    setCompleting(false)
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      setDone({ ...found, ...data })
      setFound(null)
      setCode('')
      setNotes('')
    } else {
      setError(data.error || 'حدث خطأ')
    }
  }

  const d = found?.delivery
  const b = found?.beneficiary

  return (
    <div className="p-6 space-y-6">
      <Panel title="تسليم المستفيد">
        <form onSubmit={handleSearch} className="flex items-center gap-4 flex-wrap">
          <label className="font-semibold text-gray-800">كود القسيمة</label>
          <div className="flex">
            <input
              type="text"
              dir="ltr"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="مثال: KT4821"
              className="input-field w-72 rounded-l-none font-mono tracking-wider text-right"
              maxLength={10}
              required
            />
            <button type="submit" disabled={searching} className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-5 rounded-l-lg">
              {searching ? '...' : 'بحث'}
            </button>
          </div>
        </form>
        {error && <p className="text-red-600 text-sm mt-4">{error}</p>}
        {done && (
          <div className="mt-4 bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg text-sm">
            ✓ تم تسليم «{done.delivery.deliveryType}» للمستفيد {done.beneficiary.caseId?.name} بنجاح.
            {done.closed ? (
              <> اكتمل التسليم لكل المستفيدين وتم نقل الطلب إلى{' '}
                <Link href="/deliveries/closed" className="underline font-medium">طلبات التسليم المغلقة</Link>.</>
            ) : (
              <> تم التسليم لـ {done.delivered} من {done.total} مستفيدين في هذا الطلب.</>
            )}
          </div>
        )}
      </Panel>

      {found && (
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">بيانات التسليم</h2>
          <div className="grid md:grid-cols-2 gap-x-10 text-sm">
            <div>
              <Row label="اسم المستفيد" value={b.caseId?.name} />
              <Row label="كود الحالة" value={b.caseId?.code} />
              <Row label="نوع المستفيد" value={b.caseId?.caseType} />
              <Row label="رقم الطلب" value={d.requestNo} />
              <Row label="اسم الطلب" value={d.deliveryType} />
            </div>
            <div>
              <Row label="الأصناف" value={itemsToText(d.items)} />
              <Row label="المبلغ" value={d.amount ? `${d.amount} ج.م` : ''} />
              <Row label="مكان التسليم" value={d.location} />
              <Row label="تاريخ التسليم" value={d.scheduledFor ? new Date(d.scheduledFor).toLocaleDateString('ar-EG') : ''} />
              <Row label="تم التسليم في هذا الطلب" value={`${d.delivered} من ${d.total}`} />
            </div>
          </div>
          {d.notes && <p className="text-sm text-gray-600 mt-3">ملاحظات الإدارة: {d.notes}</p>}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات التسليم (اختياري)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} className="input-field" rows={2} />
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleComplete} disabled={completing} className="btn-primary">
              {completing ? 'جاري التأكيد...' : 'تأكيد التسليم للمستفيد'}
            </button>
            <button onClick={() => setFound(null)} className="btn-secondary">إلغاء</button>
          </div>
        </div>
      )}
    </div>
  )
}
