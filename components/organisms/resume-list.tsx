'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FileText, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import {
  createResume,
  deleteResume,
  updateResume,
} from '@/lib/resumes/actions'

export type ResumeListItem = {
  id: string
  name: string
  fileUrl: string | null
  hasContent: boolean
  isPrimary: boolean
  createdAt: Date
}

const idFmt = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' })

export function ResumeList({ resumes }: { resumes: ResumeListItem[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  function clearBanners() {
    setError(null)
    setInfo(null)
  }

  function handleCreate() {
    clearBanners()
    setBusyId('__new__')
    const defaultName = `CV Baru ${idFmt.format(new Date())}`
    startTransition(async () => {
      const r = await createResume({ name: defaultName })
      setBusyId(null)
      if (!r.ok) {
        setError(r.error)
        return
      }
      if (r.data?.id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.push(`/dashboard/cv/${r.data.id}` as any)
      } else {
        router.refresh()
      }
    })
  }

  function handleSetPrimary(id: string) {
    clearBanners()
    setBusyId(id)
    startTransition(async () => {
      const r = await updateResume({ id, isPrimary: true })
      setBusyId(null)
      if (!r.ok) {
        setError(r.error)
        return
      }
      setInfo('CV utama diperbarui.')
      router.refresh()
    })
  }

  function handleDelete(id: string, name: string) {
    if (!window.confirm(`Hapus CV "${name}"? Tindakan ini tidak bisa dibatalkan.`)) return
    clearBanners()
    setBusyId(id)
    startTransition(async () => {
      const r = await deleteResume(id)
      setBusyId(null)
      if (!r.ok) {
        setError(r.error)
        return
      }
      setInfo('CV dihapus.')
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          {resumes.length === 0
            ? 'Belum ada CV. Mulai dengan membuat CV baru.'
            : `${resumes.length} CV tersimpan.`}
        </p>
        <button
          type="button"
          onClick={handleCreate}
          disabled={pending}
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {busyId === '__new__' && pending ? 'Membuat…' : 'Buat CV baru'}
        </button>
      </div>

      {error && (
        <p
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm"
        >
          {error}
        </p>
      )}
      {info && (
        <p
          role="status"
          className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300"
        >
          {info}
        </p>
      )}

      {resumes.length === 0 ? (
        <div className="border-border rounded-xl border p-8 text-center">
          <FileText
            className="text-muted-foreground mx-auto mb-3 h-8 w-8"
            aria-hidden="true"
          />
          <p className="text-muted-foreground text-sm">
            Belum ada CV yang dibuat.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {resumes.map((r) => {
            const rowBusy = busyId === r.id && pending
            return (
              <li
                key={r.id}
                className="border-border bg-card flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      href={`/dashboard/cv/${r.id}` as any}
                      className="font-medium hover:underline"
                    >
                      {r.name}
                    </Link>
                    {r.isPrimary && (
                      <span className="bg-primary text-primary-foreground rounded px-2 py-0.5 text-xs font-medium">
                        Utama
                      </span>
                    )}
                    {r.fileUrl && (
                      <span className="border-border text-muted-foreground rounded border px-2 py-0.5 text-xs">
                        File terlampir
                      </span>
                    )}
                    {r.hasContent && (
                      <span className="border-border text-muted-foreground rounded border px-2 py-0.5 text-xs">
                        Konten terisi
                      </span>
                    )}
                  </div>
                  <div className="text-muted-foreground mt-1 text-xs">
                    Dibuat {idFmt.format(r.createdAt)}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {!r.isPrimary && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(r.id)}
                      disabled={pending}
                      className="border-border hover:bg-muted inline-flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Star className="h-3.5 w-3.5" aria-hidden="true" />
                      {rowBusy ? 'Memproses…' : 'Jadikan utama'}
                    </button>
                  )}
                  <Link
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    href={`/dashboard/cv/${r.id}` as any}
                    className="border-border hover:bg-muted inline-flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1.5 text-xs font-medium transition"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(r.id, r.name)}
                    disabled={pending}
                    className="border-destructive/40 text-destructive hover:bg-destructive/5 inline-flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Hapus
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
