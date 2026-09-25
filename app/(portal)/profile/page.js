'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// ─── Section definitions ────────────────────────────────────────────────────
const SECTIONS = [
  {
    id: 'basics',
    title: 'أساسيات التعامل',
    fields: [
      { key: 'hasPermanentSign', label: 'هل توجد لافتة دائمة خاصة بالجهة مثبتة على المقر ؟', type: 'yesno', required: true },
      { key: 'hasWaitingArea', label: 'هل توفر الجهة مكان لإستقبال الحالات المستفيدة به مقاعد - مظلل - به مصدر للمياه ودورة مياه ؟', type: 'yesno', required: true },
      { key: 'hasComputerInternet', label: 'هل يوجد لدى الجهة جهاز كمبيوتر وانترنت؟', type: 'yesno', required: true },
      { key: 'hasTrainedResearcher', label: 'هل يوجد باحث اجتماعي مدرب لدراسة الحالات ميدانيا ؟', type: 'yesno', required: true },
      { key: 'usesTechnology', label: 'هل تستخدم الجهة فى الثلاث أشهر الماضية على الأقل (كمبيوتر و إنترنت و بريد إلكتروني و واتس آب و اسكانر) ؟', type: 'yesno', required: true },
      { key: 'hasCertifiedFinancialRecords', label: 'هل الدفاتر المالية للجهة مرقمة ومعتمدة من الجهة الإدارية (التضامن الإجتماعي – بنك ناصر) ؟', type: 'yesno', required: true },
      { key: 'hasBalanceSheet', label: 'وجود الميزانية العمومية والحسابات الختامية للجهة لأخر سنة مالية منتهية', type: 'yesno', required: true },
    ],
  },
  {
    id: 'registration',
    title: 'البيانات الأولية للتسجيل',
    fields: [
      { key: 'organizationType', label: 'نوع الجهة', type: 'select', required: true, options: ['جمعية أهلية', 'لجنة زكاة', 'مؤسسة', 'اتحاد', 'أخرى'] },
      { key: 'organizationName', label: 'إسم الجهة', type: 'text', required: true },
      { key: 'registrationNumberYear', label: 'رقم الاشهار / سنة الاشهار', type: 'text', required: true },
      { key: 'orgEmail', label: 'البريد الألكتروني', type: 'email', required: true },
      { key: 'orgPhone', label: 'رقم الهاتف الخاص بالجهة', type: 'text' },
      { key: 'hasWebsite', label: 'هل لدى الجهة موقع الكتروني ؟', type: 'yesno', required: true },
      { key: 'websiteUrl', label: 'اسم الموقع الالكترونى', type: 'text' },
      { key: 'hasSocialMedia', label: 'هل يوجد للجهة صفحة / حسابات على مواقع التواصل ؟', type: 'yesno', required: true },
      { key: 'socialMediaLinks', label: 'روابط مواقع التواصل', type: 'text' },
    ],
  },
  {
    id: 'geo',
    title: 'البيانات الخاصة بالموقع الجغرافي',
    fields: [
      { key: 'governorate', label: 'محافظة', type: 'text', required: true },
      { key: 'district', label: 'المركز / الحي', type: 'text', required: true },
      { key: 'localUnit', label: 'قسم \\ وحدة محلية', type: 'text', required: true },
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
      { key: 'hqAddress', label: 'عنوان المقر الحالي بالتفصيل', type: 'textarea', required: true },
      { key: 'hqType', label: 'نوع المقر', type: 'select', required: true, options: ['مملوك', 'مستأجر', 'مجاني', 'أخرى'] },
      { key: 'hqContractType', label: 'نوع عقد المقر ( سند شغل )', type: 'text', required: true },
      { key: 'hqFinishingLevel', label: 'مستوى تشطيب المقر', type: 'select', required: true, options: ['خام', 'عادي', 'جيد', 'ممتاز'] },
      { key: 'hqArea', label: 'مساحة مقر الرئيسي (م²)', type: 'text', required: true },
      { key: 'hqFloor', label: 'رقم الطابق', type: 'text', required: true },
      { key: 'hqRooms', label: 'عدد الغرف', type: 'text', required: true },
      { key: 'hqDeepFreezers', label: 'عدد الديب فريزر', type: 'text', required: true },
      { key: 'hqFreezerCapacity', label: 'السعة التخزينية للديب فريزر', type: 'text', required: true },
      { key: 'hasTrainingHalls', label: 'وجود قاعات تدريبات (مجهزة ومخصصة)', type: 'yesno', required: true },
      { key: 'hqHasComputer', label: 'هل يوجد جهاز كمبيوتر وإنترنت؟', type: 'yesno', required: true },
      { key: 'internetWorkers', label: 'عدد الاشخاص العاملين على الإنترنت', type: 'text' },
      { key: 'researchersCount', label: 'عدد الباحثين لدي الجهة', type: 'text' },
      { key: 'officeFurniture', label: 'الأثاث والتجهيزات المكتبية', type: 'textarea', required: true },
      { key: 'internalLayoutDesc', label: 'وصف التقسيم الداخلي للمقر', type: 'textarea', required: true },
      { key: 'roomUsage', label: 'استخدامات الغرف بالمقر', type: 'textarea', required: true },
      { key: 'availableFacilities', label: 'المرافق المتوفرة داخل المقر', type: 'textarea', required: true },
      { key: 'allowsEvents', label: 'هل يسمح المقر باقامة فعاليات ومناسبات عامة', type: 'yesno', required: true },
      { key: 'hasBranch', label: 'هل يوجد مقر فرعي', type: 'yesno' },
    ],
  },
  {
    id: 'storage',
    title: 'البيانات الخاصة بالمخزن',
    fields: [
      { key: 'hasStorage', label: 'هل يوجد مخزن؟', type: 'yesno', required: true },
      { key: 'storageLocation', label: 'مكان المخزن', type: 'text', required: true },
      { key: 'storageArea', label: 'مساحة المخزن (م²)', type: 'text' },
      { key: 'storageEquipment', label: 'تجهيزات المخزن', type: 'textarea', required: true },
      { key: 'storageFloor', label: 'رقم الطابق للمخزن', type: 'text', required: true },
      { key: 'hasAdditionalStorage', label: 'هل توجد مخازن تابعة للجهة تسمح بتخزين مساعدات قوافل أو مناسبات', type: 'yesno', required: true },
      { key: 'additionalStorageArea', label: 'مساحة المخازن الإضافية (م²)', type: 'text', required: true },
      { key: 'hasCoolingRoom', label: 'هل توجد غرفة تبريد يمكن استخدامها في المواسم والمناسبات', type: 'yesno', required: true },
    ],
  },
  {
    id: 'kitchen',
    title: 'البيانات الخاصة بالمطبخ',
    fields: [
      { key: 'hasKitchen', label: 'هل يوجد مطبخ خاص بتجهيز الوجبات (نشاط الوجبات الساخنة) ؟', type: 'yesno', required: true },
      { key: 'kitchenLocation', label: 'مكان المطبخ', type: 'text', required: true },
      { key: 'dailyMeals', label: 'عدد الوجبات الغداء يوميا', type: 'text', required: true },
      { key: 'kitchenArea', label: 'مساحة المطبخ (م²)', type: 'text', required: true },
      { key: 'kitchenFloor', label: 'رقم الطابق للمطبخ', type: 'text', required: true },
      { key: 'kitchenEquipment', label: 'تجهيزات مطبخ الجهة', type: 'textarea', required: true },
    ],
  },
  {
    id: 'database',
    title: 'البيانات الخاصة بقواعد البيانات',
    fields: [
      { key: 'hasDatabase', label: 'هل لدى الجهة قاعدة بيانات عن فئات الحالات المستفيدة مقسمة حسب برامج / مشاريع الجهة ؟', type: 'yesno', required: true },
      { key: 'researchType', label: 'نوع الأبحاث', type: 'select', required: true, options: ['إلكترونية', 'ورقية', 'كلاهما'] },
      { key: 'familiesWithDatabases', label: 'عدد الأسر التي لها قواعد بيانات / أبحاث اجتماعية', type: 'text' },
      { key: 'appropriateSupport', label: 'دعم بنك الطعام المناسب للجهة', type: 'textarea', required: true },
      { key: 'monthlyFamilies', label: 'عدد الأسر التي لها قواعد بيانات وترغب الجهة بدعمها شهرياً من بنك الطعام', type: 'text' },
      { key: 'seasonalFamilies', label: 'عدد الأسر المرشحة للدعم الموسمي من بنك الطعام (حد أقصى)', type: 'text' },
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
      { key: 'researcherEmail', label: 'البريد الإلكتروني للباحث', type: 'email' },
      { key: 'researcherQualification', label: 'المؤهل العلمي للباحث', type: 'text' },
    ],
  },
];

// ─── Field Components ────────────────────────────────────────────────────────
function YesNoField({ field, value, editing, onChange }) {
  if (!editing) {
    return (
      <div className="field-row">
        <span className="field-label">{field.label}{field.required && ' *'}</span>
        <span className={`field-value badge ${value === 'نعم' ? 'badge-yes' : value === 'لا' ? 'badge-no' : 'badge-empty'}`}>
          {value || '—'}
        </span>
      </div>
    );
  }
  return (
    <div className="field-row">
      <label className="field-label">{field.label}{field.required && ' *'}</label>
      <div className="radio-group">
        {['نعم', 'لا'].map((opt) => (
          <label key={opt} className="radio-label">
            <input
              type="radio"
              name={field.key}
              value={opt}
              checked={value === opt}
              onChange={() => onChange(field.key, opt)}
            />
            <span>{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function TextField({ field, value, editing, onChange }) {
  if (!editing) {
    return (
      <div className="field-row">
        <span className="field-label">{field.label}{field.required && ' *'}</span>
        <span className="field-value">{value || '—'}</span>
      </div>
    );
  }
  const Tag = field.type === 'textarea' ? 'textarea' : 'input';
  return (
    <div className="field-row field-row--vertical">
      <label className="field-label">{field.label}{field.required && ' *'}</label>
      <Tag
        type={field.type === 'textarea' ? undefined : field.type || 'text'}
        value={value || ''}
        onChange={(e) => onChange(field.key, e.target.value)}
        rows={field.type === 'textarea' ? 3 : undefined}
        className="field-input"
        placeholder={field.label}
      />
    </div>
  );
}

function SelectField({ field, value, editing, onChange }) {
  if (!editing) {
    return (
      <div className="field-row">
        <span className="field-label">{field.label}{field.required && ' *'}</span>
        <span className="field-value">{value || '—'}</span>
      </div>
    );
  }
  return (
    <div className="field-row field-row--vertical">
      <label className="field-label">{field.label}{field.required && ' *'}</label>
      <select
        value={value || ''}
        onChange={(e) => onChange(field.key, e.target.value)}
        className="field-input"
      >
        <option value="">-- اختر --</option>
        {field.options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

function FieldRenderer({ field, value, editing, onChange }) {
  if (field.type === 'yesno') return <YesNoField field={field} value={value} editing={editing} onChange={onChange} />;
  if (field.type === 'select') return <SelectField field={field} value={value} editing={editing} onChange={onChange} />;
  return <TextField field={field} value={value} editing={editing} onChange={onChange} />;
}

// ─── Accordion Section ────────────────────────────────────────────────────────
function Section({ section, data, editing, onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="section-card">
      <button className="section-header" onClick={() => setOpen(!open)} type="button">
        <span>{section.title}</span>
        <span className={`chevron ${open ? 'open' : ''}`}>▼</span>
      </button>
      {open && (
        <div className="section-body">
          {section.fields.map((field) => (
            <FieldRenderer
              key={field.key}
              field={field}
              value={data[field.key] || ''}
              editing={editing}
              onChange={onChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Board Members & Executive Staff tables ───────────────────────────────────
function PeopleSection({ title, items, editing, onChange, itemTemplate, fieldDefs }) {
  const [open, setOpen] = useState(false);
  const addItem = () => onChange([...items, { ...itemTemplate }]);
  const updateItem = (i, key, val) => {
    const updated = items.map((item, idx) => idx === i ? { ...item, [key]: val } : item);
    onChange(updated);
  };
  const removeItem = (i) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <div className="section-card">
      <button className="section-header" onClick={() => setOpen(!open)} type="button">
        <span>{title}</span>
        <span className={`chevron ${open ? 'open' : ''}`}>▼</span>
      </button>
      {open && (
        <div className="section-body">
          {items.length === 0 && !editing && <p className="empty-msg">لا توجد بيانات مضافة</p>}
          {items.map((item, i) => (
            <div key={i} className="person-card">
              <div className="person-header">
                <strong>{item.name || `العنصر ${i + 1}`}</strong>
                {editing && (
                  <button type="button" className="btn-remove" onClick={() => removeItem(i)}>✕</button>
                )}
              </div>
              {fieldDefs.map((fd) => (
                editing ? (
                  <div key={fd.key} className="field-row field-row--vertical">
                    <label className="field-label">{fd.label}</label>
                    <input
                      type="text"
                      value={item[fd.key] || ''}
                      onChange={(e) => updateItem(i, fd.key, e.target.value)}
                      className="field-input"
                      placeholder={fd.label}
                    />
                  </div>
                ) : (
                  <div key={fd.key} className="field-row">
                    <span className="field-label">{fd.label}</span>
                    <span className="field-value">{item[fd.key] || '—'}</span>
                  </div>
                )
              ))}
            </div>
          ))}
          {editing && (
            <button type="button" className="btn-add" onClick={addItem}>
              + إضافة
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState({});
  const [boardMembers, setBoardMembers] = useState([]);
  const [executiveStaff, setExecutiveStaff] = useState([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then(({ profile: p }) => {
        if (p) {
          const { boardMembers: bm = [], executiveStaff: es = [], ...rest } = p;
          setProfile(rest);
          setBoardMembers(bm);
          setExecutiveStaff(es);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (key, val) => setProfile((prev) => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...profile, boardMembers, executiveStaff }),
      });
      if (!res.ok) throw new Error('فشل الحفظ');
      setSuccess(true);
      setEditing(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      setError(e.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setError('');
    // re-fetch to reset unsaved changes
    fetch('/api/profile')
      .then((r) => r.json())
      .then(({ profile: p }) => {
        if (p) {
          const { boardMembers: bm = [], executiveStaff: es = [], ...rest } = p;
          setProfile(rest);
          setBoardMembers(bm);
          setExecutiveStaff(es);
        }
      });
  };

  if (status === 'loading' || loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #f4f6f8; }

        .page { direction: rtl; min-height: 100vh; background: #f4f6f8; }

        /* Top bar */
        .topbar {
          background: #0369a1;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 16px;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .topbar-title { font-size: 15px; font-weight: 600; }
        .topbar-logout {
          background: none; border: none; color: #fff;
          cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 6px;
        }

        /* Profile header card */
        .profile-header {
          background: #fff;
          margin: 16px;
          border-radius: 10px;
          padding: 16px;
          box-shadow: 0 1px 4px rgba(0,0,0,.08);
          text-align: center;
        }
        .profile-org-name { font-size: 18px; font-weight: 700; color: #0369a1; margin-bottom: 4px; }
        .profile-reg { font-size: 13px; color: #555; margin-bottom: 12px; }
        .btn-edit {
          background: #c8a84b; color: #fff; border: none; border-radius: 20px;
          padding: 6px 24px; font-size: 13px; cursor: pointer; font-weight: 600;
        }
        .btn-edit:hover { background: #b8943b; }

        /* Action bar (edit mode) */
        .action-bar {
          display: flex; gap: 8px; justify-content: center;
          margin: 0 16px 8px;
        }
        .btn-save {
          background: #0369a1; color: #fff; border: none; border-radius: 20px;
          padding: 8px 28px; font-size: 13px; cursor: pointer; font-weight: 600;
        }
        .btn-save:disabled { opacity: .6; cursor: not-allowed; }
        .btn-cancel {
          background: #e0e0e0; color: #333; border: none; border-radius: 20px;
          padding: 8px 28px; font-size: 13px; cursor: pointer; font-weight: 600;
        }

        /* Alerts */
        .alert { margin: 0 16px 8px; padding: 10px 14px; border-radius: 8px; font-size: 13px; }
        .alert-error { background: #fff0f0; color: #c0392b; border: 1px solid #f5c6cb; }
        .alert-success { background: #f0fff4; color: #1a5c38; border: 1px solid #c3e6cb; }

        /* Sections */
        .sections { padding: 0 16px 24px; display: flex; flex-direction: column; gap: 8px; }

        .section-card {
          background: #fff; border-radius: 10px;
          box-shadow: 0 1px 3px rgba(0,0,0,.07); overflow: hidden;
        }
        .section-header {
          width: 100%; background: none; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 16px; font-size: 14px; font-weight: 600; color: #0369a1;
          text-align: right;
        }
        .section-header:hover { background: #f9f9f9; }
        .chevron { font-size: 11px; transition: transform .2s; color: #888; }
        .chevron.open { transform: rotate(180deg); }
        .section-body { padding: 8px 16px 16px; border-top: 1px solid #eee; }

        /* Fields */
        .field-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 8px 0; border-bottom: 1px solid #f0f0f0; gap: 8px;
        }
        .field-row:last-child { border-bottom: none; }
        .field-row--vertical { flex-direction: column; align-items: flex-start; }
        .field-label { font-size: 13px; color: #444; flex: 1; line-height: 1.4; }
        .field-value { font-size: 13px; color: #222; font-weight: 500; text-align: left; }
        .field-input {
          width: 100%; padding: 7px 10px; border: 1px solid #ddd; border-radius: 6px;
          font-size: 13px; margin-top: 4px; font-family: inherit;
          direction: rtl; text-align: right;
        }
        .field-input:focus { outline: none; border-color: #0369a1; }
        textarea.field-input { resize: vertical; }

        /* Badges */
        .badge {
          display: inline-block; padding: 2px 12px; border-radius: 12px;
          font-size: 12px; font-weight: 600; white-space: nowrap;
        }
        .badge-yes { background: #d4edda; color: #155724; }
        .badge-no { background: #f8d7da; color: #721c24; }
        .badge-empty { background: #e9ecef; color: #6c757d; }

        /* Radio */
        .radio-group { display: flex; gap: 16px; }
        .radio-label {
          display: flex; align-items: center; gap: 5px;
          font-size: 13px; cursor: pointer; color: #333;
        }
        .radio-label input { accent-color: #0369a1; cursor: pointer; }

        /* Person cards */
        .person-card {
          border: 1px solid #e0e0e0; border-radius: 8px;
          padding: 10px 12px; margin-bottom: 10px; background: #fafafa;
        }
        .person-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 8px;
        }
        .person-header strong { font-size: 14px; color: #0369a1; }
        .btn-remove {
          background: #f8d7da; color: #721c24; border: none; border-radius: 50%;
          width: 22px; height: 22px; cursor: pointer; font-size: 12px;
          display: flex; align-items: center; justify-content: center;
        }
        .btn-add {
          background: #0369a1; color: #fff; border: none; border-radius: 6px;
          padding: 7px 16px; font-size: 13px; cursor: pointer; margin-top: 8px;
          width: 100%;
        }

        /* Empty / loading */
        .empty-msg { color: #888; font-size: 13px; text-align: center; padding: 12px 0; }
        .page-loading {
          display: flex; align-items: center; justify-content: center; height: 100vh;
        }
        .spinner {
          width: 36px; height: 36px; border: 3px solid #e0e0e0;
          border-top-color: #0369a1; border-radius: 50%;
          animation: spin .7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="page">
        {/* Top bar */}
        <div className="topbar">
          <span className="topbar-title">بيانات الملف الشخصي</span>
          <button className="topbar-logout" onClick={() => router.push('/dashboard')}>
            ← الرئيسية
          </button>
        </div>

        {/* Profile header */}
        <div className="profile-header">
          <div className="profile-org-name">
            {profile.organizationName || session?.user?.name || 'رسالة نور للتنمية'}
          </div>
          <div className="profile-reg">
            {profile.registrationNumberYear
              ? `رقم الاشهار / سنة الاشهار : ${profile.registrationNumberYear}`
              : 'لم يتم تعبئة بيانات الملف بعد'}
          </div>
          {!editing && (
            <button className="btn-edit" onClick={() => setEditing(true)}>
              تعديل
            </button>
          )}
        </div>

        {/* Action bar (edit mode) */}
        {editing && (
          <div className="action-bar">
            <button className="btn-save" onClick={handleSave} disabled={saving}>
              {saving ? 'جاري الحفظ...' : 'حفظ'}
            </button>
            <button className="btn-cancel" onClick={handleCancel}>إلغاء</button>
          </div>
        )}

        {/* Alerts */}
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">تم حفظ البيانات بنجاح ✓</div>}

        {/* Sections */}
        <div className="sections">
          {SECTIONS.map((section) => (
            <Section
              key={section.id}
              section={section}
              data={profile}
              editing={editing}
              onChange={handleChange}
            />
          ))}

          {/* Board members */}
          <PeopleSection
            title="أعضاء مجلس الإدارة"
            items={boardMembers}
            editing={editing}
            onChange={setBoardMembers}
            itemTemplate={{ name: '', role: '', phone: '', nationalId: '' }}
            fieldDefs={[
              { key: 'name', label: 'الاسم' },
              { key: 'role', label: 'الصفة / المنصب' },
              { key: 'phone', label: 'رقم الهاتف' },
              { key: 'nationalId', label: 'الرقم القومي' },
            ]}
          />

          {/* Executive staff */}
          <PeopleSection
            title="بيانات الجهاز التنفيذي الخاص بالجهة"
            items={executiveStaff}
            editing={editing}
            onChange={setExecutiveStaff}
            itemTemplate={{ name: '', role: '', phone: '', qualification: '' }}
            fieldDefs={[
              { key: 'name', label: 'الاسم' },
              { key: 'role', label: 'الوظيفة' },
              { key: 'phone', label: 'رقم الهاتف' },
              { key: 'qualification', label: 'المؤهل' },
            ]}
          />
        </div>
      </div>
    </>
  );
}
