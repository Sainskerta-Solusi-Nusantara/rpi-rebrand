import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, MessageSquare } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'
import { prisma } from '@/lib/db'
import { getThreadForApplication } from '@/lib/messaging/queries'
import { MessageThread } from '@/components/organisms/message-thread'

export const metadata = { title: 'Pesan Lamaran — Dasbor' }

export default async function RecruiterMessagesPage({
  params,
}: {
  params: { slug: string; id: string }
}) {
  const session = await requireAuth(
    `/dashboard/tenants/${params.slug}/lamaran/${params.id}/pesan`,
  )

  const tenant = await prisma.tenant
    .findUnique({
      where: { slug: params.slug },
      select: { id: true, slug: true, name: true },
    })
    .catch(() => null)
  if (!tenant) notFound()

  const { globalRole, tenants, id: viewerId } = session.user
  if (!hasTenantPermission(globalRole, tenants, tenant.id, 'job.view')) {
    notFound()
  }

  const application = await prisma.application
    .findFirst({
      where: { id: params.id, tenantId: tenant.id },
      select: {
        id: true,
        user: { select: { id: true, name: true, email: true, image: true } },
        job: { select: { id: true, title: true } },
      },
    })
    .catch(() => null)
  if (!application) notFound()

  const thread = await getThreadForApplication(application.id, viewerId)
  const initialMessages = thread?.messages ?? []
  const candidateName = application.user.name ?? application.user.email

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={`/dashboard/tenants/${tenant.slug}/lamaran/${application.id}` as any}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke detail lamaran
        </Link>
      </div>

      <header className="border-border bg-card flex flex-col gap-2 rounded-2xl border p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {application.user.image ? (
            <Image
              src={application.user.image}
              alt=""
              className="size-12 rounded-full object-cover"
              width={48}
              height={48}
              unoptimized
            />
          ) : (
            <div className="bg-muted size-12 rounded-full" />
          )}
          <div>
            <h1 className="font-heading flex items-center gap-2 text-xl">
              <MessageSquare className="h-5 w-5" aria-hidden="true" />
              Pesan dengan {candidateName}
            </h1>
            <p className="text-muted-foreground text-sm">
              Lowongan: {application.job.title}
            </p>
          </div>
        </div>
      </header>

      <MessageThread
        applicationId={application.id}
        initialMessages={initialMessages}
        currentUserId={viewerId}
        role="recruiter"
      />
    </div>
  )
}
