'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AtSign, Check, CheckCheck } from 'lucide-react'
import {
  markAllMentionsAsRead,
  markMentionAsRead,
} from '@/lib/applications/note-actions'
import { cn } from '@/lib/utils'

export type MentionInboxRow = {
  id: string
  notifiedAt: Date | string | null
  createdAt: Date | string
  noteId: string
  noteBody: string
  authorName: string
  applicationId: string
  candidateName: string
  jobTitle: string
  tenantSlug: string
  tenantName: string
}

export interface MentionsInboxProps {
  initial: MentionInboxRow[]
}

const dateFmt = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function preview(text: string, max = 160): string {
  return text.length > max ? text.slice(0, max).trim() + '…' : text
}

/**
 * Client-rendered list of recent mentions. Initial rows come from a
 * Server Component; mark-read updates flow back via revalidatePath.
 */
export function MentionsInbox({ initial }: MentionsInboxProps) {
  const router = useRouter()
  const [rows, setRows] = React.useState<MentionInboxRow[]>(initial)
  const [pending, startTransition] = React.useTransition()

  React.useEffect(() => {
    setRows(initial)
  }, [initial])

  const unreadCount = rows.filter((r) => !r.notifiedAt).length

  function handleMarkOne(id: string) {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, notifiedAt: new Date().toISOString() } : r,
      ),
    )
    startTransition(async () => {
      const res = await markMentionAsRead(id)
      if (!res.ok) {
        // Revert.
        setRows((prev) =>
          prev.map((r) => (r.id === id ? { ...r, notifiedAt: null } : r)),
        )
      } else {
        router.refresh()
      }
    })
  }

  function handleMarkAll() {
    if (unreadCount === 0) return
    const prev = rows
    const stamp = new Date().toISOString()
    setRows((curr) =>
      curr.map((r) => (r.notifiedAt ? r : { ...r, notifiedAt: stamp })),
    )
    startTransition(async () => {
      const res = await markAllMentionsAsRead()
      if (!res.ok) {
        setRows(prev)
      } else {
        router.refresh()
      }
    })
  }

  if (rows.length === 0) {
    return (
      <div className="border-border bg-card rounded-2xl border p-10 text-center">
        <AtSign
          className="text-muted-foreground mx-auto h-8 w-8"
          aria-hidden="true"
        />
        <p className="text-foreground mt-3 text-sm font-medium">
          Belum ada mention
        </p>
        <p className="text-muted-foreground mt-1 text-xs">
          Anda akan melihatnya di sini ketika anggota tim menyebut Anda di
          catatan lamaran.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {unreadCount > 0
            ? `${unreadCount} mention belum dibaca`
            : 'Semua mention sudah dibaca'}
        </p>
        <button
          type="button"
          onClick={handleMarkAll}
          disabled={pending || unreadCount === 0}
          className="text-secondary inline-flex items-center gap-1 text-xs hover:underline disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Tandai semua dibaca
        </button>
      </div>

      <ul className="border-border bg-card divide-border divide-y rounded-2xl border">
        {rows.map((r) => {
          const isUnread = !r.notifiedAt
          const created =
            typeof r.createdAt === 'string'
              ? new Date(r.createdAt)
              : r.createdAt
          const href = `/dashboard/tenants/${r.tenantSlug}/lamaran/${r.applicationId}#note-${r.noteId}`
          return (
            <li
              key={r.id}
              className={cn(
                'flex gap-3 p-4',
                isUnread ? 'bg-muted/30' : '',
              )}
            >
              <span
                className={cn(
                  'mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                  isUnread
                    ? 'bg-secondary/15 text-secondary'
                    : 'bg-muted text-muted-foreground',
                )}
                aria-hidden="true"
              >
                <AtSign className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-sm">
                  <span className="font-medium">
                    Anda disebut oleh {r.authorName}
                  </span>
                  <span className="text-muted-foreground">
                    {' '}
                    di lamaran {r.candidateName} — {r.jobTitle}
                  </span>
                </p>
                <p className="text-muted-foreground line-clamp-2 break-words text-sm">
                  {preview(r.noteBody)}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-muted-foreground">
                    {dateFmt.format(created)}
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">{r.tenantName}</span>
                  <Link
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    href={href as any}
                    className="text-secondary ml-auto hover:underline"
                  >
                    Buka lamaran
                  </Link>
                </div>
              </div>
              {isUnread ? (
                <button
                  type="button"
                  onClick={() => handleMarkOne(r.id)}
                  disabled={pending}
                  aria-label="Tandai dibaca"
                  className="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Check className="h-4 w-4" aria-hidden="true" />
                </button>
              ) : null}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default MentionsInbox
