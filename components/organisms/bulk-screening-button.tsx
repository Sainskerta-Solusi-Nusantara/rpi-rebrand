'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Sparkles } from 'lucide-react'
import {
  runScreeningForJob,
  type BulkScreeningSummary,
} from '@/lib/applications/screening-actions'

type Props = {
  tenantSlug: string
  jobId: string
  jobTitle: string
}

/**
 * Bulk-screening trigger for one job. Shows a confirm prompt, then renders
 * a small result modal with the summary counts.
 */
export function BulkScreeningButton({ tenantSlug, jobId, jobTitle }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<BulkScreeningSummary | null>(null)

  function onClick() {
    setError(null)
    startTransition(async () => {
      const r = await runScreeningForJob({ tenantSlug, jobId })
      if (!r.ok) {
        setError(r.error)
        return
      }
      setSummary(r.data ?? null)
      router.refresh()
    })
  }

  function onClose() {
    setSummary(null)
  }

  return (
    <>
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={onClick}
          disabled={pending}
          className="border-input bg-background text-foreground hover:bg-muted inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Sparkles className="size-3.5" aria-hidden="true" />
          )}
          Screening semua lamaran untuk lowongan ini
        </button>
        {error ? <p className="text-xs text-red-600">{error}</p> : null}
      </div>

      {summary ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="bulk-screening-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={onClose}
        >
          <div
            className="border-border bg-card text-card-foreground w-full max-w-sm space-y-3 rounded-2xl border p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="bulk-screening-title" className="font-heading text-base">
              Hasil screening
            </h3>
            <p className="text-muted-foreground text-xs">
              Lowongan:{' '}
              <span className="text-foreground font-medium">{jobTitle}</span>
            </p>
            <dl className="grid grid-cols-3 gap-2 text-center text-sm">
              <div className="bg-muted rounded-md p-2">
                <dt className="text-muted-foreground text-[10px] uppercase">
                  Total
                </dt>
                <dd className="font-semibold">{summary.total}</dd>
              </div>
              <div className="rounded-md bg-green-50 p-2 text-green-800">
                <dt className="text-[10px] uppercase">Berhasil</dt>
                <dd className="font-semibold">{summary.succeeded}</dd>
              </div>
              <div className="rounded-md bg-red-50 p-2 text-red-800">
                <dt className="text-[10px] uppercase">Gagal</dt>
                <dd className="font-semibold">{summary.errors}</dd>
              </div>
            </dl>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="bg-primary text-primary-foreground inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

export default BulkScreeningButton
