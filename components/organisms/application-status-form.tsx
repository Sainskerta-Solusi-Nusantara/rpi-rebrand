'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  updateApplicationNote,
  updateApplicationStatus,
} from '@/lib/tenants/application-actions'
import { ApplicationStatusNotifyInfo } from './application-status-notify-info'
import { useI18n } from '@/lib/i18n/i18n-provider'

const inputClass =
  'rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60'

type Option = { value: string; label: string }

/**
 * Inline status select -- fires updateApplicationStatus on change.
 * Optimistically reflects the new value; reverts on server error.
 */
export function ApplicationStatusSelect({
  applicationId,
  current,
  options,
  className,
}: {
  applicationId: string
  current: string
  options: Option[]
  className?: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [value, setValue] = useState<string>(current)

  // Keep in sync when the parent re-renders after a refresh.
  useEffect(() => {
    setValue(current)
  }, [current])

  function onChange(next: string) {
    if (next === value) return
    const prev = value
    setValue(next)
    setError(null)
    startTransition(async () => {
      const r = await updateApplicationStatus({ applicationId, status: next })
      if (!r.ok) {
        setValue(prev)
        setError(r.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className={`flex flex-col gap-1 ${className ?? ''}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={pending}
        aria-label="Status lamaran"
        className={inputClass}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && (
        <span role="alert" className="text-destructive text-xs">
          {error}
        </span>
      )}
      {/* Inform the recruiter that flipping to any non-trivial status will
          dispatch an email to the candidate. Hidden when status is unchanged
          (no email actually fires) or when the picked value is APPLIED /
          WITHDRAWN (no email for those either). */}
      {value !== current &&
        value !== 'APPLIED' &&
        value !== 'WITHDRAWN' && <ApplicationStatusNotifyInfo newStatus={value} />}
    </div>
  )
}

/**
 * Textarea + save button for recruiter notes on an application.
 * Shows lightweight auto-save indication (saving / saved / error).
 */
export function ApplicationNoteForm({
  applicationId,
  initial,
}: {
  applicationId: string
  initial: string | null
}) {
  const router = useRouter()
  const { t } = useI18n()
  const tl = t.formsApplications.statusForm
  const [pending, startTransition] = useTransition()
  const [value, setValue] = useState<string>(initial ?? '')
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>(
    'idle',
  )
  const [error, setError] = useState<string | null>(null)
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (savedTimer.current) clearTimeout(savedTimer.current)
    }
  }, [])

  const len = value.length
  const tooLong = len > 5000

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (tooLong) return
    setStatus('saving')
    setError(null)
    startTransition(async () => {
      const r = await updateApplicationNote({ applicationId, notes: value })
      if (!r.ok) {
        setStatus('error')
        setError(r.error)
        return
      }
      setStatus('saved')
      if (savedTimer.current) clearTimeout(savedTimer.current)
      savedTimer.current = setTimeout(() => setStatus('idle'), 2500)
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <label
        htmlFor={`note-${applicationId}`}
        className="text-foreground block text-sm font-medium"
      >
        {tl.noteLabel}
      </label>
      <textarea
        id={`note-${applicationId}`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={5}
        maxLength={5000}
        disabled={pending}
        placeholder={tl.notePlaceholder}
        className="border-input bg-background text-foreground focus:border-ring focus:ring-ring/30 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
      />
      <div className="flex items-center justify-between text-xs">
        <span
          className={`${
            tooLong ? 'text-destructive' : 'text-muted-foreground'
          }`}
        >
          {len.toLocaleString('id-ID')} / 5000
        </span>
        <div className="flex items-center gap-2">
          {status === 'saving' && (
            <span className="text-muted-foreground">{tl.noteSaving}</span>
          )}
          {status === 'saved' && (
            <span className="text-success" role="status">
              {tl.noteSaved}
            </span>
          )}
          {status === 'error' && error && (
            <span className="text-destructive" role="alert">
              {error}
            </span>
          )}
          <button
            type="submit"
            disabled={pending || tooLong}
            className="bg-primary text-primary-foreground inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? tl.noteSaving : tl.noteSaveBtn}
          </button>
        </div>
      </div>
    </form>
  )
}
