'use client'
import { useState, useEffect, Fragment } from 'react'
import { useParams } from 'next/navigation'
import { whatsappLink, smsLink, isValidEgyptMobile } from '../../../../../lib/phone'
import { FOOD_ITEMS, OTHER_ITEM, itemsToText } from '../../../../../lib/foodItems'

const statusMap = {
  scheduled: { label: 'مفتوح', cls: 'badge-pending' },
  delivered: { label: 'مغلق - تم التسليم', cls: 'badge-active' },
  confirmed: { label: 'مؤكد', cls: 'badge-approved' },
  failed: { label: 'فشل', cls: 'badge-rejected' },
}
const smsMap = {
  sent: { label: 'تم الإرسال', cls: 'badge-active' },
  queued: { label: 'جاري الإرسال من هاتف البوابة', cls: 'badge-suspended' },
  failed: { label: 'فشل الإرسال', cls: 'badge-rejected' },
  manual: { label: 'إرسال يدوي', cls: 'badge-suspended' },
  not_sent: { label: 'لم يُرسل', cls: 'badge-pending' },
}
const emptyForm = {
  deliveryType: '', location: '', scheduledFor: '', amount: '', notes: '', sendSms: true,
}

function smsText(b) {
  return `رسالة نور للتنمية: ${b.caseId?.name ? b.caseId.name + '، ' : ''}كود استلام المساعدة الخاص بك هو ${b.code}. يرجى تقديمه عند الاستلام.`
}

function ManualSendButtons({ phone, text }) {
  if (!phone) return null
  return (
    <span className="inline-flex gap-2">
      <a href={whatsappLink(phone, text)} target="_blank" rel="noreferrer" className="text-xs text-green-700 hover:underline font-medium">واتساب</a>
      <a href={smsLink(phone, text)} className="text-xs text-blue-700 hover:underline font-medium">SMS</a>
    </span>
  )
}

// ---------- الأصناف picker ----------
function ItemsPicker({ items, setItems }) {
  const [other, setOther] = useState('')
  const [showOther, setShowOther] = useState(false)
  const chosen = new Set(items.map(i => i.name))

  function add(name) {
    if (!name || chosen.has(name)) return
    setItems([...items, { name, quantity: '' }])
  }

  return (
    <div>
      <div className="flex gap-2 flex-wrap items-center">
        <select
          value=""
          onChange={e => {
            const v = e.target.value
            if (v === OTHER_ITEM) setShowOther(true)
            else add(v)
          }}
          className="input-field w-64"
        >
          <option value="">+ اختر صنفًا لإضافته</option>
          {FOOD_ITEMS.filter(n => !chosen.has(n)).map(n => <option key={n} value={n}>{n}</option>)}
          <option value={OTHER_ITEM}>{OTHER_ITEM} (إدخال يدوي)</option>
        </select>
        {showOther && (
          <div className="flex gap-2">
            <input
              type="text"
              value={other}
              onChange={e => setOther(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(other.trim()); setOther(''); setShowOther(false) } }}
              placeholder="اكتب اسم الصنف"
              className="input-field w-48"
              autoFocus
            />
            <button type="button" className="btn-secondary text-sm" onClick={() => { add(other.trim()); setOther(''); setShowOther(false) }}>إضافة</button>
          </div>
        )}
      </div>
      {items.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {items.map((it, idx) => (
            <div key={it.name} className="flex items-center gap-2 bg-primary-50 border border-primary-200 rounded-lg px-2 py-1">
              <span className="text-sm font-medium text-primary-900">{it.name}</span>
              <input
                type="text"
                value={it.quantity}
                onChange={e => setItems(items.map((x, i) => (i === idx ? { ...x, quantity: e.target.value } : x)))}
                placeholder="الكمية"
                className="w-20 text-xs border border-gray-300 rounded px-1.5 py-1"
              />
              <button type="button" onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-gray-400 hover:text-red-600 text-lg leading-none">×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------- cases (beneficiaries) picker ----------
function CasesPicker({ cases, selected, setSelected }) {
  const [search, setSearch] = useState('')
  const shown = cases.filter(c => !search || c.name?.includes(search) || c.code?.includes(search) || c.phone?.includes(search))

  function toggle(c) {
    const next = { ...selected }
    if (next[c._id] !== undefined) delete next[c._id]
    else next[c._id] = c.phone || ''
    setSelected(next)
  }
  function selectAll() {
    const next = { ...selected }
    shown.forEach(c => { if (next[c._id] === undefined) next[c._id] = c.phone || '' })
    setSelected(next)
  }

  return (
    <div>
      <div className="flex gap-2 items-center mb-2 flex-wrap">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالاسم أو الكود أو الهاتف..." className="input-field flex-1 min-w-48" />
        <button type="button" onClick={selectAll} className="btn-secondary text-sm">تحديد الكل</button>
        <button type="button" onClick={() => setSelected({})} className="btn-secondary text-sm">إلغاء التحديد</button>
        <span className="text-sm text-gray-600">المختار: <b>{Object.keys(selected).length}</b></span>
      </div>
      <div className="border rounded-lg max-h-72 overflow-y-auto">
        {shown.length === 0 ? (
          <p className="text-center text-gray-400 py-6 text-sm">لا توجد حالات</p>
        ) : shown.map(c => {
          const on = selected[c._id] !== undefined
          return (
            <div key={c._id} className={`flex items-center gap-3 px-3 py-2 border-b last:border-0 ${on ? 'bg-primary-50' : ''}`}>
              <input type="checkbox" checked={on} onChange={() => toggle(c)} />
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggle(c)}>
                <p className="text-sm font-medium text-gray-800 truncate">{c.name} <span className="font-mono text-xs text-primary-700">{c.code}</span></p>
                <p className="text-xs text-gray-500 truncate">{c.caseType}</p>
              </div>
              {on && (
                <div className="w-44">
                  <input
                    type="tel"
                    dir="ltr"
                    value={selected[c._id]}
                    onChange={e => setSelected({ ...selected, [c._id]: e.target.value })}
                    placeholder="01xxxxxxxxx"
                    className={`w-full text-sm border rounded px-2 py-1 ${selected[c._id] && isValidEgyptMobile(selected[c._id]) ? 'border-gray-300' : 'border-amber-400 bg-amber-50'}`}
                  />
                  {!selected[c._id]
                    ? <p className="text-[11px] text-amber-600 mt-0.5">لا يوجد رقم مسجل — أدخله</p>
                    : !isValidEgyptMobile(selected[c._id]) && <p className="text-[11px] text-red-600 mt-0.5">رقم غير صالح (11 رقمًا يبدأ بـ 01)</p>}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---------- beneficiaries table of one delivery ----------
function BeneficiariesTable({ delivery, onSend, sendingKey, lastSms }) {
  const [editing, setEditing] = useState(null)
  const [draft, setDraft] = useState('')
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-gray-500 border-b">
          <th className="text-right px-2 py-2">الحالة</th>
          <th className="text-right px-2 py-2">الكود</th>
          <th className="text-right px-2 py-2">الهاتف</th>
          <th className="text-center px-2 py-2">الرسالة</th>
          <th className="text-center px-2 py-2">الاستلام</th>
          <th className="text-center px-2 py-2">إجراء</th>
        </tr>
      </thead>
      <tbody>
        {delivery.beneficiaries.map(b => {
          const sm = smsMap[b.smsStatus || 'not_sent']
          const pending = b.status !== 'delivered'
          const res = lastSms?.[b._id]
          return (
            <tr key={b._id} className="border-b last:border-0">
              <td className="px-2 py-2">
                <span className="font-mono text-primary-700">{b.caseId?.code}</span> {b.caseId?.name}
              </td>
              <td className="px-2 py-2 font-mono font-bold text-primary-800 text-sm tracking-wider">{b.code}</td>
              <td className="px-2 py-2" dir="ltr">
                {editing === b._id ? (
                  <span className="inline-flex gap-1" dir="rtl">
                    <input value={draft} onChange={e => setDraft(e.target.value)} dir="ltr" className="w-32 border rounded px-1.5 py-1" placeholder="01xxxxxxxxx" />
                    <button
                      onClick={() => { onSend(delivery, b._id, draft); setEditing(null) }}
                      disabled={!isValidEgyptMobile(draft)}
                      className="text-primary-700 font-medium disabled:opacity-40"
                    >حفظ وإرسال</button>
                    <button onClick={() => setEditing(null)} className="text-gray-400">إلغاء</button>
                  </span>
                ) : (
                  <>
                    {b.phone || '—'}
                    {pending && delivery.status === 'scheduled' && (
                      <button onClick={() => { setEditing(b._id); setDraft(b.phone || '') }} className="text-[11px] text-gray-500 hover:text-primary-700 mr-2" dir="rtl">تعديل</button>
                    )}
                    {b.phone && !isValidEgyptMobile(b.phone) && <div className="text-[11px] text-red-600" dir="rtl">رقم غير صالح</div>}
                  </>
                )}
              </td>
              <td className="px-2 py-2 text-center">
                <span className={`badge ${sm.cls}`} title={b.smsError || b.smsState || ''}>{sm.label}</span>
                {b.smsStatus === 'failed' && b.smsError && !res && (
                  <div className="text-[11px] text-red-600 mt-1 max-w-48 mx-auto">{b.smsError}</div>
                )}
                {res && !res.ok && (
                  <div className="text-[11px] text-red-600 mt-1 max-w-48 mx-auto">
                    {res.manual ? 'خدمة الرسائل غير مفعلة على الخادم — استخدم واتساب أو SMS' : res.error}
                  </div>
                )}
              </td>
              <td className="px-2 py-2 text-center">
                {pending
                  ? <span className="badge badge-pending">لم يستلم</span>
                  : <span className="badge badge-active">استلم {b.deliveredAt ? new Date(b.deliveredAt).toLocaleDateString('ar-EG') : ''}</span>}
              </td>
              <td className="px-2 py-2 text-center whitespace-nowrap">
                {pending && delivery.status === 'scheduled' && (
                  <span className="inline-flex gap-3 items-center">
                    <button onClick={() => onSend(delivery, b._id)} disabled={sendingKey === b._id} className="text-primary-700 hover:text-primary-900 font-medium">
                      {sendingKey === b._id ? '...' : b.smsStatus === 'sent' ? 'إعادة إرسال' : 'إرسال'}
                    </button>
                    <ManualSendButtons phone={b.phone} text={smsText(b)} />
                  </span>
                )}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

export default function AdminUserDeliveriesPage() {
  const { id: userId } = useParams()
  const [deliveries, setDeliveries] = useState([])
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [items, setItems] = useState([])
  const [selected, setSelected] = useState({}) // caseId -> phone
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [expanded, setExpanded] = useState(null)
  const [sendingKey, setSendingKey] = useState(null)
  const [lastSms, setLastSms] = useState({}) // beneficiaryId -> result
  const [notice, setNotice] = useState(null)
  const [smsCfg, setSmsCfg] = useState(null)

  useEffect(() => {
    Promise.all([
      fetch(`/api/deliveries?userId=${userId}`).then(r => r.json()),
      fetch(`/api/cases?userId=${userId}`).then(r => r.json()),
      fetch('/api/admin/sms-status').then(r => (r.ok ? r.json() : null)).catch(() => null),
    ]).then(([dels, cas, cfg]) => {
      setSmsCfg(cfg)
      setDeliveries(Array.isArray(dels) ? dels : [])
      setCases(Array.isArray(cas) ? cas : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [userId])

  function rememberSms(sms) {
    if (!sms || !sms.length) return
    const map = { ...lastSms }
    sms.forEach(r => { map[r.beneficiaryId] = r })
    setLastSms(map)
    const sent = sms.filter(r => r.ok && !r.queued).length
    const queued = sms.filter(r => r.queued).length
    const manual = sms.some(r => r.manual)
    setNotice(
      manual ? { type: 'warn', text: 'لم يتم إرسال أي رسالة: خدمة الرسائل غير مفعلة على الخادم — أرسل الأكواد يدويًا عبر واتساب أو SMS من الجدول.' }
      : queued ? { type: 'warn', text: `${queued} رسالة في الانتظار: البوابة استلمتها لكن هاتف Android لم يرسلها بعد — تأكد أن تطبيق SMS Gateway يعمل ومتصل بالإنترنت.` }
      : sent === sms.length ? { type: 'ok', text: `تم إرسال ${sent} رسالة من هاتف البوابة` }
      : { type: 'err', text: `تم إرسال ${sent} من ${sms.length} رسالة — راجع سبب الفشل في الجدول` }
    )
  }

  async function handleCreate(e) {
    e.preventDefault()
    setError('')
    setNotice(null)
    const beneficiaries = Object.entries(selected).map(([caseId, phone]) => ({ caseId, phone }))
    if (!beneficiaries.length) return setError('اختر حالة واحدة على الأقل')
    setSubmitting(true)
    const res = await fetch('/api/deliveries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, userId, items, beneficiaries }),
    })
    setSubmitting(false)
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      setDeliveries([data.delivery, ...deliveries])
      setExpanded(data.delivery._id)
      rememberSms(data.sms)
      if (!data.sms) setNotice({ type: 'ok', text: `تم إنشاء التسليم ${data.delivery.requestNo} بكود ${data.delivery.codePrefix} — لم يتم إرسال رسائل بعد.` })
      setShowForm(false)
      setForm(emptyForm)
      setItems([])
      setSelected({})
    } else {
      setError(data.error || 'حدث خطأ أثناء الإنشاء')
    }
  }

  async function handleSend(delivery, beneficiaryId, phone) {
    setSendingKey(beneficiaryId || delivery._id)
    const res = await fetch(`/api/deliveries/${delivery._id}/send-sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(beneficiaryId ? { beneficiaryId, ...(phone ? { phone } : {}) } : {}),
    })
    setSendingKey(null)
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      setDeliveries(deliveries.map(d => (d._id === delivery._id ? data.delivery : d)))
      rememberSms(data.sms)
    } else {
      setNotice({ type: 'err', text: data.error || 'فشل الإرسال' })
    }
  }

  async function handleRefresh(delivery) {
    setSendingKey('r' + delivery._id)
    const res = await fetch(`/api/deliveries/${delivery._id}/sms-refresh`, { method: 'POST' })
    setSendingKey(null)
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      setDeliveries(deliveries.map(d => (d._id === delivery._id ? data.delivery : d)))
      rememberSms(data.sms)
    } else {
      setNotice({ type: 'err', text: data.error || 'تعذر تحديث الحالة' })
    }
  }

  const shown = deliveries.filter(d =>
    filter === 'all' ? true : filter === 'open' ? d.status === 'scheduled' : d.status !== 'scheduled'
  )

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">إدارة التسليمات</h1>
        <button className="btn-primary text-sm" onClick={() => { setShowForm(!showForm); setError('') }}>
          {showForm ? 'إلغاء' : '+ تسليم جديد'}
        </button>
      </div>

      {smsCfg && !smsCfg.configured && (
        <div className="p-3 rounded-lg mb-4 text-sm border bg-red-50 border-red-200 text-red-800">
          <b>خدمة الرسائل غير مفعلة:</b>{' '}
          {smsCfg.provider === 'none'
            ? 'الخادم لا يرى المتغير SMS_PROVIDER، لذلك لن تُرسل أي رسالة فعلية. على الجهاز المحلي أضفه في ‎.env.local وأعد التشغيل؛ على Vercel أضفه في Settings → Environment Variables (بيئة Production) ثم Redeploy.'
            : smsCfg.unknownProvider
            ? `قيمة SMS_PROVIDER غير معروفة ("${smsCfg.provider}") — يجب أن تكون smsgate`
            : `متغيرات ناقصة على الخادم: ${smsCfg.missing.join(', ')}`}
          {smsCfg.seen && (
            <div className="mt-2 text-xs font-mono" dir="ltr">
              server{smsCfg.deployment ? ` (${smsCfg.deployment})` : ''} sees:{' '}
              {Object.entries(smsCfg.seen).map(([k, v]) => `${k} ${v ? '✓' : '✗'}`).join('   ')}
            </div>
          )}
        </div>
      )}

      {notice && (
        <div className={`p-3 rounded-lg mb-4 text-sm border ${
          notice.type === 'ok' ? 'bg-green-50 border-green-200 text-green-800'
          : notice.type === 'err' ? 'bg-red-50 border-red-200 text-red-700'
          : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
          {notice.text}
        </div>
      )}

      {showForm && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">إضافة تسليم</h2>
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نوع التسليم (اسم الطلب)</label>
                <input type="text" value={form.deliveryType} onChange={e => setForm({ ...form, deliveryType: e.target.value })}
                  className="input-field" placeholder="مثال: مساعدة شهرية، كرتونة رمضان" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">مكان التسليم</label>
                <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ التسليم</label>
                <input type="date" value={form.scheduledFor} onChange={e => setForm({ ...form, scheduledFor: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ (ج.م)</label>
                <input type="number" min="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="input-field" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الأصناف</label>
              <ItemsPicker items={items} setItems={setItems} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الحالات المستفيدة من هذا التسليم</label>
              <CasesPicker cases={cases} selected={selected} setSelected={setSelected} />
            </div>

            <div className="bg-gray-50 border rounded-lg p-3 text-sm text-gray-600">
              <b className="text-gray-800">أكواد القسائم تُولّد تلقائيًا:</b> حرفان إنجليزيان لهذا التسليم (نفس الحرفين لكل الحالات)
              + 4 أرقام مختلفة لكل حالة — مثال: <span className="font-mono font-bold text-primary-800" dir="ltr">KT4821</span>،{' '}
              <span className="font-mono font-bold text-primary-800" dir="ltr">KT0937</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="input-field" rows={2} />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={form.sendSms} onChange={e => setForm({ ...form, sendSms: e.target.checked })} />
              إرسال الكود لكل مستفيد برسالة SMS بعد الإنشاء
            </label>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'جاري الحفظ...' : `إضافة التسليم وتوليد الأكواد (${Object.keys(selected).length})`}
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <div className="flex gap-2 mb-4">
          {[['all', 'الكل'], ['open', 'مفتوحة'], ['closed', 'مغلقة']].map(([k, label]) => (
            <button key={k} onClick={() => setFilter(k)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${filter === k ? 'bg-primary-700 text-white border-primary-700' : 'text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
              {label}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="text-center py-8 text-gray-500">جاري التحميل...</div>
        ) : shown.length === 0 ? (
          <div className="text-center py-12 text-gray-400">لا توجد تسليمات</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-right px-3 py-3 font-semibold text-gray-700">رقم الطلب</th>
                  <th className="text-right px-3 py-3 font-semibold text-gray-700">نوع التسليم</th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-700">حروف الكود</th>
                  <th className="text-right px-3 py-3 font-semibold text-gray-700">الأصناف</th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-700">المستفيدون</th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-700">الحالة</th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-700">تاريخ التسليم</th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-700">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((d, i) => {
                  const s = statusMap[d.status] || { label: d.status, cls: 'badge-pending' }
                  const total = d.beneficiaries?.length || 0
                  const got = d.beneficiaries?.filter(b => b.status === 'delivered').length || 0
                  const pendingCount = total - got
                  const isOpen = expanded === d._id
                  return (
                    <Fragment key={d._id}>
                      <tr className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-3 py-3 font-mono text-gray-700 border-b">{d.requestNo || '—'}</td>
                        <td className="px-3 py-3 text-gray-800 font-medium border-b">{d.deliveryType}</td>
                        <td className="px-3 py-3 text-center font-mono font-bold text-primary-800 border-b">{d.codePrefix}</td>
                        <td className="px-3 py-3 text-gray-600 border-b text-xs max-w-xs">{itemsToText(d.items) || '—'}</td>
                        <td className="px-3 py-3 text-center border-b">{got} / {total}</td>
                        <td className="px-3 py-3 text-center border-b"><span className={`badge ${s.cls}`}>{s.label}</span></td>
                        <td className="px-3 py-3 text-center text-gray-500 border-b text-xs">
                          {d.deliveredAt ? new Date(d.deliveredAt).toLocaleDateString('ar-EG')
                            : d.scheduledFor ? new Date(d.scheduledFor).toLocaleDateString('ar-EG') : '—'}
                        </td>
                        <td className="px-3 py-3 text-center border-b whitespace-nowrap">
                          <button onClick={() => setExpanded(isOpen ? null : d._id)} className="text-xs text-primary-700 hover:text-primary-900 font-medium">
                            {isOpen ? 'إخفاء' : 'المستفيدون والأكواد'}
                          </button>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr>
                          <td colSpan={8} className="bg-primary-50/40 border-b px-4 py-3">
                            <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-gray-700">المستفيدون ({total})</p>
                              {d.beneficiaries.some(b => b.smsStatus === 'queued') && (
                                <button onClick={() => handleRefresh(d)} disabled={sendingKey === 'r' + d._id} className="btn-secondary text-xs py-1.5">
                                  {sendingKey === 'r' + d._id ? 'جاري التحديث...' : '↻ تحديث حالة الرسائل'}
                                </button>
                              )}
                              {d.status === 'scheduled' && pendingCount > 0 && (
                                <button onClick={() => handleSend(d)} disabled={sendingKey === d._id} className="btn-primary text-xs py-1.5">
                                  {sendingKey === d._id ? 'جاري الإرسال...' : `إرسال الأكواد لكل من لم يستلم (${pendingCount})`}
                                </button>
                              )}
                            </div>
                            <div className="bg-white rounded-lg border">
                              <BeneficiariesTable delivery={d} onSend={handleSend} sendingKey={sendingKey} lastSms={lastSms} />
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
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
