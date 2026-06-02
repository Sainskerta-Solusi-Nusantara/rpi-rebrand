'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronUp, Search } from 'lucide-react'
import type { ApplicationStatus } from '@prisma/client'
import { updateApplicationStatus } from '@/lib/tenants/application-actions'
import {
  KANBAN_COLUMN_ORDER,
  kanbanStatusLabel,
  kanbanStatusTone,
  type KanbanCard as KanbanCardData,
  type KanbanData,
} from '@/lib/applications/kanban-queries'
import { KanbanCard } from './kanban-card'
import { useI18n } from '@/lib/i18n/i18n-provider'

type Props = {
  tenantSlug: string
  initial: KanbanData
  /** Job dropdown options (id + title) */
  jobs: { id: string; title: string }[]
  filters: { jobId?: string; q?: string }
}

type BoardState = {
  byStatus: Record<ApplicationStatus, KanbanCardData[]>
  /** card ids currently in-flight (waiting for server). */
  pending: Set<string>
}

const ARCHIVED_KEYS: ApplicationStatus[] = ['REJECTED', 'WITHDRAWN'] as ApplicationStatus[]

function buildInitialState(initial: KanbanData): BoardState {
  const byStatus = {} as Record<ApplicationStatus, KanbanCardData[]>
  for (const col of initial.columns) {
    byStatus[col.status] = [...col.applications]
  }
  // Split archived back into per-status buckets so optimistic moves to either
  // bucket land in the correct list.
  for (const s of ARCHIVED_KEYS) byStatus[s] = []
  for (const c of initial.archived) {
    if (!byStatus[c.status]) byStatus[c.status] = []
    byStatus[c.status].push(c)
  }
  return { byStatus, pending: new Set() }
}

export function ApplicationKanbanBoard({
  tenantSlug,
  initial,
  jobs,
  filters,
}: Props) {
  const router = useRouter()
  const { t } = useI18n()
  const tl = t.formsApplications.kanban
  const [state, setState] = useState<BoardState>(() => buildInitialState(initial))
  const [showArchived, setShowArchived] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  // Sync when the server-rendered data changes (e.g., after a filter submit).
  useEffect(() => {
    setState(buildInitialState(initial))
  }, [initial])

  const dragRef = useRef<{ cardId: string; fromStatus: ApplicationStatus } | null>(null)
  const [dragOverCol, setDragOverCol] = useState<ApplicationStatus | null>(null)

  function onDragStart(
    e: React.DragEvent<HTMLLIElement>,
    cardId: string,
    fromStatus: ApplicationStatus,
  ) {
    dragRef.current = { cardId, fromStatus }
    e.dataTransfer.effectAllowed = 'move'
    try {
      e.dataTransfer.setData('text/plain', cardId)
    } catch {
      /* Safari can throw on synthetic drops; harmless. */
    }
  }

  function onDragEnd() {
    dragRef.current = null
    setDragOverCol(null)
  }

  function onColumnDragOver(e: React.DragEvent<HTMLDivElement>, status: ApplicationStatus) {
    if (!dragRef.current) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverCol !== status) setDragOverCol(status)
  }

  function moveCardOptimistic(
    cardId: string,
    fromStatus: ApplicationStatus,
    toStatus: ApplicationStatus,
  ) {
    setState((prev) => {
      const fromList = prev.byStatus[fromStatus] ?? []
      const card = fromList.find((c) => c.id === cardId)
      if (!card) return prev
      const nextByStatus: Record<ApplicationStatus, KanbanCardData[]> = {
        ...prev.byStatus,
        [fromStatus]: fromList.filter((c) => c.id !== cardId),
        [toStatus]: [
          { ...card, status: toStatus, updatedAt: new Date() },
          ...(prev.byStatus[toStatus] ?? []),
        ],
      }
      const nextPending = new Set(prev.pending)
      nextPending.add(cardId)
      return { byStatus: nextByStatus, pending: nextPending }
    })
  }

  function revertCard(
    cardId: string,
    fromStatus: ApplicationStatus,
    toStatus: ApplicationStatus,
    snapshot: KanbanCardData,
  ) {
    setState((prev) => {
      const toList = prev.byStatus[toStatus] ?? []
      const nextByStatus: Record<ApplicationStatus, KanbanCardData[]> = {
        ...prev.byStatus,
        [toStatus]: toList.filter((c) => c.id !== cardId),
        [fromStatus]: [snapshot, ...(prev.byStatus[fromStatus] ?? [])],
      }
      const nextPending = new Set(prev.pending)
      nextPending.delete(cardId)
      return { byStatus: nextByStatus, pending: nextPending }
    })
  }

  function clearPending(cardId: string) {
    setState((prev) => {
      if (!prev.pending.has(cardId)) return prev
      const nextPending = new Set(prev.pending)
      nextPending.delete(cardId)
      return { ...prev, pending: nextPending }
    })
  }

  function onColumnDrop(
    e: React.DragEvent<HTMLDivElement>,
    toStatus: ApplicationStatus,
  ) {
    e.preventDefault()
    const data = dragRef.current
    dragRef.current = null
    setDragOverCol(null)
    if (!data) return
    const { cardId, fromStatus } = data
    if (fromStatus === toStatus) return
    // WITHDRAWN is candidate-only; the server rejects it. Block in UI too.
    if (toStatus === ('WITHDRAWN' as ApplicationStatus)) {
      setError(tl.withdrawnOnlyCandidate)
      return
    }

    const snapshot = (state.byStatus[fromStatus] ?? []).find((c) => c.id === cardId)
    if (!snapshot) return

    setError(null)
    moveCardOptimistic(cardId, fromStatus, toStatus)

    startTransition(async () => {
      const r = await updateApplicationStatus({
        applicationId: cardId,
        status: toStatus,
      })
      if (!r.ok) {
        revertCard(cardId, fromStatus, toStatus, snapshot)
        setError(r.error)
        return
      }
      clearPending(cardId)
      // Refresh so the server view (counts, side-effect emails) stays canonical.
      router.refresh()
    })
  }

  const archivedCards = useMemo(() => {
    const out: KanbanCardData[] = []
    for (const s of ARCHIVED_KEYS) {
      out.push(...(state.byStatus[s] ?? []))
    }
    return out
  }, [state.byStatus])

  return (
    <div className="space-y-4">
      <FilterBar tenantSlug={tenantSlug} jobs={jobs} filters={filters} />

      {error ? (
        <div
          role="alert"
          className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm"
        >
          {error}
        </div>
      ) : null}

      <div className="-mx-2 flex gap-3 overflow-x-auto px-2 pb-4">
        {KANBAN_COLUMN_ORDER.map((status) => {
          const list = state.byStatus[status] ?? []
          const tone = kanbanStatusTone(status)
          const label = kanbanStatusLabel(status)
          const isOver = dragOverCol === status
          return (
            <div
              key={status}
              onDragOver={(e) => onColumnDragOver(e, status)}
              onDragLeave={() => setDragOverCol((c) => (c === status ? null : c))}
              onDrop={(e) => onColumnDrop(e, status)}
              className={[
                'border-border bg-muted/30 flex w-72 shrink-0 flex-col rounded-xl border p-3 transition',
                isOver ? 'ring-secondary bg-muted/60 ring-2' : '',
              ].join(' ')}
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${tone}`}
                  >
                    {label}
                  </span>
                </div>
                <span className="text-muted-foreground bg-background rounded-full px-2 py-0.5 text-xs">
                  {list.length}
                </span>
              </div>

              <ul className="flex min-h-[60px] flex-col gap-2">
                {list.map((card) => (
                  <KanbanCard
                    key={card.id}
                    card={card}
                    tenantSlug={tenantSlug}
                    tone={kanbanStatusTone(card.status)}
                    label={kanbanStatusLabel(card.status)}
                    pending={state.pending.has(card.id)}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                  />
                ))}
                {list.length === 0 ? (
                  <li className="text-muted-foreground rounded-md border border-dashed py-6 text-center text-xs">
                    {tl.columnEmptyDrop}
                  </li>
                ) : null}
              </ul>
            </div>
          )
        })}
      </div>

      <ArchivedFooter
        cards={archivedCards}
        expanded={showArchived}
        onToggle={() => setShowArchived((v) => !v)}
        tenantSlug={tenantSlug}
        pending={state.pending}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      />
    </div>
  )
}

function FilterBar({
  tenantSlug,
  jobs,
  filters,
}: {
  tenantSlug: string
  jobs: { id: string; title: string }[]
  filters: { jobId?: string; q?: string }
}) {
  const { t } = useI18n()
  const tl = t.formsApplications.kanban
  const baseHref = `/dashboard/tenants/${tenantSlug}/lamaran/kanban`
  return (
    <form
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      action={baseHref as any}
      className="border-border bg-card grid grid-cols-1 gap-3 rounded-2xl border p-4 sm:grid-cols-4"
    >
      <div className="space-y-1 sm:col-span-1">
        <label htmlFor="k-job" className="text-muted-foreground text-xs uppercase">
          {tl.filterJobLabel}
        </label>
        <select
          id="k-job"
          name="jobId"
          defaultValue={filters.jobId ?? ''}
          className="border-border bg-background block w-full rounded-md border px-3 py-2 text-sm"
        >
          <option value="">{tl.filterJobAll}</option>
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>
              {j.title}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1 sm:col-span-2">
        <label htmlFor="k-q" className="text-muted-foreground text-xs uppercase">
          {tl.filterCandidateLabel}
        </label>
        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <input
            id="k-q"
            name="q"
            type="text"
            defaultValue={filters.q ?? ''}
            placeholder={tl.filterCandidatePlaceholder}
            className="border-border bg-background block w-full rounded-md border py-2 pl-9 pr-3 text-sm"
          />
        </div>
      </div>
      <div className="flex items-end gap-2 sm:col-span-1">
        <button
          type="submit"
          className="bg-primary text-primary-foreground inline-flex h-10 w-full items-center justify-center rounded-md px-4 text-sm font-medium"
        >
          {tl.filterApplyBtn}
        </button>
      </div>
    </form>
  )
}

function ArchivedFooter({
  cards,
  expanded,
  onToggle,
  tenantSlug,
  pending,
  onDragStart,
  onDragEnd,
}: {
  cards: KanbanCardData[]
  expanded: boolean
  onToggle: () => void
  tenantSlug: string
  pending: Set<string>
  onDragStart: (
    e: React.DragEvent<HTMLLIElement>,
    cardId: string,
    fromStatus: ApplicationStatus,
  ) => void
  onDragEnd: (e: React.DragEvent<HTMLLIElement>) => void
}) {
  const { t } = useI18n()
  const tl = t.formsApplications.kanban
  return (
    <div className="border-border bg-muted/20 rounded-xl border">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="hover:bg-muted/40 flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium"
      >
        <span className="flex items-center gap-2">
          {tl.archivedToggle}
          <span className="text-muted-foreground bg-background rounded-full px-2 py-0.5 text-xs">
            {cards.length}
          </span>
        </span>
        {expanded ? (
          <ChevronUp className="text-muted-foreground size-4" />
        ) : (
          <ChevronDown className="text-muted-foreground size-4" />
        )}
      </button>

      {expanded ? (
        <ul className="grid grid-cols-1 gap-2 px-4 pb-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cards.map((card) => (
            <KanbanCard
              key={card.id}
              card={card}
              tenantSlug={tenantSlug}
              tone={kanbanStatusTone(card.status)}
              label={kanbanStatusLabel(card.status)}
              pending={pending.has(card.id)}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            />
          ))}
          {cards.length === 0 ? (
            <li className="text-muted-foreground col-span-full rounded-md border border-dashed py-6 text-center text-xs">
              {tl.archivedEmpty}
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  )
}

export default ApplicationKanbanBoard
