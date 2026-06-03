'use client'

import { inputClass, labelClass, btnPrimaryLg as btnPrimary, btnSecondary } from '@/lib/ui/form-styles'
import { useState, useTransition, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, Upload, AlertTriangle } from 'lucide-react'
import {
  parseAndValidateCoursesCsv,
  bulkImportCourses,
  type PreviewResult,
  type ImportResult,
} from '@/lib/tenants/course-import-actions'
import { useI18n } from '@/lib/i18n/i18n-provider'


const textareaClass = `${inputClass} min-h-[10rem] font-mono text-xs leading-relaxed`




type Stage =
  | { kind: 'upload'; error?: string }
  | { kind: 'preview'; preview: PreviewResult; csvText: string; error?: string }
  | { kind: 'result'; result: ImportResult }

export function TenantCoursesImportForm({
  tenantSlug,
}: {
  tenantSlug: string
}) {
  const router = useRouter()
  const { t } = useI18n()
  const tl = t.formsTenantImport.coursesImport
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [pending, startTransition] = useTransition()
  const [csvText, setCsvText] = useState('')
  const [stage, setStage] = useState<Stage>({ kind: 'upload' })

  function resetToUpload() {
    setStage({ kind: 'upload' })
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const text =
        typeof reader.result === 'string'
          ? reader.result
          : new TextDecoder('utf-8').decode(reader.result as ArrayBuffer)
      setCsvText(text)
    }
    reader.onerror = () => {
      setStage({
        kind: 'upload',
        error: tl.fileReadError,
      })
    }
    reader.readAsText(file, 'utf-8')
  }

  function handlePreview() {
    if (!csvText.trim()) {
      setStage({
        kind: 'upload',
        error: tl.csvEmptyError,
      })
      return
    }
    startTransition(async () => {
      const res = await parseAndValidateCoursesCsv({ tenantSlug, csvText })
      if (!res.ok) {
        setStage({ kind: 'upload', error: res.error })
        return
      }
      setStage({ kind: 'preview', preview: res.data!, csvText })
    })
  }

  function handleImport() {
    if (stage.kind !== 'preview') return
    const csv = stage.csvText
    startTransition(async () => {
      const res = await bulkImportCourses({ tenantSlug, csvText: csv })
      if (!res.ok) {
        setStage({
          kind: 'preview',
          preview: stage.preview,
          csvText: stage.csvText,
          error: res.error,
        })
        return
      }
      setStage({ kind: 'result', result: res.data! })
      router.refresh()
    })
  }

  if (stage.kind === 'upload') {
    return (
      <div className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="csv-file" className={labelClass}>
            {tl.uploadFileLabel}
          </label>
          <input
            ref={fileInputRef}
            id="csv-file"
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            disabled={pending}
            className={inputClass}
          />
          <p className="text-muted-foreground text-xs">
            {tl.uploadOrPaste}
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="csv-text" className={labelClass}>
            {tl.pasteLabel}
          </label>
          <textarea
            id="csv-text"
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            disabled={pending}
            placeholder="title,description,level,durationHours,instructorEmail,status"
            className={textareaClass}
          />
        </div>

        {stage.error && (
          <p
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {stage.error}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handlePreview}
            disabled={pending || !csvText.trim()}
            className={btnPrimary}
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            {pending ? tl.btnParsePending : tl.btnParse}
          </button>
          {csvText && (
            <button
              type="button"
              onClick={() => {
                setCsvText('')
                if (fileInputRef.current) fileInputRef.current.value = ''
              }}
              disabled={pending}
              className={btnSecondary}
            >
              {tl.btnClear}
            </button>
          )}
        </div>
      </div>
    )
  }

  if (stage.kind === 'preview') {
    const { preview } = stage
    return (
      <div className="space-y-5">
        <div className="border-border flex flex-wrap items-center gap-4 rounded-2xl border bg-card p-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs uppercase">
              {tl.statTotalRows}
            </p>
            <p className="text-foreground font-semibold">{preview.totalRows}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase">{tl.statValid}</p>
            <p className="text-success font-semibold">{preview.validCount}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase">
              {tl.statInvalid}
            </p>
            <p className="text-destructive font-semibold">
              {preview.invalidCount}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <p className={labelClass}>{tl.detectedHeaders}</p>
          <div className="flex flex-wrap gap-2">
            {preview.headers.map((h, idx) => (
              <code
                key={`${h}-${idx}`}
                className="bg-muted rounded px-2 py-0.5 text-xs"
              >
                {h}
              </code>
            ))}
          </div>
        </div>

        <div className="border-border overflow-x-auto rounded-2xl border bg-card">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3 font-medium">{tl.colRow}</th>
                <th className="p-3 font-medium">{tl.colStatus}</th>
                <th className="p-3 font-medium">{tl.colTitle}</th>
                <th className="p-3 font-medium">{tl.colLevel}</th>
                <th className="p-3 font-medium">{tl.colNotes}</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {preview.rows.map((r) => {
                const isValid = r.errors.length === 0
                return (
                  <tr key={r.lineNum}>
                    <td className="p-3 font-mono text-xs">{r.lineNum}</td>
                    <td className="p-3">
                      {isValid ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                          <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                          {tl.badgeValid}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                          <XCircle className="h-3 w-3" aria-hidden="true" />
                          {tl.badgeError}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-xs">
                      {(r.parsed?.title ?? r.raw.title ?? '').slice(0, 60)}
                    </td>
                    <td className="p-3 text-xs">
                      {r.parsed?.level ?? r.raw.level ?? '—'}
                    </td>
                    <td className="p-3 text-xs">
                      {isValid ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <ul className="space-y-0.5 text-destructive">
                          {r.errors.map((e, i) => (
                            <li key={i}>{e}</li>
                          ))}
                        </ul>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {stage.error && (
          <p
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {stage.error}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleImport}
            disabled={pending || preview.validCount === 0}
            className={btnPrimary}
          >
            {pending
              ? tl.btnImportPending
              : tl.btnImport.replace('{count}', String(preview.validCount))}
          </button>
          <button
            type="button"
            onClick={resetToUpload}
            disabled={pending}
            className={btnSecondary}
          >
            {tl.btnCancel}
          </button>
        </div>
      </div>
    )
  }

  // result stage
  const { result } = stage
  const allOk = result.skipped === 0
  return (
    <div className="space-y-5">
      <div
        className={`rounded-2xl border p-5 ${
          allOk
            ? 'border-success/30 bg-success/10'
            : 'border-amber-400/40 bg-amber-50'
        }`}
      >
        <div className="flex items-start gap-3">
          {allOk ? (
            <CheckCircle2
              className="text-success mt-0.5 h-6 w-6"
              aria-hidden="true"
            />
          ) : (
            <AlertTriangle
              className="mt-0.5 h-6 w-6 text-amber-700"
              aria-hidden="true"
            />
          )}
          <div className="space-y-2 text-sm">
            <p className="font-heading text-lg">
              {allOk ? tl.resultDoneTitle : tl.resultPartialTitle}
            </p>
            <ul className="space-y-1">
              <li>
                {tl.resultTotalRows}: <span className="font-mono">{result.total}</span>
              </li>
              <li>
                {tl.resultCreated}:{' '}
                <span className="text-success font-mono font-semibold">
                  {result.created}
                </span>
              </li>
              <li>
                {tl.resultSkipped}:{' '}
                <span className="text-destructive font-mono font-semibold">
                  {result.skipped}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {result.errors.length > 0 && (
        <div className="border-border overflow-x-auto rounded-2xl border bg-card">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3 font-medium">{tl.colRow}</th>
                <th className="p-3 font-medium">{tl.colMessage}</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {result.errors.map((e) => (
                <tr key={e.lineNum}>
                  <td className="p-3 font-mono text-xs">{e.lineNum}</td>
                  <td className="p-3 text-xs text-destructive">{e.error}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={`/dashboard/tenants/${tenantSlug}/kursus` as any}
          className={btnPrimary}
        >
          {tl.btnViewCourses}
        </Link>
        <button type="button" onClick={resetToUpload} className={btnSecondary}>
          {tl.btnImportAgain}
        </button>
      </div>
    </div>
  )
}
