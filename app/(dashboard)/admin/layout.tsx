import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { redirect } from 'next/navigation'

const ADMIN_ROLES = new Set(['SUPERADMIN', 'ADMIN'])

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect('/login?callbackUrl=/admin')
  }
  if (!ADMIN_ROLES.has(session.user.globalRole)) {
    redirect('/dashboard')
  }
  return <>{children}</>
}
