'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Panel } from '../../../../components/portal/DeliveryPanel'
import { itemsToText } from '../../../../lib/foodItems'
import { printReceipt } from '../../../../lib/receipt'

function fmt(n) {
  return Number(n || 0).toLocaleString('ar-EG', { maximumFractionDigits: 3 })
}

// Choose which الأصناف this beneficiary takes and how much, within the case's points
// (a fixed allowance per handout — the case's points are not reduced).
// Each item's maximum = the smallest of: الحد الأقصى for the family size (جدول الأصناف),
// what's left of it in this delivery, and what the case's points can still pay for in this handout.
function TakeItems({ items, picks, setPicks, casePoints, familyMembers, live }) {
  const qtyOf = it => Number(picks[it.key]) || 0
  const used = items.reduce((s, it) => s + qtyOf(it) * it.points, 0)
  const over = used > casePoints

  // the max for one item given what's already chosen for the others
  function maxFor(it) {
    const otherPts = used - qtyOf(it) * it.points
    const byPoints = it.points > 0 ? Math.floor(Math.max(0, casePoints - otherPts) / it.points) : Infinity
    return Math.max(0, Math.min(it.max, byPoints))
  }

  return (
    <div className="mt-6">
      <h3 className="font-semibold text-gray-800 mb-1">الأصناف التي سيستلمها المستفيد</h3>
      <p className="text-xs text-gray-500 mb-2">
        {familyMembers
          ? <>الحد الأقصى محسوب لأسرة من <b>{familyMembers}</b> {familyMembers >= 7 ? 'أفراد أو أكثر' : 'أفراد'} حسب جدول الأصناف.</>
          : <span className="text-red-600">لم يُحدد عدد أفراد الأسرة لهذه الحالة — عدّل الحالة من صفحة الحالات أولًا.</span>}
      </p>
      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="border-b text-gray-600">
              <th className="text-right px-3 py-2">الصنف</th>
              <th className="text-center px-2 py-2">{live ? 'المتوفر بالمخزن' : 'المتبقي في هذا التسليم'}</th>
              <th className="text-center px-2 py-2">الحد الأقصى للأسرة</th>
              <th className="text-center px-2 py-2">النقاط لكل وحدة</th>
              <th className="text-center px-2 py-2">الكمية للمستفيد</th>
              <th className="text-center px-2 py-2">النقاط</th>
            </tr>
          </thead>
          <tbody>
            {items.map(it => {
              const q = qtyOf(it)
              const max = maxFor(it)
              const locked = it.max <= 0
              const tooMuch = q > it.max
              return (
                <tr key={it.key} className={`border-b last:border-0 ${q > 0 ? 'bg-primary-50' : ''} ${locked ? 'opacity-50' : ''}`}>
                  <td className="px-3 py-1.5 font-medium text-gray-800">{it.name} <span className="text-xs text-gray-500">({it.unit || '—'})</span></td>
                  <td className="px-2 py-1.5 text-center">{fmt(it.remaining)}</td>
                  <td className={`px-2 py-1.5 text-center font-semibold ${it.limit === 0 ? 'text-red-500' : 'text-gray-800'}`}>
                    {it.limit === null ? '—' : fmt(it.limit)}
                  </td>
                  <td className="px-2 py-1.5 text-center">{fmt(it.points)}</td>
                  <td className="px-2 py-1.5 text-center">
                    <div className="inline-flex items-center gap-1">
                      <input
                        type="number" min="0" step="1" max={it.max}
                        disabled={locked}
                        value={picks[it.key] ?? ''}
                        onChange={e => {
                          let v = e.target.value
                          if (v !== '' && Number(v) > it.max) v = String(it.max) // can't go above the limit
                          setPicks({ ...picks, [it.key]: v })
                        }}
                        placeholder="0"
                        className={`w-20 text-sm border rounded px-1.5 py-1 ${tooMuch ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                      />
                      {!locked && max > 0 && (
                        <button type="button" onClick={() => setPicks({ ...picks, [it.key]: String(max) })} className="text-[11px] text-primary-700 hover:underline whitespace-nowrap">الحد الأقصى</button>
                      )}
                    </div>
                    {locked && <div className="text-[11px] text-gray-500">{it.limit === 0 ? 'غير مسموح لهذه الأسرة' : (live ? 'نفد من المخزن' : 'نفد من التسليم')}</div>}
                  </td>
                  <td className="px-2 py-1.5 text-center font-semibold text-primary-800">{q > 0 ? fmt(q * it.points) : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className={`mt-3 p-3 rounded-lg border text-sm ${over ? 'bg-red-50 border-red-200 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
        نقاط الحالة: <b>{fmt(casePoints)}</b> — نقاط الأصناف المختارة: <b>{fmt(used)}</b> — المتبقي من نقاط هذا التسليم: <b>{fmt(casePoints - used)}</b>
        {over && <div className="mt-1 font-medium">⚠ نقاط الأصناف المختارة أكبر من نقاط الحالة — قلّل الكميات</div>}
      </div>
    </div>
  )
}

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
  const [picks, setPicks] = useState({}) // item index -> quantity

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
    if (res.ok) { setFound(data); setPicks({}) }
    else setError(data.error || 'الكود غير صحيح')
  }

  async function handleComplete() {
    setError('')
    const items = (found.delivery.items || [])
      .map(it => ({ key: it.key, quantity: Number(picks[it.key]) || 0, it }))
      .filter(x => x.quantity > 0)
    const bad = items.find(x => x.quantity > x.it.max)
    if (bad) {
      return setError(bad.quantity > bad.it.remaining
        ? `المتبقي من ${bad.it.name} في هذا التسليم ${bad.it.remaining} فقط`
        : `الحد الأقصى من ${bad.it.name} لهذه الأسرة هو ${bad.it.limit}`)
    }
    if (found.delivery.needsFamilySize) return setError('حدد عدد أفراد الأسرة لهذه الحالة أولًا (من صفحة الحالات)')
    const casePtsNow = Number(found.beneficiary.caseId?.points) || 0
    if (found.delivery.items?.some(it => it.max > 0 && it.points <= casePtsNow) && !items.length) {
      return setError('اختر الأصناف التي سيستلمها المستفيد وكمياتها')
    }
    const used = items.reduce((s, x) => s + x.quantity * x.it.points, 0)
    const casePts = Number(found.beneficiary.caseId?.points) || 0
    if (used > casePts) return setError(`نقاط الأصناف المختارة (${used}) أكبر من نقاط الحالة (${casePts})`)
    setCompleting(true)
    const res = await fetch(`/api/deliveries/${found.delivery._id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, notes, items: items.map(({ key, quantity }) => ({ key, quantity })) }),
    })
    setCompleting(false)
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      setDone({ ...found, ...data, voucherCode: code })
      setFound(null)
      setCode('')
      setNotes('')
      setPicks({})
    } else {
      setError(data.error || `حدث خطأ (رمز ${res.status}) — حاول مرة أخرى`)
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
            {done.takenItems?.length > 0 && (
              <> استلم: {itemsToText(done.takenItems)} — بقيمة {fmt(done.pointsUsed)} من {fmt(done.casePoints)} نقطة.</>
            )}
            {done.closed ? (
              <> اكتمل التسليم لكل المستفيدين وتم نقل الطلب إلى{' '}
                <Link href="/deliveries/closed" className="underline font-medium">طلبات التسليم المغلقة</Link>.</>
            ) : (
              <> تم التسليم لـ {done.delivered} من {done.total} مستفيدين في هذا الطلب.</>
            )}
            <div className="mt-3">
              <button
                type="button"
                onClick={() => printReceipt({
                  requestNo: done.requestNo || done.delivery.requestNo,
                  voucherCode: done.voucherCode,
                  deliveryType: done.delivery.deliveryType,
                  location: done.delivery.location,
                  deliveredAt: done.deliveredAt,
                  caseName: done.beneficiary.caseId?.name,
                  caseCode: done.beneficiary.caseId?.code,
                  familyMembers: done.beneficiary.caseId?.familyMembers,
                  casePoints: done.casePoints ?? done.beneficiary.caseId?.points,
                  items: done.takenItems || [],
                })}
                className="btn-primary text-sm inline-flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                طباعة الإيصال
              </button>
            </div>
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
              <Row label="نقاط الحالة المتاحة" value={fmt(b.caseId?.points)} />
              <Row label="عدد أفراد الأسرة" value={b.caseId?.familyMembers ? String(b.caseId.familyMembers) : 'غير محدد'} />
              {d.amount ? <Row label="المبلغ" value={`${d.amount} ج.م`} /> : null}
              <Row label="مكان التسليم" value={d.location} />
              <Row label="تاريخ التسليم" value={d.scheduledFor ? new Date(d.scheduledFor).toLocaleDateString('ar-EG') : ''} />
              <Row label="تم التسليم في هذا الطلب" value={`${d.delivered} من ${d.total}`} />
            </div>
          </div>
          {d.notes && <p className="text-sm text-gray-600 mt-3">ملاحظات الإدارة: {d.notes}</p>}
          {d.items?.length > 0 && (
            <TakeItems items={d.items} picks={picks} setPicks={setPicks} casePoints={Number(b.caseId?.points) || 0} familyMembers={b.caseId?.familyMembers} live={d.stockMode === 'live'} />
          )}
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
