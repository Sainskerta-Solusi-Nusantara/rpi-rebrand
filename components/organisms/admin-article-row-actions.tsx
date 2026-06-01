'use client'

/**
 * Per-row action menu for the admin Articles table. Renders inline buttons
 * for: Edit (link), Publish, Archive, Delete. All mutating buttons run their
 * action through `useTransition` and refresh the route on success.
 */

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  publishArticle,
  archiveArticle,
  deleteArticle,
} from '@/lib/blog/actions'

type Status = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

const btnGhost =
  'border-border text-foreground/80 hover:border-[color:var(--ring)] hover:text-[color:var(--ring)] inline-flex items-center rounded-md border px-2.5 py-1 text-xs transition disabled:cursor-not-allowed disabled:opacity-60'

const btnDanger =
  'border-destructive/40 text-destructive hover:bg-destructive/10 inline-flex items-center rounded-md border px-2.5 py-1 text-xs transition disabled:cursor-not-allowed disabled:opacity-60'

export function AdminArticleRowActions({
  articleId,
  status,
}: {
  articleId: string
  status: Status
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [err, setErr] = useState<string | null>(null)

  function run(action: () => Promise<{ ok: true } | { ok: false; error: string }>) {
    setErr(null)
    startTransition(async () => {
      const result = await action()
      if (!result.ok) {
        setErr(result.error)
        return
      }
      router.refresh()
    })
  }

  function onDelete() {
    if (
      typeof window !== 'undefined' &&
      !window.confirm('Hapus artikel ini? Tindakan ini tidak dapat dibatalkan.')
    ) {
      return
    }
    run(() => deleteArticle(articleId))
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Link
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        href={`/admin/articles/${articleId}/edit` as any}
        className={btnGhost}
      >
        Edit
      </Link>
      {status !== 'PUBLISHED' && (
        <button
          type="button"
          onClick={() => run(() => publishArticle(articleId))}
          disabled={pending}
          className={btnGhost}
        >
          Terbitkan
        </button>
      )}
      {status !== 'ARCHIVED' && (
        <button
          type="button"
          onClick={() => run(() => archiveArticle(articleId))}
          disabled={pending}
          className={btnGhost}
        >
          Arsipkan
        </button>
      )}
      <button
        type="button"
        onClick={onDelete}
        disabled={pending}
        className={btnDanger}
      >
        Hapus
      </button>
      {err && (
        <span role="alert" className="text-destructive ml-2 text-xs">
          {err}
        </span>
      )}
    </div>
  )
}
