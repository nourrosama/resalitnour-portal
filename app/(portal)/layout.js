import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '../../lib/auth'
import Sidebar from '../../components/shared/Sidebar'

export default async function PortalLayout({ children }) {
  const session = await getServerSession(authOptions)

  if (!session) redirect('/login')
  if (session.user.mustChangePassword) redirect('/change-password')
  if (session.user.role === 'admin') redirect('/admin/dashboard')

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isAdmin={false} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
