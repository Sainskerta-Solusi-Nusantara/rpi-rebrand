import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, MessageSquare } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { getThreadForApplication } from '@/lib/messaging/queries'
import { MessageThread } from '@/components/organisms/message-thread'

export const metadata = { title: 'Pesan Lamaran' }

export default async function CandidateMessagesPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await requireAuth(`/dashboard/lamaran/${params.id}/pesan`)
  const viewerId = session.user.id

  const application = await prisma.application
    .findUnique({
      where: { id: params.id },
      select: {
        id: true,
        userId: true,
        tenant: { select: { id: true, slug: true, name: true } },
        job: { select: { id: true, title: true } },
      },
    })
    .catch(() => null)
  if (!application) notFound()
  if (application.userId !== viewerId) notFound()

  const thread = await getThreadForApplication(application.id, viewerId)
  const initialMessages = thread?.messages ?? []

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={`/dashboard/lamaran` as any}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke lamaran saya
        </Link>
      </div>

      <header className="border-border bg-card rounded-2xl border p-6">
        <h1 className="font-heading flex items-center gap-2 text-xl">
          <MessageSquare className="h-5 w-5" aria-hidden="true" />
          Pesan dengan {application.tenant.name}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Lowongan: {application.job.title}
        </p>
      </header>

      <MessageThread
        applicationId={application.id}
        initialMessages={initialMessages}
        currentUserId={viewerId}
        role="candidate"
      />
    </div>
  )
}
