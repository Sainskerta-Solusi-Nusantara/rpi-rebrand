import { getServerSession } from 'next-auth'
import { headers } from 'next/headers'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/db'
import { getServerT } from '@/lib/i18n/server-dictionary'
import { JobForm } from '@/components/organisms/job-form'

export const metadata = { title: 'Buat Lowongan Baru' }

async function resolveTenantSlug(userId: string): Promise<string | null> {
  const hSlug = headers().get('x-tenant-slug')
  if (hSlug) return hSlug
  const ut = await prisma.userTenant
    .findFirst({
      where: { userId },
      select: { tenant: { select: { slug: true } } },
    })
    .catch(() => null)
  return ut?.tenant?.slug ?? null
}

export default async function NewJobPage() {
  const t = await getServerT()
  const session = await getServerSession(authOptions)
  const slug = session?.user ? await resolveTenantSlug(session.user.id) : null
  const categories = await prisma.jobCategory
    .findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } })
    .catch(() => [])

  return (
    <div className="p-6 max-w-4xl">
      <header className="mb-6">
        <h1 className="font-heading text-2xl md:text-3xl">{t.partner.newJob.title}</h1>
        <p className="text-muted-foreground mt-1">{t.partner.newJob.subtitle}</p>
      </header>

      {slug ? (
        <JobForm tenantSlug={slug} categories={categories} />
      ) : (
        <p className="text-muted-foreground">{t.partner.newJob.noTenant}</p>
      )}
    </div>
  )
}
