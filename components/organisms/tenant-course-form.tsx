'use client'

import { inputClass, labelClass, btnPrimaryLg as btnPrimary, btnSecondary } from '@/lib/ui/form-styles'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CourseLevel, CourseStatus } from '@prisma/client'
import { createCourse, updateCourse } from '@/lib/tenants/course-actions'
import { useI18n } from '@/lib/i18n/i18n-provider'


const textareaClass = `${inputClass} min-h-[8rem] resize-y leading-relaxed`




export type CourseFormInitial = {
  title: string
  description: string
  level: CourseLevel
  durationHours: number
  instructorId: string | null
  thumbnail: string
  status: CourseStatus
}

const EMPTY_INITIAL: CourseFormInitial = {
  title: '',
  description: '',
  level: CourseLevel.BEGINNER,
  durationHours: 1,
  instructorId: null,
  thumbnail: '',
  status: CourseStatus.DRAFT,
}

type Banner = { kind: 'idle' } | { kind: 'success' } | { kind: 'error'; message: string }

export function CourseForm({
  tenantSlug,
  courseId,
  initial,
  instructors,
}: {
  tenantSlug: string
  courseId?: string
  initial?: CourseFormInitial
  instructors: { id: string; name: string; email: string }[]
}) {
  const router = useRouter()
  const { t } = useI18n()
  const tc = t.formsTenantCourse.courseForm

  const seed: CourseFormInitial = initial ?? EMPTY_INITIAL
  const isEdit = Boolean(courseId)

  const LEVEL_LABELS: Record<CourseLevel, string> = {
    BEGINNER: tc.levelBeginner,
    INTERMEDIATE: tc.levelIntermediate,
    ADVANCED: tc.levelAdvanced,
  }

  const STATUS_LABELS: Record<CourseStatus, string> = {
    DRAFT: tc.statusDraft,
    PUBLISHED: tc.statusPublished,
    ARCHIVED: tc.statusArchived,
  }

  const [pending, startTransition] = useTransition()
  const [banner, setBanner] = useState<Banner>({ kind: 'idle' })

  const [title, setTitle] = useState(seed.title)
  const [description, setDescription] = useState(seed.description)
  const [level, setLevel] = useState<CourseLevel>(seed.level)
  const [durationHours, setDurationHours] = useState<string>(
    String(seed.durationHours),
  )
  const [instructorId, setInstructorId] = useState<string>(
    seed.instructorId ?? '',
  )
  const [thumbnail, setThumbnail] = useState(seed.thumbnail)
  const [status, setStatus] = useState<CourseStatus>(seed.status)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBanner({ kind: 'idle' })
    const fd = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = isEdit
        ? await updateCourse({ courseId: courseId as string, values: fd })
        : await createCourse({ tenantSlug, values: fd })

      if (!result.ok) {
        setBanner({ kind: 'error', message: result.error })
        return
      }
      setBanner({ kind: 'success' })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.push(`/dashboard/tenants/${tenantSlug}/kursus` as any)
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-foreground">
          {tc.legendIdentity}
        </legend>
        <div className="space-y-1">
          <label htmlFor="f-title" className={labelClass}>
            {tc.titleLabel}
          </label>
          <input
            id="f-title"
            name="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={pending}
            required
            minLength={5}
            maxLength={200}
            placeholder={tc.titlePlaceholder}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <span className={labelClass}>{tc.levelLabel}</span>
          <div className="flex flex-wrap gap-3">
            {(Object.keys(LEVEL_LABELS) as CourseLevel[]).map((lv) => (
              <label
                key={lv}
                className="border-border bg-background inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm"
              >
                <input
                  type="radio"
                  name="level"
                  value={lv}
                  checked={level === lv}
                  onChange={() => setLevel(lv)}
                  disabled={pending}
                />
                <span>{LEVEL_LABELS[lv]}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="f-durationHours" className={labelClass}>
              {tc.durationLabel}
            </label>
            <input
              id="f-durationHours"
              name="durationHours"
              type="number"
              min={1}
              max={1000}
              step={1}
              value={durationHours}
              onChange={(e) => setDurationHours(e.target.value)}
              disabled={pending}
              required
              placeholder="8"
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="f-instructorId" className={labelClass}>
              {tc.instructorLabel}
            </label>
            <select
              id="f-instructorId"
              name="instructorId"
              value={instructorId}
              onChange={(e) => setInstructorId(e.target.value)}
              disabled={pending}
              className={inputClass}
            >
              <option value="">{tc.instructorUnassigned}</option>
              {instructors.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name || u.email}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="f-thumbnail" className={labelClass}>
            {tc.thumbnailLabel}
          </label>
          <input
            id="f-thumbnail"
            name="thumbnail"
            type="url"
            value={thumbnail}
            onChange={(e) => setThumbnail(e.target.value)}
            disabled={pending}
            placeholder="https://cdn.example.com/cover.png"
            className={inputClass}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-foreground">
          {tc.legendDescription}
        </legend>
        <div className="space-y-1">
          <label htmlFor="f-description" className={labelClass}>
            {tc.descriptionLabel}{' '}
            <span className="text-muted-foreground">{tc.descriptionHint}</span>
          </label>
          <textarea
            id="f-description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={pending}
            required
            minLength={50}
            placeholder={tc.descriptionPlaceholder}
            className={textareaClass}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-foreground">
          {tc.legendPublication}
        </legend>
        <div className="space-y-1 sm:max-w-xs">
          <label htmlFor="f-status" className={labelClass}>
            {tc.statusLabel}
          </label>
          <select
            id="f-status"
            name="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as CourseStatus)}
            disabled={pending}
            className={inputClass}
          >
            {(Object.keys(STATUS_LABELS) as CourseStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <p className="text-muted-foreground text-xs">
            {tc.statusHelperText}
          </p>
        </div>
      </fieldset>

      {banner.kind === 'success' && (
        <p
          role="status"
          className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success"
        >
          {isEdit ? tc.bannerUpdated : tc.bannerCreated}
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
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending
            ? tc.btnSaving
            : isEdit
              ? tc.btnSaveChanges
              : tc.btnCreate}
        </button>
        <button
          type="button"
          onClick={() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            router.push(`/dashboard/tenants/${tenantSlug}/kursus` as any)
          }}
          disabled={pending}
          className={btnSecondary}
        >
          {tc.btnCancel}
        </button>
      </div>
    </form>
  )
}
