'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { createNote } from '@/lib/applications/note-actions'
import { cn } from '@/lib/utils'

export type TenantMember = {
  userId: string
  username: string
  name: string | null
}

export interface NotesComposerProps {
  applicationId: string
  parentNoteId?: string
  tenantMembers: TenantMember[]
  placeholder?: string
  submitLabel?: string
  /** When set, render compact layout for reply boxes. */
  compact?: boolean
  /** Fired after successful submit; e.g. parent can close the reply box. */
  onSuccess?: () => void
  /** Optional cancel callback — when present, a "Batal" button is shown. */
  onCancel?: () => void
}

/**
 * Detect the `@token` the caret is currently inside, if any.
 * Returns the lowercase token (without `@`) and the start index of the `@`,
 * or null when not in an @mention. This drives the autocomplete popover.
 */
function findMentionAtCaret(
  text: string,
  caret: number,
): { token: string; start: number } | null {
  if (caret <= 0) return null
  // Walk left from caret until we hit whitespace, start, or '@'.
  let i = caret
  while (i > 0) {
    const ch = text.charAt(i - 1)
    if (ch === '@') {
      // Confirm @ is preceded by non-word (start-of-input or whitespace/punct).
      if (i - 1 === 0 || /\s|[^A-Za-z0-9_]/.test(text.charAt(i - 2))) {
        const token = text.slice(i, caret)
        // Token must match the mention charset; if it has a space it's done.
        if (/^[a-zA-Z0-9._-]*$/.test(token)) {
          return { token: token.toLowerCase(), start: i - 1 }
        }
      }
      return null
    }
    if (/\s/.test(ch)) return null
    i--
  }
  return null
}

export function NotesComposer({
  applicationId,
  parentNoteId,
  tenantMembers,
  placeholder = 'Tulis catatan... gunakan @ untuk menyebut anggota tim',
  submitLabel = 'Kirim catatan',
  compact = false,
  onSuccess,
  onCancel,
}: NotesComposerProps) {
  const router = useRouter()
  const [value, setValue] = React.useState('')
  const [pending, startTransition] = React.useTransition()
  const [error, setError] = React.useState<string | null>(null)
  const [suggestions, setSuggestions] = React.useState<TenantMember[]>([])
  const [activeIndex, setActiveIndex] = React.useState(0)
  const [mentionStart, setMentionStart] = React.useState<number | null>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null)

  const tooLong = value.length > 5000

  const updateSuggestions = React.useCallback(
    (text: string, caret: number) => {
      const m = findMentionAtCaret(text, caret)
      if (!m) {
        setSuggestions([])
        setMentionStart(null)
        return
      }
      const token = m.token
      const filtered = tenantMembers
        .filter((u) => {
          const uname = u.username.toLowerCase()
          if (token === '') return true
          return (
            uname.startsWith(token) ||
            (u.name && u.name.toLowerCase().includes(token))
          )
        })
        .slice(0, 6)
      setSuggestions(filtered)
      setActiveIndex(0)
      setMentionStart(m.start)
    },
    [tenantMembers],
  )

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const text = e.target.value
    setValue(text)
    updateSuggestions(text, e.target.selectionStart ?? text.length)
  }

  function insertMention(member: TenantMember) {
    if (mentionStart === null) return
    const ta = textareaRef.current
    if (!ta) return
    const caret = ta.selectionStart ?? value.length
    const before = value.slice(0, mentionStart)
    const after = value.slice(caret)
    const inserted = `@${member.username} `
    const next = before + inserted + after
    setValue(next)
    setSuggestions([])
    setMentionStart(null)
    // Restore caret after the inserted mention.
    requestAnimationFrame(() => {
      const pos = (before + inserted).length
      ta.focus()
      ta.setSelectionRange(pos, pos)
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((i) => (i + 1) % suggestions.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) =>
          (i - 1 + suggestions.length) % suggestions.length,
        )
        return
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        const pick = suggestions[activeIndex]
        if (pick) {
          e.preventDefault()
          insertMention(pick)
          return
        }
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setSuggestions([])
        setMentionStart(null)
        return
      }
    }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      submit()
    }
  }

  function submit() {
    const body = value.trim()
    if (!body || tooLong || pending) return
    setError(null)
    startTransition(async () => {
      const res = await createNote({
        applicationId,
        body,
        parentNoteId,
      })
      if (!res.ok) {
        setError(res.error)
        return
      }
      setValue('')
      setSuggestions([])
      setMentionStart(null)
      onSuccess?.()
      router.refresh()
    })
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
      className={cn('space-y-2', compact && 'space-y-1')}
    >
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onSelect={(e) => {
            const ta = e.currentTarget
            updateSuggestions(ta.value, ta.selectionStart ?? ta.value.length)
          }}
          rows={compact ? 2 : 4}
          maxLength={5000}
          disabled={pending}
          placeholder={placeholder}
          aria-label="Isi catatan"
          className={cn(
            'border-input bg-background text-foreground focus:border-ring focus:ring-ring/30 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60',
          )}
        />
        {suggestions.length > 0 ? (
          <ul
            role="listbox"
            aria-label="Saran anggota tim"
            className="border-border bg-popover text-popover-foreground absolute left-0 top-full z-30 mt-1 max-h-56 w-full max-w-xs overflow-y-auto rounded-md border shadow-lg"
          >
            {suggestions.map((s, i) => (
              <li
                key={s.userId}
                role="option"
                aria-selected={i === activeIndex}
                onMouseDown={(e) => {
                  // mouseDown so the textarea doesn't lose focus before insert.
                  e.preventDefault()
                  insertMention(s)
                }}
                className={cn(
                  'flex cursor-pointer items-center gap-2 px-3 py-2 text-sm',
                  i === activeIndex ? 'bg-muted' : 'hover:bg-muted/60',
                )}
              >
                <span className="font-medium">@{s.username}</span>
                {s.name ? (
                  <span className="text-muted-foreground text-xs">
                    {s.name}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <div className="flex items-center justify-between text-xs">
        <span
          className={
            tooLong ? 'text-destructive' : 'text-muted-foreground'
          }
        >
          {value.length.toLocaleString('id-ID')} / 5000
        </span>
        <div className="flex items-center gap-2">
          {error ? (
            <span role="alert" className="text-destructive">
              {error}
            </span>
          ) : null}
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              disabled={pending}
              className="border-input text-foreground hover:bg-muted inline-flex items-center justify-center rounded-md border bg-transparent px-3 py-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-60"
            >
              Batal
            </button>
          ) : null}
          <button
            type="submit"
            disabled={pending || tooLong || value.trim().length === 0}
            className="bg-primary text-primary-foreground inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? 'Mengirim…' : submitLabel}
          </button>
        </div>
      </div>
    </form>
  )
}

export default NotesComposer
