'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Pencil, Trash2 } from 'lucide-react'
import { JobStatus } from '@prisma/client'
import { changeJobStatus, deleteJob } from '@/lib/tenants/job-actions'

const STATUS_LABELS: Record<JobStatus, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Dipublikasikan',
  PAUSED: 'Dijeda',
  CLOSED: 'Ditutup',
  ARCHIVED: 'Diarsipkan',
}

const selectClass =
  'border-border bg-background rounded-md border px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-60'

export function JobRowActions({
  tenantSlug,
  jobId,
  currentStatus,
  canEdit,
  canChangeStatus,
  canPublish,
  canDelete,
}: {
  tenantSlug: string
  jobId: string
  currentStatus: JobStatus
  canEdit: boolean
  canChangeStatus: boolean
  canPublish: boolean
  canDelete: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<JobStatus>(currentStatus)

  const statusOptions = (Object.keys(STATUS_LABELS) as JobStatus[]).filter(
    (s) => s !== JobStatus.PUBLISHED || canPublish,
  )

  function onStatusChange(next: JobStatus) {
    if (next === status) return
    setError(null)
    setStatus(next)
    startTransition(async () => {
      const r = await changeJobStatus({ jobId, status: next })
      if (!r.ok) {
        setError(r.error)
        setStatus(currentStatus)
        return
      }
      router.refresh()
    })
  }

  function onDelete() {
    if (
      !window.confirm(
        'Hapus lowongan ini secara permanen? Semua lamaran terkait juga akan terhapus.',
      )
    ) {
      return
    }
    setError(null)
    startTransition(async () => {
      const r = await deleteJob(jobId)
      if (!r.ok) {
        setError(r.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        {canEdit && (
          <Link
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            href={`/dashboard/tenants/${tenantSlug}/jobs/${jobId}/edit` as any}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            Edit
          </Link>
        )}
        {canChangeStatus && (
          <select
            aria-label="Ubah status"
            value={status}
            disabled={pending}
            onChange={(e) => onStatusChange(e.target.value as JobStatus)}
            className={selectClass}
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        )}
        {canDelete && (
          <button
            type="button"
            onClick={onDelete}
            disabled={pending}
            className="text-destructive hover:text-destructive/80 inline-flex items-center gap-1 text-xs disabled:opacity-60"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            Hapus
          </button>
        )}
      </div>
      {error && (
        <span role="alert" className="text-destructive text-xs">
          {error}
        </span>
      )}
    </div>
  )
}
