import Link from 'next/link'
import { Bell, Check, ExternalLink, Inbox, Trash2 } from 'lucide-react'
import type { NotificationType } from '@prisma/client'
import { requireAuth } from '@/lib/auth/session'
import { listNotifications } from '@/lib/notifications/queries'
import {
  deleteNotification,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/notifications/actions'

export const metadata = { title: 'Feed Notifikasi — Dasbor' }

const PAGE_SIZE = 20

const dateFmt = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'short',
  timeStyle: 'short',
})

const TYPE_LABEL: Record<NotificationType, string> = {
  APPLICATION_UPDATE: 'Lamaran',
  JOB_RECOMMEND: 'Lowongan',
  COURSE_UPDATE: 'Kursus',
  SYSTEM: 'Sistem',
}

function buildHref(
  base: string,
  searchParams: Record<string, string | undefined>,
  overrides: Record<string, string | undefined>,
): string {
  const merged = { ...searchParams, ...overrides }
  const usp = new URLSearchParams()
  for (const [k, v] of Object.entries(merged)) {
    if (v) usp.set(k, v)
  }
  const qs = usp.toString()
  return qs ? `${base}?${qs}` : base
}

// Bound server actions for forms (action signature: (formData: FormData) => void).
async function markOneAction(formData: FormData): Promise<void> {
  'use server'
  const id = formData.get('id')
  if (typeof id === 'string') await markNotificationRead(id)
}

async function deleteOneAction(formData: FormData): Promise<void> {
  'use server'
  const id = formData.get('id')
  if (typeof id === 'string') await deleteNotification(id)
}

async function markAllAction(): Promise<void> {
  'use server'
  await markAllNotificationsRead()
}

export default async function NotifikasiFeedPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const session = await requireAuth('/dashboard/notifikasi/feed')

  const filterRaw = typeof searchParams.filter === 'string' ? searchParams.filter : undefined
  const filter: 'unread' | 'all' = filterRaw === 'unread' ? 'unread' : 'all'

  const pageRaw = typeof searchParams.page === 'string' ? Number(searchParams.page) : 1
  const page = Math.max(1, Number.isFinite(pageRaw) ? pageRaw : 1)

  const { items, total, unreadTotal } = await listNotifications(session.user.id, {
    page,
    pageSize: PAGE_SIZE,
    filter,
  })

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const sp: Record<string, string | undefined> = {
    filter: filter === 'unread' ? 'unread' : undefined,
    page: page > 1 ? String(page) : undefined,
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="h-6 w-6" aria-hidden="true" />
            <h1 className="font-heading text-2xl md:text-3xl">Feed Notifikasi</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            {unreadTotal.toLocaleString('id-ID')} belum dibaca dari{' '}
            {total.toLocaleString('id-ID')} total
            {filter === 'unread' ? ' (difilter: belum dibaca)' : ''}.
          </p>
        </div>
        <form action={markAllAction}>
          <button
            type="submit"
            disabled={unreadTotal === 0}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Check className="h-4 w-4" aria-hidden="true" />
            Tandai semua dibaca
          </button>
        </form>
      </header>

      <nav
        aria-label="Filter notifikasi"
        className="flex items-center gap-2 border-b border-border"
      >
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={buildHref('/dashboard/notifikasi/feed', {}, {}) as any}
          className={
            filter === 'all'
              ? 'border-b-2 border-secondary px-3 py-2 text-sm font-medium text-foreground'
              : 'border-b-2 border-transparent px-3 py-2 text-sm text-muted-foreground hover:text-foreground'
          }
        >
          Semua
        </Link>
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={
            buildHref('/dashboard/notifikasi/feed', {}, { filter: 'unread' }) as any
          }
          className={
            filter === 'unread'
              ? 'border-b-2 border-secondary px-3 py-2 text-sm font-medium text-foreground'
              : 'border-b-2 border-transparent px-3 py-2 text-sm text-muted-foreground hover:text-foreground'
          }
        >
          Belum dibaca
          {unreadTotal > 0 ? (
            <span className="ml-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-secondary px-1.5 text-[10px] font-medium text-secondary-foreground">
              {unreadTotal > 99 ? '99+' : unreadTotal}
            </span>
          ) : null}
        </Link>
      </nav>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <Inbox className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm font-medium">
            {filter === 'unread'
              ? 'Tidak ada notifikasi belum dibaca'
              : 'Belum ada notifikasi'}
          </p>
          <p className="text-xs text-muted-foreground">
            Notifikasi akan muncul di sini saat ada aktivitas baru pada akun Anda.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {items.map((n) => (
            <li
              key={n.id}
              className={
                n.isRead
                  ? 'flex flex-col gap-3 p-4 sm:flex-row sm:items-start'
                  : 'flex flex-col gap-3 bg-secondary/5 p-4 sm:flex-row sm:items-start'
              }
            >
              <span className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-secondary">
                <Bell className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full border border-border bg-background px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                    {TYPE_LABEL[n.type] ?? n.type}
                  </span>
                  {!n.isRead ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-secondary/20 px-2 py-0.5 text-[10px] font-medium text-secondary">
                      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-secondary" />
                      Belum dibaca
                    </span>
                  ) : null}
                  <span className="text-xs text-muted-foreground">
                    {dateFmt.format(n.createdAt)}
                  </span>
                </div>
                <p
                  className={
                    n.isRead
                      ? 'mt-1.5 text-sm text-muted-foreground'
                      : 'mt-1.5 text-sm font-medium text-foreground'
                  }
                >
                  {n.title}
                </p>
                {n.body ? (
                  <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                    {n.body}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                {n.link ? (
                  <Link
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    href={n.link as any}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                  >
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    Buka
                  </Link>
                ) : null}
                {!n.isRead ? (
                  <form action={markOneAction}>
                    <input type="hidden" name="id" value={n.id} />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                    >
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      Tandai dibaca
                    </button>
                  </form>
                ) : null}
                <form action={deleteOneAction}>
                  <input type="hidden" name="id" value={n.id} />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 rounded-md border border-destructive/30 bg-background px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Hapus
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 ? (
        <nav
          aria-label="Pagination"
          className="flex flex-wrap items-center justify-between gap-3 text-sm"
        >
          <p className="text-muted-foreground">
            Halaman {page} dari {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                href={
                  buildHref('/dashboard/notifikasi/feed', sp, {
                    page: page - 1 > 1 ? String(page - 1) : undefined,
                  }) as any
                }
                className="border-border bg-background hover:bg-muted rounded-md border px-3 py-1.5"
              >
                ← Sebelumnya
              </Link>
            ) : null}
            {page < totalPages ? (
              <Link
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                href={
                  buildHref('/dashboard/notifikasi/feed', sp, {
                    page: String(page + 1),
                  }) as any
                }
                className="border-border bg-background hover:bg-muted rounded-md border px-3 py-1.5"
              >
                Selanjutnya →
              </Link>
            ) : null}
          </div>
        </nav>
      ) : null}
    </div>
  )
}
