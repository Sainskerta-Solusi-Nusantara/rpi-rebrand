'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Edit, Trash2, Pin, PinOff } from 'lucide-react'
import {
  deleteNote,
  togglePinNote,
  updateNote,
} from '@/lib/applications/note-actions'
import { cn } from '@/lib/utils'

export interface NoteActionsMenuProps {
  noteId: string
  body: string
  pinned: boolean
  canEdit: boolean
  canDelete: boolean
  canPin: boolean
  /** When true, render the pin button outside the dropdown (top-level notes). */
  showPin?: boolean
}

/**
 * Per-note kebab menu with inline edit. Pin/Unpin is exposed both as a quick
 * action (when showPin) and inside the dropdown.
 *
 * Inline edit is a controlled <textarea>; on save we call updateNote which
 * enforces the 15-minute edit window server-side. Client-side we just surface
 * the error string.
 */
export function NoteActionsMenu({
  noteId,
  body,
  pinned,
  canEdit,
  canDelete,
  canPin,
  showPin = true,
}: NoteActionsMenuProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState(false)
  const [draft, setDraft] = React.useState(body)
  const [pending, startTransition] = React.useTransition()
  const [error, setError] = React.useState<string | null>(null)
  const wrapRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  function handleDelete() {
    if (!confirm('Hapus catatan ini? Tindakan tidak dapat dibatalkan.')) {
      return
    }
    startTransition(async () => {
      const res = await deleteNote(noteId)
      if (!res.ok) {
        setError(res.error)
        return
      }
      router.refresh()
    })
  }

  function handlePin() {
    setOpen(false)
    startTransition(async () => {
      const res = await togglePinNote(noteId)
      if (!res.ok) {
        setError(res.error)
        return
      }
      router.refresh()
    })
  }

  function handleSaveEdit() {
    const next = draft.trim()
    if (!next) return
    startTransition(async () => {
      const res = await updateNote(noteId, next)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setEditing(false)
      router.refresh()
    })
  }

  if (editing) {
    return (
      <div className="space-y-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          maxLength={5000}
          disabled={pending}
          aria-label="Ubah isi catatan"
          className="border-input bg-background text-foreground focus:border-ring focus:ring-ring/30 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <div className="flex items-center justify-end gap-2 text-xs">
          {error ? (
            <span role="alert" className="text-destructive">
              {error}
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => {
              setEditing(false)
              setDraft(body)
              setError(null)
            }}
            disabled={pending}
            className="border-input text-foreground hover:bg-muted inline-flex items-center justify-center rounded-md border bg-transparent px-3 py-1.5 font-medium disabled:cursor-not-allowed disabled:opacity-60"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSaveEdit}
            disabled={pending || draft.trim().length === 0}
            className="bg-primary text-primary-foreground inline-flex items-center justify-center rounded-md px-3 py-1.5 font-medium disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? 'Menyimpan…' : 'Simpan'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1" ref={wrapRef}>
      {error ? (
        <span role="alert" className="text-destructive text-xs">
          {error}
        </span>
      ) : null}
      {showPin && canPin ? (
        <button
          type="button"
          onClick={handlePin}
          disabled={pending}
          aria-label={pinned ? 'Lepaskan sematan' : 'Sematkan'}
          title={pinned ? 'Lepaskan sematan' : 'Sematkan'}
          className={cn(
            'inline-flex h-7 w-7 items-center justify-center rounded-md',
            pinned
              ? 'text-amber-600 dark:text-amber-200 hover:bg-amber-100 dark:bg-amber-500/15'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          {pinned ? (
            <PinOff className="h-3.5 w-3.5" />
          ) : (
            <Pin className="h-3.5 w-3.5" />
          )}
        </button>
      ) : null}
      {canEdit || canDelete || canPin ? (
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((s) => !s)}
            aria-haspopup="menu"
            aria-expanded={open}
            aria-label="Tindakan catatan"
            className="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex h-7 w-7 items-center justify-center rounded-md"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {open ? (
            <div
              role="menu"
              className="border-border bg-popover text-popover-foreground absolute right-0 z-30 mt-1 w-40 rounded-md border p-1 shadow-lg"
            >
              {canEdit ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false)
                    setEditing(true)
                  }}
                  className="hover:bg-muted flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm"
                >
                  <Edit className="h-3.5 w-3.5" />
                  Edit
                </button>
              ) : null}
              {canPin ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={handlePin}
                  className="hover:bg-muted flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm"
                >
                  {pinned ? (
                    <>
                      <PinOff className="h-3.5 w-3.5" />
                      Lepaskan sematan
                    </>
                  ) : (
                    <>
                      <Pin className="h-3.5 w-3.5" />
                      Sematkan
                    </>
                  )}
                </button>
              ) : null}
              {canDelete ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false)
                    handleDelete()
                  }}
                  className="text-destructive hover:bg-muted flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Hapus
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export default NoteActionsMenu
