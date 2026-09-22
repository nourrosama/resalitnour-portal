'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

// ─── EFB Profile sections ────────────────────────────────────────────────────
const SECTIONS = [
  {
    id: 'basics',
    title: 'أساسيات التعامل',
    fields: [
      { key: 'hasPermanentSign', label: 'هل توجد لافتة دائمة خاصة بالجهة مثبتة على المقر ؟', type: 'yesno' },
      { key: 'hasWaitingArea', label: 'هل توفر الجهة مكان لإستقبال الحالات المستفيدة به مقاعد - مظلل - به مصدر للمياه ودورة مياه ؟', type: 'yesno' },
      { key: 'hasComputerInternet', label: 'هل يوجد لدى الجهة جهاز كمبيوتر وانترنت؟', type: 'yesno' },
      { key: 'hasTrainedResearcher', label: 'هل يوجد باحث اجتماعي مدرب لدراسة الحالات ميدانيا ؟', type: 'yesno' },
      { key: 'usesTechnology', label: 'هل تستخدم الجهة فى الثلاث أشهر الماضية على الأقل (كمبيوتر و إنترنت و بريد إلكتروني و واتس آب و اسكانر) ؟', type: 'yesno' },
      { key: 'hasCertifiedFinancialRecords', label: 'هل الدفاتر المالية للجهة مرقمة ومعتمدة من الجهة الإدارية ؟', type: 'yesno' },
      { key: 'hasBalanceSheet', label: 'وجود الميزانية العمومية والحسابات الختامية للجهة لأخر سنة مالية منتهية', type: 'yesno' },
    ],
  },
  {
    id: 'registration',
    title: 'البيانات الأولية للتسجيل',
    fields: [
      { key: 'organizationType', label: 'نوع الجهة', type: 'select', options: ['جمعية أهلية', 'لجنة زكاة', 'مؤسسة', 'اتحاد', 'أخرى'] },
      { key: 'organizationName', label: 'إسم الجهة', type: 'text' },
      { key: 'registrationNumberYear', label: 'رقم الاشهار / سنة الاشهار', type: 'text' },
      { key: 'orgEmail', label: 'البريد الألكتروني للجهة', type: 'text' },
      { key: 'orgPhone', label: 'رقم الهاتف الخاص بالجهة', type: 'text' },
      { key: 'hasWebsite', label: 'هل لدى الجهة موقع الكتروني ؟', type: 'yesno' },
      { key: 'websiteUrl', label: 'اسم الموقع الالكترونى', type: 'text' },
      { key: 'hasSocialMedia', label: 'هل يوجد للجهة صفحة / حسابات على مواقع التواصل ؟', type: 'yesno' },
      { key: 'socialMediaLinks', label: 'روابط مواقع التواصل', type: 'text' },
    ],
  },
  {
    id: 'geo',
    title: 'البيانات الخاصة بالموقع الجغرافي',
    fields: [
      { key: 'governorate', label: 'محافظة', type: 'text' },
      { key: 'district', label: 'المركز / الحي', type: 'text' },
      { key: 'localUnit', label: 'قسم \\ وحدة محلية', type: 'text' },
      { key: 'village', label: 'شياخة / قرية تابعة', type: 'text' },
      { key: 'street', label: 'عزبه / نجع / منطقة / شارع', type: 'text' },
      { key: 'latitude', label: 'خط العرض', type: 'text' },
      { key: 'longitude', label: 'خط الطول', type: 'text' },
      { key: 'locationLink', label: 'رابط الموقع', type: 'text' },
    ],
  },
  {
    id: 'headquarters',
    title: 'بيانات المقر',
    fields: [
      { key: 'hqAddress', label: 'عنوان المقر الحالي بالتفصيل', type: 'textarea' },
      { key: 'hqType', label: 'نوع المقر', type: 'select', options: ['مملوك', 'مستأجر', 'مجاني', 'أخرى'] },
      { key: 'hqContractType', label: 'نوع عقد المقر ( سند شغل )', type: 'text' },
      { key: 'hqFinishingLevel', label: 'مستوى تشطيب المقر', type: 'select', options: ['خام', 'عادي', 'جيد', 'ممتاز'] },
      { key: 'hqArea', label: 'مساحة مقر الرئيسي (م²)', type: 'text' },
      { key: 'hqFloor', label: 'رقم الطابق', type: 'text' },
      { key: 'hqRooms', label: 'عدد الغرف', type: 'text' },
      { key: 'hqDeepFreezers', label: 'عدد الديب فريزر', type: 'text' },
      { key: 'hqFreezerCapacity', label: 'السعة التخزينية للديب فريزر', type: 'text' },
      { key: 'hasTrainingHalls', label: 'وجود قاعات تدريبات (مجهزة ومخصصة)', type: 'yesno' },
      { key: 'hqHasComputer', label: 'هل يوجد جهاز كمبيوتر وإنترنت؟', type: 'yesno' },
      { key: 'internetWorkers', label: 'عدد الاشخاص العاملين على الإنترنت', type: 'text' },
      { key: 'researchersCount', label: 'عدد الباحثين لدي الجهة', type: 'text' },
      { key: 'officeFurniture', label: 'الأثاث والتجهيزات المكتبية', type: 'textarea' },
      { key: 'internalLayoutDesc', label: 'وصف التقسيم الداخلي للمقر', type: 'textarea' },
      { key: 'roomUsage', label: 'استخدامات الغرف بالمقر', type: 'textarea' },
      { key: 'availableFacilities', label: 'المرافق المتوفرة داخل المقر', type: 'textarea' },
      { key: 'allowsEvents', label: 'هل يسمح المقر باقامة فعاليات ومناسبات عامة', type: 'yesno' },
      { key: 'hasBranch', label: 'هل يوجد مقر فرعي', type: 'yesno' },
    ],
  },
  {
    id: 'storage',
    title: 'البيانات الخاصة بالمخزن',
    fields: [
      { key: 'hasStorage', label: 'هل يوجد مخزن؟', type: 'yesno' },
      { key: 'storageLocation', label: 'مكان المخزن', type: 'text' },
      { key: 'storageArea', label: 'مساحة المخزن (م²)', type: 'text' },
      { key: 'storageEquipment', label: 'تجهيزات المخزن', type: 'textarea' },
      { key: 'storageFloor', label: 'رقم الطابق للمخزن', type: 'text' },
      { key: 'hasAdditionalStorage', label: 'هل توجد مخازن تابعة للجهة تسمح بتخزين مساعدات قوافل أو مناسبات', type: 'yesno' },
      { key: 'additionalStorageArea', label: 'مساحة المخازن الإضافية (م²)', type: 'text' },
      { key: 'hasCoolingRoom', label: 'هل توجد غرفة تبريد يمكن استخدامها في المواسم والمناسبات', type: 'yesno' },
    ],
  },
  {
    id: 'kitchen',
    title: 'البيانات الخاصة بالمطبخ',
    fields: [
      { key: 'hasKitchen', label: 'هل يوجد مطبخ خاص بتجهيز الوجبات ؟', type: 'yesno' },
      { key: 'kitchenLocation', label: 'مكان المطبخ', type: 'text' },
      { key: 'dailyMeals', label: 'عدد الوجبات الغداء يوميا', type: 'text' },
      { key: 'kitchenArea', label: 'مساحة المطبخ (م²)', type: 'text' },
      { key: 'kitchenFloor', label: 'رقم الطابق للمطبخ', type: 'text' },
      { key: 'kitchenEquipment', label: 'تجهيزات مطبخ الجهة', type: 'textarea' },
    ],
  },
  {
    id: 'database',
    title: 'البيانات الخاصة بقواعد البيانات',
    fields: [
      { key: 'hasDatabase', label: 'هل لدى الجهة قاعدة بيانات عن فئات الحالات المستفيدة ؟', type: 'yesno' },
      { key: 'researchType', label: 'نوع الأبحاث', type: 'select', options: ['إلكترونية', 'ورقية', 'كلاهما'] },
      { key: 'familiesWithDatabases', label: 'عدد الأسر التي لها قواعد بيانات / أبحاث اجتماعية', type: 'text' },
      { key: 'appropriateSupport', label: 'دعم بنك الطعام المناسب للجهة', type: 'textarea' },
      { key: 'monthlyFamilies', label: 'عدد الأسر التي ترغب الجهة بدعمها شهرياً', type: 'text' },
      { key: 'seasonalFamilies', label: 'عدد الأسر المرشحة للدعم الموسمي (حد أقصى)', type: 'text' },
    ],
  },
  {
    id: 'activities',
    title: 'الأنشطة القائمة بالجهة',
    fields: [
      { key: 'currentActivities', label: 'وصف الأنشطة القائمة بالجهة', type: 'textarea' },
    ],
  },
  {
    id: 'researcher',
    title: 'بيانات الباحث',
    fields: [
      { key: 'researcherName', label: 'اسم الباحث', type: 'text' },
      { key: 'researcherPhone', label: 'رقم هاتف الباحث', type: 'text' },
      { key: 'researcherEmail', label: 'البريد الإلكتروني للباحث', type: 'text' },
      { key: 'researcherQualification', label: 'المؤهل العلمي للباحث', type: 'text' },
    ],
  },
]

// ─── Profile field renderers ─────────────────────────────────────────────────
function ProfileField({ field, value, editing, onChange }) {
  const yesno = field.type === 'yesno'
  const select = field.type === 'select'
  const textarea = field.type === 'textarea'

  if (!editing) {
    return (
      <div className="flex items-start justify-between py-2 border-b border-gray-100 last:border-0 gap-2 text-sm">
        <span className="text-gray-500 leading-relaxed flex-1">{field.label}</span>
        {yesno ? (
          <span className={`shrink-0 px-3 py-0.5 rounded-full text-xs font-semibold ${
            value === 'نعم' ? 'bg-green-100 text-green-700' :
            value === 'لا'  ? 'bg-red-100 text-red-700' :
            'bg-gray-100 text-gray-400'
          }`}>{value || '—'}</span>
        ) : (
          <span className="text-gray-800 font-medium text-left max-w-xs text-right">{value || '—'}</span>
        )}
      </div>
    )
  }

  if (yesno) return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 gap-2 text-sm">
      <span className="text-gray-500 flex-1 leading-relaxed">{field.label}</span>
      <div className="flex gap-4 shrink-0">
        {['نعم', 'لا'].map(opt => (
          <label key={opt} className="flex items-center gap-1.5 cursor-pointer text-gray-700">
            <input type="radio" name={field.key} value={opt} checked={value === opt}
              onChange={() => onChange(field.key, opt)} className="accent-green-700" />
            {opt}
          </label>
        ))}
      </div>
    </div>
  )

  if (select) return (
    <div className="py-2 border-b border-gray-100 last:border-0 text-sm">
      <label className="block text-gray-500 mb-1">{field.label}</label>
      <select value={value || ''} onChange={e => onChange(field.key, e.target.value)}
        className="input-field text-sm">
        <option value="">-- اختر --</option>
        {field.options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )

  const Tag = textarea ? 'textarea' : 'input'
  return (
    <div className="py-2 border-b border-gray-100 last:border-0 text-sm">
      <label className="block text-gray-500 mb-1">{field.label}</label>
      <Tag type={textarea ? undefined : 'text'} value={value || ''}
        onChange={e => onChange(field.key, e.target.value)}
        rows={textarea ? 3 : undefined}
        className="input-field text-sm" placeholder={field.label} />
    </div>
  )
}

function ProfileSection({ section, data, editing, onChange }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 text-right">
        <span className="font-semibold text-gray-700 text-sm">{section.title}</span>
        <span className={`text-gray-400 text-xs transition-transform ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {open && (
        <div className="px-4 pb-2 pt-1">
          {section.fields.map(f => (
            <ProfileField key={f.key} field={f} value={data[f.key] || ''} editing={editing} onChange={onChange} />
          ))}
        </div>
      )}
    </div>
  )
}

function PeopleSection({ title, items, editing, onChange, itemTemplate, fieldDefs }) {
  const [open, setOpen] = useState(false)
  const addItem = () => onChange([...items, { ...itemTemplate }])
  const update = (i, key, val) => onChange(items.map((item, idx) => idx === i ? { ...item, [key]: val } : item))
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i))

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 text-right">
        <span className="font-semibold text-gray-700 text-sm">{title}</span>
        <span className={`text-gray-400 text-xs transition-transform ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {open && (
        <div className="px-4 pb-3 pt-2">
          {items.length === 0 && !editing && (
            <p className="text-gray-400 text-sm text-center py-3">لا توجد بيانات مضافة</p>
          )}
          {items.map((item, i) => (
            <div key={i} className="border border-gray-100 rounded-lg p-3 mb-2 bg-gray-50">
              <div className="flex justify-between items-center mb-2">
                <strong className="text-sm text-gray-700">{item.name || `العنصر ${i + 1}`}</strong>
                {editing && (
                  <button type="button" onClick={() => remove(i)}
                    className="text-xs text-red-500 hover:text-red-700 font-medium">✕ حذف</button>
                )}
              </div>
              {fieldDefs.map(fd => (
                editing ? (
                  <div key={fd.key} className="py-1">
                    <label className="block text-xs text-gray-500 mb-0.5">{fd.label}</label>
                    <input type="text" value={item[fd.key] || ''} onChange={e => update(i, fd.key, e.target.value)}
                      className="input-field text-sm" placeholder={fd.label} />
                  </div>
                ) : (
                  <div key={fd.key} className="flex justify-between text-sm py-1 border-b border-gray-100 last:border-0">
                    <span className="text-gray-500">{fd.label}</span>
                    <span className="text-gray-800">{item[fd.key] || '—'}</span>
                  </div>
                )
              ))}
            </div>
          ))}
          {editing && (
            <button type="button" onClick={addItem}
              className="w-full mt-1 py-2 text-sm text-green-700 border border-dashed border-green-300 rounded-lg hover:bg-green-50">
              + إضافة
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PersonalInfoPage() {
  const { data: session } = useSession()

  // ── Basic user info state ──
  const [form, setForm] = useState({ name: '', phone: '', organization: '', governorate: '' })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // ── Profile (org data) state ──
  const [profile, setProfile] = useState(null)      // null = not yet loaded
  const [profileData, setProfileData] = useState({})
  const [boardMembers, setBoardMembers] = useState([])
  const [executiveStaff, setExecutiveStaff] = useState([])
  const [profileEditing, setProfileEditing] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState('')
  const [profileErr, setProfileErr] = useState('')
  const [profileLoading, setProfileLoading] = useState(true)

  // Load basic info from session
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

  // Load org profile
  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(({ profile: p }) => {
        if (p) {
          const { boardMembers: bm = [], executiveStaff: es = [], ...rest } = p
          setProfile(p)
          setProfileData(rest)
          setBoardMembers(bm)
          setExecutiveStaff(es)
        } else {
          setProfile(null)
        }
        setProfileLoading(false)
      })
      .catch(() => setProfileLoading(false))
  }, [])

  // ── Basic info handlers ──
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

  // ── Profile handlers ──
  const handleProfileChange = (key, val) => setProfileData(prev => ({ ...prev, [key]: val }))

  async function handleProfileSave() {
    setProfileSaving(true)
    setProfileErr('')
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...profileData, boardMembers, executiveStaff }),
      })
      if (!res.ok) throw new Error('فشل الحفظ')
      const { profile: saved } = await res.json()
      const { boardMembers: bm = [], executiveStaff: es = [], ...rest } = saved
      setProfile(saved)
      setProfileData(rest)
      setBoardMembers(bm)
      setExecutiveStaff(es)
      setProfileMsg('تم حفظ بيانات المنظمة بنجاح ✓')
      setProfileEditing(false)
      setTimeout(() => setProfileMsg(''), 3000)
    } catch {
      setProfileErr('حدث خطأ أثناء الحفظ')
    } finally {
      setProfileSaving(false)
    }
  }

  async function handleProfileCancel() {
    setProfileEditing(false)
    setProfileErr('')
    // re-fetch to discard unsaved changes
    const res = await fetch('/api/profile')
    const { profile: p } = await res.json()
    if (p) {
      const { boardMembers: bm = [], executiveStaff: es = [], ...rest } = p
      setProfileData(rest)
      setBoardMembers(bm)
      setExecutiveStaff(es)
    }
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">معلومات شخصية</h1>

      {/* ── Basic Info ── */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">البيانات الشخصية</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الاسم الكامل</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
            <input type="email" value={session?.user?.email || ''} className="input-field bg-gray-100" disabled />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
            <input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
              className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الجهة / المنظمة</label>
            <input type="text" value={form.organization} onChange={e => setForm({ ...form, organization: e.target.value })}
              className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">المحافظة</label>
            <input type="text" value={form.governorate} onChange={e => setForm({ ...form, governorate: e.target.value })}
              className="input-field" />
          </div>
          {message && <p className="text-green-600 text-sm">{message}</p>}
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'جاري الحفظ...' : 'حفظ البيانات'}
          </button>
        </form>
      </div>

      {/* ── Org Profile ── */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">بيانات المنظمة</h2>
          {!profileLoading && profile && !profileEditing && (
            <button onClick={() => setProfileEditing(true)}
              className="text-sm px-4 py-1.5 rounded-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold">
              تعديل
            </button>
          )}
        </div>

        {profileLoading ? (
          <div className="text-center py-6 text-gray-400 text-sm">جاري التحميل...</div>
        ) : !profile ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
            <p className="font-semibold mb-1">⏳ لم يتم تعبئة بيانات المنظمة بعد</p>
            <p className="text-amber-700">سيقوم المشرف بتعبئة هذه البيانات، وبعدها يمكنك تعديلها.</p>
          </div>
        ) : (
          <>
            {profileEditing && (
              <div className="flex gap-2 mb-4">
                <button onClick={handleProfileSave} disabled={profileSaving}
                  className="btn-primary text-sm px-5 py-2 disabled:opacity-60">
                  {profileSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </button>
                <button onClick={handleProfileCancel}
                  className="text-sm px-5 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700">
                  إلغاء
                </button>
              </div>
            )}

            {profileMsg && <p className="text-green-600 text-sm mb-3">{profileMsg}</p>}
            {profileErr && <p className="text-red-600 text-sm mb-3">{profileErr}</p>}

            <div className="space-y-2">
              {SECTIONS.map(section => (
                <ProfileSection key={section.id} section={section}
                  data={profileData} editing={profileEditing} onChange={handleProfileChange} />
              ))}

              <PeopleSection
                title="أعضاء مجلس الإدارة"
                items={boardMembers} editing={profileEditing} onChange={setBoardMembers}
                itemTemplate={{ name: '', role: '', phone: '', nationalId: '' }}
                fieldDefs={[
                  { key: 'name', label: 'الاسم' },
                  { key: 'role', label: 'الصفة / المنصب' },
                  { key: 'phone', label: 'رقم الهاتف' },
                  { key: 'nationalId', label: 'الرقم القومي' },
                ]}
              />

              <PeopleSection
                title="بيانات الجهاز التنفيذي"
                items={executiveStaff} editing={profileEditing} onChange={setExecutiveStaff}
                itemTemplate={{ name: '', role: '', phone: '', qualification: '' }}
                fieldDefs={[
                  { key: 'name', label: 'الاسم' },
                  { key: 'role', label: 'الوظيفة' },
                  { key: 'phone', label: 'رقم الهاتف' },
                  { key: 'qualification', label: 'المؤهل' },
                ]}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
