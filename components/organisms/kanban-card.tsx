'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import type { ApplicationStatus } from '@prisma/client'
import type { KanbanCard as KanbanCardData } from '@/lib/applications/kanban-queries'

type Props = {
  card: KanbanCardData
  tenantSlug: string
  tone: string
  label: string
  pending?: boolean
  /** Drag-start: native HTML5 DnD, optimistic move triggered by parent. */
  onDragStart: (e: React.DragEvent<HTMLLIElement>, cardId: string, fromStatus: ApplicationStatus) => void
  onDragEnd: (e: React.DragEvent<HTMLLIElement>) => void
  isDragging?: boolean
}

/** Tiny corner chip showing the AI score with traffic-light colors. */
function aiTone(score: number | null): string {
  if (score === null) return 'bg-zinc-100 dark:bg-zinc-500/15 text-zinc-700 dark:text-zinc-300'
  if (score >= 75) return 'bg-green-100 dark:bg-green-500/15 text-green-800 dark:text-green-300'
  if (score >= 50) return 'bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-200'
  return 'bg-red-100 dark:bg-red-500/15 text-red-800 dark:text-red-300'
}

/** "5 menit yang lalu", "2 jam", "3 hari" — short relative time in Indonesian. */
function timeAgo(date: Date): string {
  const diffMs = Date.now() - new Date(date).getTime()
  const sec = Math.max(0, Math.floor(diffMs / 1000))
  if (sec < 60) return 'Baru saja'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} mnt lalu`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} jam lalu`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d} hari lalu`
  const mo = Math.floor(d / 30)
  if (mo < 12) return `${mo} bln lalu`
  const yr = Math.floor(mo / 12)
  return `${yr} thn lalu`
}

export function KanbanCard({
  card,
  tenantSlug,
  tone,
  label,
  pending,
  onDragStart,
  onDragEnd,
  isDragging,
}: Props) {
  return (
    <li
      draggable={!pending}
      onDragStart={(e) => onDragStart(e, card.id, card.status)}
      onDragEnd={onDragEnd}
      aria-grabbed={isDragging ? true : undefined}
      className={[
        'group border-border bg-card text-card-foreground rounded-lg border p-3 shadow-sm transition',
        pending
          ? 'cursor-wait opacity-60'
          : 'cursor-grab hover:shadow-md active:cursor-grabbing',
        isDragging ? 'opacity-40' : '',
      ].join(' ')}
    >
      <div className="flex items-start gap-2">
        {card.applicantImage ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <Image
            src={card.applicantImage}
            alt=""
            className="size-8 shrink-0 rounded-full object-cover"
            width={32}
            height={32}
            unoptimized
          />
        ) : (
          <div className="bg-muted size-8 shrink-0 rounded-full" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium leading-tight">
            {card.applicantName}
          </p>
          <p className="text-muted-foreground mt-0.5 truncate text-[11px]">
            {card.applicantEmail}
          </p>
        </div>
        {pending ? (
          <Loader2
            className="text-muted-foreground size-4 shrink-0 animate-spin"
            aria-hidden="true"
          />
        ) : (
          <span
            className={`inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${aiTone(card.aiScore)}`}
            title={
              card.aiScore === null
                ? 'Belum di-screening'
                : `Skor AI ${card.aiScore}/100`
            }
          >
            {card.aiScore === null ? 'AI: —' : `AI: ${card.aiScore}`}
          </span>
        )}
      </div>

      <p
        className="text-muted-foreground mt-2 truncate text-xs"
        title={card.jobTitle}
      >
        {card.jobTitle}
      </p>

      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-muted-foreground text-[10px]">
          {timeAgo(card.appliedAt)}
        </span>
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${tone}`}
        >
          {label}
        </span>
      </div>

      <div className="mt-2 flex justify-end">
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={`/dashboard/tenants/${tenantSlug}/lamaran/${card.id}` as any}
          className="text-foreground text-[11px] font-medium hover:underline"
        >
          Lihat detail
        </Link>
      </div>
    </li>
  )
}

export default KanbanCard
