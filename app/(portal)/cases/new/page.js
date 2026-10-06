'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const MONTHLY_TYPES = [
  'الحالات الشهرية',
  'الحاله الشهرية (المرأة المعيلة)',
  'الحاله الشهرية (العجز والإعاقة)',
  'الحاله الشهرية (الطلبة الوافدين)',
  'الحاله الشهرية (كبار السن)',
  'الحاله الشهرية (التكية)',
  'مشروع التقزم',
]

const SEASONAL_TYPES = [
  'الحالات الموسمية',
  'الحاله الموسمية (المرأة المعيلة)',
  'الحاله الموسمية (العجز والإعاقة)',
  'الحاله الموسمية (الطلبة الوافدين)',
  'الحاله الموسمية (كبار السن)',
  'مشروع التكية الموسمية',
]

const GOVERNORATES = [
  'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'البحر الأحمر',
  'البحيرة', 'الفيوم', 'الغربية', 'الإسماعيلية', 'المنوفية',
  'المنيا', 'القليوبية', 'الوادي الجديد', 'السويس', 'أسوان',
  'أسيوط', 'بني سويف', 'بورسعيد', 'دمياط', 'الشرقية',
  'جنوب سيناء', 'كفر الشيخ', 'مطروح', 'الأقصر', 'قنا',
  'شمال سيناء', 'سوهاج',
]

export default function NewCasePage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    age: '',
    nationalId: '',
    passportNumber: '',
    caseType: '',
    phone: '',
    governorate: '',
    address: '',
    comment: '',
    familyMembers: '',
    points: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.name || !form.caseType) {
      setError('يرجى ملء الحقول المطلوبة')
      return
    }
    setSubmitting(true)
    const res = await fetch('/api/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSubmitting(false)
    if (res.ok) {
      router.push('/cases/monthly')
    } else {
      const data = await res.json()
      setError(data.error || 'حدث خطأ أثناء الإرسال')
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">طلب حالة جديدة</h1>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الاسم الكامل <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">العمر</label>
              <input
                type="number"
                name="age"
                value={form.age}
                onChange={handleChange}
                className="input-field"
                min="0"
                max="120"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الرقم القومي</label>
              <input
                type="text"
                name="nationalId"
                value={form.nationalId}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">رقم جواز السفر</label>
              <input
                type="text"
                name="passportNumber"
                value={form.passportNumber}
                onChange={handleChange}
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">عدد أفراد الأسرة</label>
              <input
                type="number"
                name="familyMembers"
                value={form.familyMembers}
                onChange={handleChange}
                className="input-field"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">عدد النقاط</label>
              <input
                type="number"
                name="points"
                value={form.points}
                onChange={handleChange}
                className="input-field"
                min="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              نوع الحالة <span className="text-red-500">*</span>
            </label>
            <select
              name="caseType"
              value={form.caseType}
              onChange={handleChange}
              className="input-field"
              required
            >
              <option value="">-- اختر نوع الحالة --</option>
              <optgroup label="الحالات الشهرية">
                {MONTHLY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </optgroup>
              <optgroup label="الحالات الموسمية">
                {SEASONAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </optgroup>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المحافظة</label>
              <select
                name="governorate"
                value={form.governorate}
                onChange={handleChange}
                className="input-field"
              >
                <option value="">-- اختر المحافظة --</option>
                {GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
            <input
              type="text"
              name="address"
              value={form.address}
              onChange={handleChange}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
            <textarea
              name="comment"
              value={form.comment}
              onChange={handleChange}
              className="input-field"
              rows={3}
            />
          </div>

          {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}

          <div className="flex gap-3">
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'جاري الإرسال...' : 'إرسال الطلب'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => router.back()}
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
