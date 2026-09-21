'use client'
import { useState, useEffect } from 'react'

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState([])
  const [users, setUsers] = useState([])
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ to: '', caseId: '', subject: '', body: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/messages').then(r => r.json()),
      fetch('/api/users').then(r => r.json()),
      fetch('/api/cases').then(r => r.json()),
    ]).then(([msgs, us, cas]) => {
      setMessages(Array.isArray(msgs) ? msgs : [])
      setUsers(Array.isArray(us) ? us : [])
      setCases(Array.isArray(cas) ? cas : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  async function handleSend(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSubmitting(false)
    if (res.ok) {
      const newMsg = await res.json()
      setMessages([newMsg, ...messages])
      setShowForm(false)
      setForm({ to: '', caseId: '', subject: '', body: '' })
      setSuccess('تم إرسال الرسالة بنجاح')
    } else {
      setError('حدث خطأ أثناء الإرسال')
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">الرسائل</h1>
        <button className="btn-primary text-sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'إلغاء' : '+ إرسال رسالة'}
        </button>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg mb-4 text-sm">
          {success}
        </div>
      )}

      {showForm && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">إرسال رسالة جديدة</h2>
          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">إلى (المستخدم)</label>
              <select
                value={form.to}
                onChange={e => setForm({ ...form, to: e.target.value })}
                className="input-field"
                required
              >
                <option value="">-- اختر المستخدم --</option>
                {users.filter(u => u.role !== 'admin').map(u => (
                  <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الحالة المرتبطة (اختياري)</label>
              <select
                value={form.caseId}
                onChange={e => setForm({ ...form, caseId: e.target.value })}
                className="input-field"
              >
                <option value="">-- بدون ارتباط بحالة --</option>
                {cases.map(c => (
                  <option key={c._id} value={c._id}>{c.code} - {c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الموضوع</label>
              <input
                type="text"
                value={form.subject}
                onChange={e => setForm({ ...form, subject: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نص الرسالة</label>
              <textarea
                value={form.body}
                onChange={e => setForm({ ...form, body: e.target.value })}
                className="input-field"
                rows={5}
                required
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'جاري الإرسال...' : 'إرسال'}
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <p className="text-sm text-gray-500 mb-4">الرسائل المرسلة</p>
        {loading ? (
          <div className="text-center py-8 text-gray-500">جاري التحميل...</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-gray-400">لا توجد رسائل مرسلة</div>
        ) : (
          <div className="space-y-3">
            {messages.map(msg => (
              <div key={msg._id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-800">{msg.subject}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      إلى: {msg.to?.name || '—'}
                      {msg.caseId && ` • الحالة: ${msg.caseId.code}`}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(msg.createdAt).toLocaleDateString('ar-EG')}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">{msg.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
