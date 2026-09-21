'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export default function PersonalInfoPage() {
  const { data: session } = useSession()
  const [form, setForm] = useState({ name: '', phone: '', organization: '', governorate: '' })
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' })
  const [saving, setSaving] = useState(false)
  const [savingPass, setSavingPass] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [passMessage, setPassMessage] = useState('')
  const [passError, setPassError] = useState('')

  useEffect(() => {
    if (session?.user) {
      setForm({
        name: session.user.name || '',
        phone: session.user.phone || '',
        organization: session.user.organization || '',
        governorate: session.user.governorate || '',
      })
    }
  }, [session])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')
    const res = await fetch(`/api/users/${session.user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (res.ok) setMessage('تم حفظ البيانات بنجاح')
    else setError('حدث خطأ أثناء الحفظ')
  }

  async function handlePasswordChange(e) {
    e.preventDefault()
    setPassMessage('')
    setPassError('')
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPassError('كلمتا المرور غير متطابقتين')
      return
    }
    if (passwordForm.newPassword.length < 8) {
      setPassError('كلمة المرور يجب أن تكون 8 أحرف على الأقل')
      return
    }
    setSavingPass(true)
    const res = await fetch(`/api/users/${session.user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword: passwordForm.newPassword }),
    })
    setSavingPass(false)
    if (res.ok) {
      setPassMessage('تم تغيير كلمة المرور بنجاح')
      setPasswordForm({ newPassword: '', confirmPassword: '' })
    } else {
      setPassError('حدث خطأ أثناء تغيير كلمة المرور')
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">معلومات شخصية</h1>

      {/* Profile Info */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">البيانات الشخصية</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الاسم الكامل</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
            <input
              type="email"
              value={session?.user?.email || ''}
              className="input-field bg-gray-100"
              disabled
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
          {message && <p className="text-green-600 text-sm">{message}</p>}
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'جاري الحفظ...' : 'حفظ البيانات'}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">تغيير كلمة المرور</h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور الجديدة</label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">تأكيد كلمة المرور</label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              className="input-field"
              required
            />
          </div>
          {passMessage && <p className="text-green-600 text-sm">{passMessage}</p>}
          {passError && <p className="text-red-600 text-sm">{passError}</p>}
          <button type="submit" className="btn-primary" disabled={savingPass}>
            {savingPass ? 'جاري التغيير...' : 'تغيير كلمة المرور'}
          </button>
        </form>
      </div>
    </div>
  )
}
