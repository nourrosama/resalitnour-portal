'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

// Wraps every page inside /admin/users/[id]/... with a banner
// so the admin always knows whose data they are managing.
export default function UserWorkspaceLayout({ children }) {
  const { id: userId } = useParams()
  const [user, setUser] = useState(null)

  useEffect(() => {
    if (!userId) return
    fetch(`/api/admin/users/${userId}`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => setUser(data?.user || null))
      .catch(() => {})
  }, [userId])

  return (
    <div>
      <div className="sticky top-0 z-20 bg-amber-50 border-b-2 border-amber-300 px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center font-bold shrink-0">
            {user?.name?.[0] || '…'}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-amber-700">أنت تدير الآن حساب:</p>
            <p className="font-bold text-gray-900 truncate">
              {user ? user.name : 'جاري التحميل...'}
              {user?.organization && <span className="font-normal text-gray-600"> — {user.organization}</span>}
              {user?.governorate && <span className="font-normal text-gray-500 text-sm"> ({user.governorate})</span>}
            </p>
          </div>
          {user?.isActive === false && <span className="badge badge-rejected">معطل</span>}
        </div>
        <Link
          href="/admin/dashboard"
          className="text-sm font-medium text-amber-900 bg-white border border-amber-300 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-colors"
        >
          → الرجوع لقائمة المستخدمين
        </Link>
      </div>
      {children}
    </div>
  )
}
