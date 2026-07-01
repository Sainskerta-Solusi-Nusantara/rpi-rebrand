import Link from 'next/link'
import { MessageSquare, ChevronRight } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { countUnreadMessages } from '@/lib/messaging/queries'

export const metadata = { title: 'Pesan — Dasbor' }

const dateFmt = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function preview(body: string, max = 90): string {
  const oneLine = body.replace(/\s+/g, ' ').trim()
  return oneLine.length > max ? `${oneLine.slice(0, max)}…` : oneLine
}

export default async function MessagesInboxPage() {
  const session = await requireAuth('/dashboard/messages')
  const viewerId = session.user.id

  const [threads, totalUnread] = await Promise.all([
    prisma.messageThread
      .findMany({
        where: { application: { userId: viewerId } },
        orderBy: { lastMessageAt: 'desc' },
        take: 50,
        select: {
          id: true,
          applicationId: true,
          lastMessageAt: true,
          application: {
            select: {
              id: true,
              job: { select: { title: true } },
              tenant: { select: { name: true } },
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              body: true,
              senderId: true,
              createdAt: true,
              readByCandidateAt: true,
            },
          },
        },
      })
      .catch(() => []),
    countUnreadMessages(viewerId, 'candidate'),
  ])

  const withMessages = threads.filter((t) => t.messages.length > 0)

  return (
    <div className="p-6 space-y-8 max-w-3xl">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl">Pesan</h1>
          <p className="text-muted-foreground mt-1">
            Percakapan Anda dengan perekrut dari lamaran yang dikirim.
          </p>
        </div>
        {totalUnread > 0 && (
          <span className="bg-primary text-primary-foreground inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-sm font-medium">
            {totalUnread}
          </span>
        )}
      </header>

      {withMessages.length === 0 ? (
        <div className="border-border bg-card rounded-2xl border p-10 text-center">
          <span className="bg-muted text-muted-foreground mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl">
            <MessageSquare className="h-6 w-6" aria-hidden="true" />
          </span>
          <h2 className="font-heading mt-4 text-lg">Belum ada pesan</h2>
          <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-sm">
            Saat perekrut memulai percakapan tentang lamaran Anda, pesannya akan
            muncul di sini.
          </p>
          <Link
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            href={'/dashboard/lamaran' as any}
            className="text-primary mt-4 inline-flex items-center gap-1 text-sm font-medium hover:underline"
          >
            Lihat lamaran saya
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      ) : (
        <ul className="border-border divide-border bg-card divide-y overflow-hidden rounded-2xl border">
          {withMessages.map((thread) => {
            const last = thread.messages[0]!
            const unread =
              last.senderId !== viewerId && last.readByCandidateAt === null
            return (
              <li key={thread.id}>
                <Link
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  href={`/dashboard/lamaran/${thread.applicationId}/pesan` as any}
                  className="hover:bg-accent/40 flex items-start gap-4 p-4 transition-colors"
                >
                  <span
                    className={
                      unread
                        ? 'bg-primary/10 text-primary mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl'
                        : 'bg-muted text-muted-foreground mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl'
                    }
                  >
                    <MessageSquare className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span
                        className={
                          unread ? 'truncate font-semibold' : 'truncate font-medium'
                        }
                      >
                        {thread.application.tenant.name}
                      </span>
                      {thread.lastMessageAt && (
                        <span className="text-muted-foreground shrink-0 text-xs">
                          {dateFmt.format(thread.lastMessageAt)}
                        </span>
                      )}
                    </span>
                    <span className="text-muted-foreground block truncate text-xs">
                      {thread.application.job.title}
                    </span>
                    <span
                      className={
                        unread
                          ? 'text-foreground mt-1 block truncate text-sm'
                          : 'text-muted-foreground mt-1 block truncate text-sm'
                      }
                    >
                      {last.senderId === viewerId ? 'Anda: ' : ''}
                      {preview(last.body)}
                    </span>
                  </span>
                  {unread && (
                    <span className="bg-primary mt-2 inline-block h-2.5 w-2.5 shrink-0 rounded-full" aria-label="Belum dibaca" />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
