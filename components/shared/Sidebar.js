'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'

function NavItem({ href, icon, label, children }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(pathname.startsWith(href) && href !== '/')
  const isActive = pathname === href || (children && pathname.startsWith(href))

  if (children) {
    return (
      <li>
        <button
          onClick={() => setOpen(!open)}
          className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            isActive ? 'bg-primary-700 text-white' : 'text-gray-200 hover:bg-primary-700/50'
          }`}
        >
          <span className="flex items-center gap-3">
            {icon}
            {label}
          </span>
          <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {open && (
          <ul className="mt-1 mr-4 space-y-1 border-r border-primary-600 pr-3">
            {children}
          </ul>
        )}
      </li>
    )
  }

  return (
    <li>
      <Link
        href={href}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          pathname === href ? 'bg-primary-700 text-white' : 'text-gray-200 hover:bg-primary-700/50'
        }`}
      >
        {icon}
        {label}
      </Link>
    </li>
  )
}

function SubNavItem({ href, label }) {
  const pathname = usePathname()
  return (
    <li>
      <Link
        href={href}
        className={`block py-2 px-3 rounded-lg text-sm transition-colors ${
          pathname === href ? 'bg-primary-600 text-white' : 'text-gray-300 hover:text-white hover:bg-primary-700/40'
        }`}
      >
        {label}
      </Link>
    </li>
  )
}

export default function Sidebar({ isAdmin = false }) {
  const { data: session } = useSession()
  const pathname = usePathname()

  // Admin inside a specific user's workspace: /admin/users/<id>/...
  const wsMatch = isAdmin ? pathname.match(/^\/admin\/users\/([^/]+)/) : null
  const wsUserId = wsMatch ? wsMatch[1] : null
  const ws = wsUserId ? `/admin/users/${wsUserId}` : null

  const userNavItems = (
    <>
      <NavItem href="/dashboard" label="الصفحة الرئيسية" icon={
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      } />
      <NavItem href="/personal-info" label="معلومات شخصية" icon={
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      } />
      <NavItem href="/cases" label="الحالات" icon={
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      }>
        <SubNavItem href="/cases/new" label="طلب حالة جديدة" />
        <SubNavItem href="/cases/monthly" label="الحالات الشهرية" />
        <SubNavItem href="/cases/seasonal" label="الحالات الموسمية" />
      </NavItem>
      <NavItem href="/requests" label="الطلبات" icon={
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      }>
        <SubNavItem href="/requests/transfer" label="طلبات نقل الحالات" />
        <SubNavItem href="/requests/messages" label="إرسال رسائل للحالات" />
        <SubNavItem href="/requests/targeting" label="طلبات الاستهداف" />
        <SubNavItem href="/requests/disposal" label="طلبات الإتلاف" />
      </NavItem>
      <NavItem href="/deliveries" label="التسليمات" icon={
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      }>
        <SubNavItem href="/deliveries/open" label="طلبات التسليم المفتوحة" />
        <SubNavItem href="/deliveries/closed" label="طلبات التسليم المغلقة" />
        <SubNavItem href="/deliveries/deliver" label="تسليم المستفيد" />
      </NavItem>
    </>
  )

  const adminNavItems = (
    <>
      <NavItem href={'/admin/dashboard'} label="المستخدمون" icon={
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      } />
      <NavItem href={'/admin/users'} label="إدارة الحسابات" icon={
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      } />
    </>
  )

  const workspaceNavItems = ws && (
    <>
      <NavItem href={`${ws}`} label="لوحة التحكم" icon={
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      } />
      <NavItem href={`${ws}/profile`} label="ملف المنظمة" icon={
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      } />
      <NavItem href={`${ws}/cases`} label="الحالات" icon={
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      } />
      <NavItem href={`${ws}/requests`} label="الطلبات" icon={
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      } />
      <NavItem href={`${ws}/messages`} label="الرسائل" icon={
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      } />
      <NavItem href={`${ws}/deliveries`} label="التسليمات" icon={
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      } />
    </>
  )

  return (
    <div className="w-64 min-h-screen bg-primary-900 flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b border-primary-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">رسالة نور للتنمية</p>
            <p className="text-primary-300 text-xs">{isAdmin ? 'لوحة الإدارة' : 'بوابة المستخدم'}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4">
        {ws ? (
          <>
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-2 px-4 py-2 mb-3 rounded-lg text-sm text-primary-200 hover:text-white hover:bg-primary-700/50 transition-colors"
            >
              <span>→</span> كل المستخدمين
            </Link>
            <p className="px-4 mb-2 text-xs text-primary-300">إدارة المستخدم</p>
            <ul className="space-y-1">{workspaceNavItems}</ul>
          </>
        ) : (
          <ul className="space-y-1">
            {isAdmin ? adminNavItems : userNavItems}
          </ul>
        )}
      </nav>

      {/* User info + logout */}
      <div className="p-4 border-t border-primary-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {session?.user?.name?.[0] || 'م'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{session?.user?.name}</p>
            <p className="text-primary-300 text-xs truncate">{session?.user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-primary-300 hover:text-white hover:bg-primary-700/50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          تسجيل الخروج
        </button>
      </div>
    </div>
  )
}
