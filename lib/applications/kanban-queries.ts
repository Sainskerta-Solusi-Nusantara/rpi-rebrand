import { cache } from 'react'
import { ApplicationStatus, Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'

/**
 * Card shown on the recruiter kanban board.
 *
 * NOTE on PII: this view is gated by `job.update` (recruiter scope), so
 * surfacing applicant email is acceptable here — recruiters need it to
 * contact candidates. Public/applicant views must redact email before
 * rendering.
 */
export type KanbanCard = {
  id: string
  applicantName: string
  applicantEmail: string
  applicantImage: string | null
  jobTitle: string
  jobId: string
  appliedAt: Date
  updatedAt: Date
  status: ApplicationStatus
  aiScore: number | null
  aiTags: string[]
}

export type KanbanColumn = {
  status: ApplicationStatus
  label: string
  tone: string
  applications: KanbanCard[]
}

export type KanbanData = {
  columns: KanbanColumn[]
  archived: KanbanCard[]
}

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  APPLIED: 'Dilamar',
  REVIEWED: 'Ditinjau',
  SHORTLISTED: 'Shortlist',
  INTERVIEW: 'Wawancara',
  OFFERED: 'Penawaran',
  HIRED: 'Diterima',
  REJECTED: 'Ditolak',
  WITHDRAWN: 'Dibatalkan',
}

const STATUS_TONE: Record<ApplicationStatus, string> = {
  APPLIED: 'bg-slate-100 text-slate-800',
  REVIEWED: 'bg-sky-100 text-sky-800',
  SHORTLISTED: 'bg-indigo-100 text-indigo-800',
  INTERVIEW: 'bg-violet-100 text-violet-800',
  OFFERED: 'bg-amber-100 text-amber-800',
  HIRED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  WITHDRAWN: 'bg-zinc-100 text-zinc-800',
}

/** Left-to-right column order on the board. */
export const KANBAN_COLUMN_ORDER: ApplicationStatus[] = [
  ApplicationStatus.APPLIED,
  ApplicationStatus.REVIEWED,
  ApplicationStatus.SHORTLISTED,
  ApplicationStatus.INTERVIEW,
  ApplicationStatus.OFFERED,
  ApplicationStatus.HIRED,
]

/** REJECTED + WITHDRAWN live in the collapsed "Archived" footer. */
const ARCHIVED_STATUSES: ApplicationStatus[] = [
  ApplicationStatus.REJECTED,
  ApplicationStatus.WITHDRAWN,
]

/**
 * Soft cap per column. The board fetches at most this many cards per status
 * to keep the initial paint cheap; a future iteration can add "load more"
 * pagination on the client. Today we just truncate.
 */
export const KANBAN_COLUMN_CAP = 100

export function kanbanStatusLabel(s: ApplicationStatus): string {
  return STATUS_LABELS[s]
}

export function kanbanStatusTone(s: ApplicationStatus): string {
  return STATUS_TONE[s]
}

type GetKanbanArgs = {
  tenantId: string
  jobId?: string
  searchQuery?: string
}

const EMPTY: KanbanData = {
  columns: KANBAN_COLUMN_ORDER.map((status) => ({
    status,
    label: STATUS_LABELS[status],
    tone: STATUS_TONE[status],
    applications: [],
  })),
  archived: [],
}

/**
 * Fetch all applications for the tenant bucketed by status, capped per
 * column. Results are intentionally shaped for the recruiter-side kanban UI.
 *
 * We issue one query per visible status (6 + 1 archived merged) to apply the
 * per-column cap server-side rather than over-fetching. Total fan-out is
 * bounded and parallelizable.
 */
export const getKanbanData = cache(
  async ({
    tenantId,
    jobId,
    searchQuery,
  }: GetKanbanArgs): Promise<KanbanData> => {
    if (!tenantId) return EMPTY

    const q = searchQuery?.trim()
    const baseWhere: Prisma.ApplicationWhereInput = { tenantId }
    if (jobId) baseWhere.jobId = jobId
    if (q) {
      baseWhere.user = {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      }
    }

    const SELECT = {
      id: true,
      status: true,
      appliedAt: true,
      updatedAt: true,
      jobId: true,
      aiScore: true,
      aiTags: true,
      user: { select: { name: true, email: true, image: true } },
      job: { select: { id: true, title: true } },
    } as const

    try {
      const columnResults = await Promise.all(
        KANBAN_COLUMN_ORDER.map((status) =>
          prisma.application.findMany({
            where: { ...baseWhere, status },
            orderBy: [{ updatedAt: 'desc' }],
            take: KANBAN_COLUMN_CAP,
            select: SELECT,
          }),
        ),
      )

      const archivedRaw = await prisma.application.findMany({
        where: { ...baseWhere, status: { in: ARCHIVED_STATUSES } },
        orderBy: [{ updatedAt: 'desc' }],
        take: KANBAN_COLUMN_CAP,
        select: SELECT,
      })

      const toCard = (a: (typeof columnResults)[number][number]): KanbanCard => ({
        id: a.id,
        applicantName: a.user.name ?? a.user.email,
        applicantEmail: a.user.email,
        applicantImage: a.user.image,
        jobTitle: a.job.title,
        jobId: a.job.id,
        appliedAt: a.appliedAt,
        updatedAt: a.updatedAt,
        status: a.status,
        aiScore: a.aiScore,
        aiTags: a.aiTags,
      })

      return {
        columns: KANBAN_COLUMN_ORDER.map((status, i) => ({
          status,
          label: STATUS_LABELS[status],
          tone: STATUS_TONE[status],
          applications: (columnResults[i] ?? []).map(toCard),
        })),
        archived: archivedRaw.map(toCard),
      }
    } catch (err) {
      console.error('[getKanbanData] failed', err)
      return EMPTY
    }
  },
)
