'use client'
import { useState, useEffect } from 'react'

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', organization: '', governorate: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetch('/api/users')
      .then(r => r.json())
      .then(data => {
        setUsers(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function handleCreate(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSubmitting(false)
    if (res.ok) {
      const newUser = await res.json()
      setUsers([newUser, ...users])
      setShowForm(false)
      setForm({ name: '', email: '', password: '', phone: '', organization: '', governorate: '' })
      setSuccess('تم إنشاء الحساب بنجاح')
    } else {
      const data = await res.json()
      setError(data.error || 'حدث خطأ')
    }
  }

  async function handleDeactivate(id) {
    if (!confirm('هل تريد تعطيل هذا الحساب؟')) return
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setUsers(users.map(u => u._id === id ? { ...u, isActive: false } : u))
    }
  }

  async function handleActivate(id) {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: true }),
    })
    if (res.ok) {
      setUsers(users.map(u => u._id === id ? { ...u, isActive: true } : u))
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">المستخدمون</h1>
        <button className="btn-primary text-sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'إلغاء' : '+ إضافة مستخدم جديد'}
        </button>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg mb-4 text-sm">
          {success}
        </div>
      )}

      {showForm && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">إنشاء حساب مستخدم جديد</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الاسم الكامل <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور المؤقتة <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="input-field"
                  placeholder="سيُطلب من المستخدم تغييرها"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الجهة / المنظمة</label>
                <input
                  type="text"
                  value={form.organization}
                  onChange={e => setForm({ ...form, organization: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المحافظة</label>
                <input
                  type="text"
                  value={form.governorate}
                  onChange={e => setForm({ ...form, governorate: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
            </button>
          </form>
        </div>
      )}

      <div className="card">
        {loading ? (
          <div className="text-center py-8 text-gray-500">جاري التحميل...</div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-gray-400">لا يوجد مستخدمون</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">الاسم</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">البريد الإلكتروني</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">الجهة</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">المحافظة</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">الدور</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">الحالة</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u._id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 font-medium text-gray-800 border-b">{u.name}</td>
                    <td className="px-4 py-3 text-gray-600 border-b">{u.email}</td>
                    <td className="px-4 py-3 text-gray-600 border-b">{u.organization || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 border-b">{u.governorate || '—'}</td>
                    <td className="px-4 py-3 text-center border-b">
                      <span className={`badge ${u.role === 'admin' ? 'badge-approved' : 'badge-active'}`}>
                        {u.role === 'admin' ? 'مشرف' : 'مستخدم'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center border-b">
                      {u.isActive !== false ? (
                        <span className="badge badge-active">نشط</span>
                      ) : (
                        <span className="badge badge-rejected">معطل</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center border-b">
                      {u.role !== 'admin' && (
                        u.isActive !== false ? (
                          <button
                            onClick={() => handleDeactivate(u._id)}
                            className="text-xs text-red-600 hover:text-red-800 font-medium"
                          >
                            تعطيل
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivate(u._id)}
                            className="text-xs text-green-600 hover:text-green-800 font-medium"
                          >
                            تفعيل
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
