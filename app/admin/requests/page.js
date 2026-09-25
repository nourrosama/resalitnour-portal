import { redirect } from 'next/navigation'

// Cases/requests/messages/deliveries are now managed per user:
// /admin/users/[id]/...  — pick a user from the admin home first.
export default function Page() {
  redirect('/admin/dashboard')
}
