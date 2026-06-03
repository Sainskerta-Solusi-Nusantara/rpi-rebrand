'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  upsertEmailTemplate,
  deleteEmailTemplate,
  type TemplateStatus,
} from '@/lib/tenants/email-template-actions'
import { renderTemplate } from '@/lib/tenants/email-template-render'
import { useI18n } from '@/lib/i18n/i18n-provider'

type Banner =
  | { kind: 'idle' }
  | { kind: 'success'; message: string }
  | { kind: 'error'; message: string }

const inputClass =
  'block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60'

/**
 * All placeholders supported by the resolver. Keep in sync with
 * `lib/tenants/email-template-resolver.ts`.
 */
export const AVAILABLE_VARIABLES: { name: string; description: string; sample: string }[] = [
  { name: 'name', description: 'Nama kandidat (mungkin kosong)', sample: 'Budi Santoso' },
  { name: 'jobTitle', description: 'Judul lowongan', sample: 'Backend Engineer' },
  { name: 'tenantName', description: 'Nama tenant Anda', sample: 'PT Contoh Sukses' },
  { name: 'oldStatus', description: 'Status sebelumnya', sample: 'REVIEWED' },
  { name: 'newStatus', description: 'Status baru', sample: 'INTERVIEW' },
  {
    name: 'applicationUrl',
    description: 'Tautan ke dashboard lamaran kandidat',
    sample: 'https://app.rumahpekerja.id/dashboard/lamaran',
  },
  {
    name: 'recruiterNote',
    description: 'Catatan dari rekruter pada lamaran (opsional)',
    sample: '',
  },
]

const SAMPLE_VARS: Record<string, string> = Object.fromEntries(
  AVAILABLE_VARIABLES.map((v) => [v.name, v.sample]),
)

export type EmailTemplateInitial = {
  subject: string
  body: string
  enabled: boolean
}

export function EmailTemplateForm({
  tenantSlug,
  status,
  initial,
  defaultSubject,
  defaultBody,
}: {
  tenantSlug: string
  status: TemplateStatus
  initial: EmailTemplateInitial | null
  defaultSubject: string
  defaultBody: string
}) {
  const { t } = useI18n()
  const ns = t.formsTenantAdmin2.emailTemplateForm
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [resetting, startResetTransition] = useTransition()
  const [banner, setBanner] = useState<Banner>({ kind: 'idle' })

  const seed: EmailTemplateInitial = initial
    ? initial
    : { subject: defaultSubject, body: defaultBody, enabled: true }

  const [subject, setSubject] = useState(seed.subject)
  const [body, setBody] = useState(seed.body)
  const [enabled, setEnabled] = useState(seed.enabled)

  const previewSubject = useMemo(() => renderTemplate(subject, SAMPLE_VARS), [subject])
  const previewBody = useMemo(() => renderTemplate(body, SAMPLE_VARS), [body])

  const varDescriptions: Record<string, string> = {
    name: ns.varNameCandidate,
    jobTitle: ns.varJobTitle,
    tenantName: ns.varTenantName,
    oldStatus: ns.varOldStatus,
    newStatus: ns.varNewStatus,
    applicationUrl: ns.varApplicationUrl,
    recruiterNote: ns.varRecruiterNote,
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBanner({ kind: 'idle' })
    startTransition(async () => {
      const r = await upsertEmailTemplate({
        tenantSlug,
        status,
        subject,
        body,
        enabled,
      })
      if (!r.ok) {
        setBanner({ kind: 'error', message: r.error })
        return
      }
      setBanner({
        kind: 'success',
        message: r.data?.created ? ns.successCreated : ns.successSaved,
      })
      router.refresh()
    })
  }

  function onReset() {
    if (!confirm(ns.confirmReset)) {
      return
    }
    setBanner({ kind: 'idle' })
    startResetTransition(async () => {
      const r = await deleteEmailTemplate({ tenantSlug, status })
      if (!r.ok) {
        setBanner({ kind: 'error', message: r.error })
        return
      }
      // Reflect default state locally — the page will refetch on refresh().
      setSubject(defaultSubject)
      setBody(defaultBody)
      setEnabled(true)
      setBanner({ kind: 'success', message: ns.successDeleted })
      router.refresh()
    })
  }

  function insertVariable(name: string) {
    setBody((b) => `${b}{{${name}}}`)
  }

  const busy = pending || resetting

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-1">
            <label
              htmlFor={`subject-${status}`}
              className="text-muted-foreground text-xs uppercase"
            >
              {ns.labelSubject}
            </label>
            <input
              id={`subject-${status}`}
              name="subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={busy}
              maxLength={200}
              className={inputClass}
              required
            />
            <p className="text-muted-foreground text-xs">
              {ns.charCountSubject.replace('{n}', String(subject.length))}
            </p>
          </div>

          <div className="space-y-1">
            <label
              htmlFor={`body-${status}`}
              className="text-muted-foreground text-xs uppercase"
            >
              {ns.labelBody}
            </label>
            <textarea
              id={`body-${status}`}
              name="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={busy}
              rows={18}
              maxLength={10_000}
              className={`${inputClass} resize-y font-mono text-xs leading-relaxed`}
              required
            />
            <p className="text-muted-foreground text-xs">
              {ns.charCountBody.replace('{n}', String(body.length))}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              id={`enabled-${status}`}
              name="enabled"
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              disabled={busy}
              className="border-input h-4 w-4 rounded"
            />
            <label htmlFor={`enabled-${status}`} className="text-sm">
              {ns.labelEnabled}
            </label>
          </div>
          <p className="text-muted-foreground -mt-1 text-xs">
            {ns.helperDisabled}
          </p>

          <section
            aria-label="Variabel yang tersedia"
            className="border-border rounded-md border bg-muted/30 p-3"
          >
            <div className="text-foreground mb-2 text-sm font-medium">
              {ns.sectionVarsLabel}
            </div>
            <p className="text-muted-foreground mb-2 text-xs">
              {ns.sectionVarsHint}
            </p>
            <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
              {AVAILABLE_VARIABLES.map((v) => (
                <li key={v.name} className="text-xs">
                  <button
                    type="button"
                    onClick={() => insertVariable(v.name)}
                    disabled={busy}
                    className="bg-background hover:bg-muted border-border inline-block w-full rounded border px-2 py-1 text-left font-mono disabled:cursor-not-allowed disabled:opacity-60"
                    title={varDescriptions[v.name] ?? v.description}
                  >
                    {'{{'}
                    {v.name}
                    {'}}'}
                  </button>
                  <span className="text-muted-foreground ml-1 block pl-2">
                    {varDescriptions[v.name] ?? v.description}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside aria-label="Pratinjau" className="space-y-2">
          <div className="text-muted-foreground text-xs uppercase">{ns.previewHeading}</div>
          <div className="border-border bg-background rounded-md border p-4 shadow-sm">
            <div className="text-muted-foreground mb-1 text-xs">{ns.previewSubjectLabel}</div>
            <div className="mb-3 text-sm font-semibold">{previewSubject || ns.previewEmpty}</div>
            <div className="text-muted-foreground mb-1 text-xs">{ns.previewBodyLabel}</div>
            <pre className="text-foreground whitespace-pre-wrap break-words font-sans text-sm leading-relaxed">
              {previewBody || ns.previewEmpty}
            </pre>
          </div>
          <p className="text-muted-foreground text-xs">
            {ns.sectionVarsHint}
          </p>
        </aside>
      </div>

      {banner.kind === 'success' && (
        <p
          role="status"
          className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success"
        >
          {banner.message}
        </p>
      )}
      {banner.kind === 'error' && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {banner.message}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? ns.btnSavePending : initial ? ns.btnSaveUpdate : ns.btnSaveCreate}
        </button>
        {initial && (
          <button
            type="button"
            onClick={onReset}
            disabled={busy}
            className="border-border text-foreground hover:bg-muted inline-flex items-center justify-center gap-2 rounded-md border bg-background px-4 py-2.5 text-sm font-medium shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {resetting ? ns.btnResetPending : ns.btnReset}
          </button>
        )}
      </div>
    </form>
  )
}
