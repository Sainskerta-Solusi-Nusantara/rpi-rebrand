'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  FileText,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import {
  removeResumeFile,
  updateResume,
  uploadResumeFile,
  type ResumeContent,
} from '@/lib/resumes/actions'
import { useI18n } from '@/lib/i18n/i18n-provider'

type Experience = NonNullable<ResumeContent['experiences']>[number]
type Education = NonNullable<ResumeContent['educations']>[number]

export type ResumeBuilderInitial = {
  id: string
  name: string
  fileUrl: string | null
  content: ResumeContent | null
}

const ACCEPT_FILE =
  'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const MAX_FILE_BYTES = 10 * 1024 * 1024

const inputClass =
  'block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30'

function emptyExperience(): Experience {
  return {
    title: '',
    company: '',
    location: '',
    startDate: '',
    endDate: '',
    current: false,
    description: '',
  }
}

function emptyEducation(): Education {
  return {
    school: '',
    degree: '',
    field: '',
    startDate: '',
    endDate: '',
    description: '',
  }
}

function fileNameFromUrl(url: string): string {
  const parts = url.split('/')
  return parts[parts.length - 1] || url
}

export function ResumeBuilderForm({ resume }: { resume: ResumeBuilderInitial }) {
  const router = useRouter()
  const { t } = useI18n()
  const tr = t.formsResume
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  const [savingFile, startFileTransition] = useTransition()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)

  const [name, setName] = useState(resume.name)
  const [fileUrl, setFileUrl] = useState<string | null>(resume.fileUrl)
  const [summary, setSummary] = useState(resume.content?.summary ?? '')
  const [experiences, setExperiences] = useState<Experience[]>(
    resume.content?.experiences && resume.content.experiences.length > 0
      ? resume.content.experiences
      : [],
  )
  const [educations, setEducations] = useState<Education[]>(
    resume.content?.educations && resume.content.educations.length > 0
      ? resume.content.educations
      : [],
  )
  const [skills, setSkills] = useState<string[]>(resume.content?.skills ?? [])
  const [skillDraft, setSkillDraft] = useState('')
  const [languages, setLanguages] = useState<string[]>(
    resume.content?.languages ?? [],
  )
  const [langDraft, setLangDraft] = useState('')

  function clearBanners() {
    setSubmitError(null)
    setSubmitSuccess(null)
  }

  // -------------------------------------------------------------------------
  // File upload
  // -------------------------------------------------------------------------

  function onPickFile() {
    clearBanners()
    fileInputRef.current?.click()
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > MAX_FILE_BYTES) {
      setSubmitError(tr.file.errorSize)
      return
    }
    if (!ACCEPT_FILE.split(',').includes(file.type)) {
      setSubmitError(tr.file.errorFormat)
      return
    }
    clearBanners()
    const fd = new FormData()
    fd.set('id', resume.id)
    fd.set('file', file)
    startFileTransition(async () => {
      const r = await uploadResumeFile(fd)
      if (!r.ok) {
        setSubmitError(r.error)
        return
      }
      if (r.data?.url) setFileUrl(r.data.url)
      setSubmitSuccess(tr.file.successUpload)
      router.refresh()
    })
  }

  function onRemoveFile() {
    if (!fileUrl) return
    if (!window.confirm(tr.file.confirmRemove)) return
    clearBanners()
    startFileTransition(async () => {
      const r = await removeResumeFile(resume.id)
      if (!r.ok) {
        setSubmitError(r.error)
        return
      }
      setFileUrl(null)
      setSubmitSuccess(tr.file.successRemove)
      router.refresh()
    })
  }

  // -------------------------------------------------------------------------
  // Experiences
  // -------------------------------------------------------------------------

  function addExperience() {
    if (experiences.length >= 20) return
    setExperiences((arr) => [...arr, emptyExperience()])
  }
  function updateExperience(idx: number, patch: Partial<Experience>) {
    setExperiences((arr) =>
      arr.map((row, i) => (i === idx ? { ...row, ...patch } : row)),
    )
  }
  function removeExperience(idx: number) {
    setExperiences((arr) => arr.filter((_, i) => i !== idx))
  }

  // -------------------------------------------------------------------------
  // Educations
  // -------------------------------------------------------------------------

  function addEducation() {
    if (educations.length >= 10) return
    setEducations((arr) => [...arr, emptyEducation()])
  }
  function updateEducation(idx: number, patch: Partial<Education>) {
    setEducations((arr) =>
      arr.map((row, i) => (i === idx ? { ...row, ...patch } : row)),
    )
  }
  function removeEducation(idx: number) {
    setEducations((arr) => arr.filter((_, i) => i !== idx))
  }

  // -------------------------------------------------------------------------
  // Skills + Languages (chip inputs)
  // -------------------------------------------------------------------------

  function addSkill() {
    const v = skillDraft.trim()
    if (!v) return
    if (skills.length >= 30) return
    if (skills.includes(v)) {
      setSkillDraft('')
      return
    }
    setSkills((arr) => [...arr, v])
    setSkillDraft('')
  }
  function removeSkill(v: string) {
    setSkills((arr) => arr.filter((s) => s !== v))
  }

  function addLanguage() {
    const v = langDraft.trim()
    if (!v) return
    if (languages.length >= 10) return
    if (languages.includes(v)) {
      setLangDraft('')
      return
    }
    setLanguages((arr) => [...arr, v])
    setLangDraft('')
  }
  function removeLanguage(v: string) {
    setLanguages((arr) => arr.filter((l) => l !== v))
  }

  // -------------------------------------------------------------------------
  // Submit (name + content)
  // -------------------------------------------------------------------------

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    clearBanners()

    const trimmedName = name.trim()
    if (trimmedName.length === 0) {
      setSubmitError(tr.name.errorRequired)
      return
    }
    if (trimmedName.length > 80) {
      setSubmitError(tr.name.errorMaxLength)
      return
    }

    // Build a clean content object — strip empty-only experience/education rows.
    const cleanedExperiences = experiences
      .map((row) => ({
        title: row.title.trim(),
        company: row.company.trim(),
        location: row.location?.trim() || undefined,
        startDate: row.startDate.trim(),
        endDate: row.current ? undefined : row.endDate?.trim() || undefined,
        current: row.current ?? false,
        description: row.description?.trim() || undefined,
      }))
      .filter((row) => row.title || row.company || row.startDate)

    const cleanedEducations = educations
      .map((row) => ({
        school: row.school.trim(),
        degree: row.degree?.trim() || undefined,
        field: row.field?.trim() || undefined,
        startDate: row.startDate.trim(),
        endDate: row.endDate?.trim() || undefined,
        description: row.description?.trim() || undefined,
      }))
      .filter((row) => row.school || row.startDate)

    const content: ResumeContent = {
      summary: summary.trim() || undefined,
      experiences: cleanedExperiences.length > 0 ? cleanedExperiences : undefined,
      educations: cleanedEducations.length > 0 ? cleanedEducations : undefined,
      skills: skills.length > 0 ? skills : undefined,
      languages: languages.length > 0 ? languages : undefined,
    }

    startTransition(async () => {
      const r = await updateResume({
        id: resume.id,
        name: trimmedName,
        content,
      })
      if (!r.ok) {
        setSubmitError(r.error)
        return
      }
      setSubmitSuccess(tr.submit.successSave)
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8" noValidate>
      {submitSuccess && (
        <div
          role="status"
          className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300"
        >
          {submitSuccess}
        </div>
      )}
      {submitError && (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm"
        >
          {submitError}
        </div>
      )}

      {/* Name */}
      <section className="border-border bg-card space-y-2 rounded-2xl border p-6">
        <label
          htmlFor="resume-name"
          className="block text-sm font-medium text-foreground"
        >
          {tr.name.label} <span className="text-destructive">*</span>
        </label>
        <input
          id="resume-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          className={inputClass}
          placeholder={tr.name.placeholder}
        />
        <p className="text-muted-foreground text-xs">{tr.name.helperMax}</p>
      </section>

      {/* File upload */}
      <section className="border-border bg-card space-y-3 rounded-2xl border p-6">
        <h2 className="font-heading text-lg">{tr.file.heading}</h2>
        <p className="text-muted-foreground text-sm">{tr.file.hint}</p>

        {fileUrl ? (
          <div className="border-border flex items-center justify-between gap-3 rounded-lg border p-3">
            <div className="flex min-w-0 items-center gap-2">
              <FileText
                className="text-muted-foreground h-5 w-5 shrink-0"
                aria-hidden="true"
              />
              <a
                href={fileUrl}
                target="_blank"
                rel="noreferrer"
                className="text-primary truncate text-sm hover:underline"
              >
                {fileNameFromUrl(fileUrl)}
              </a>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onPickFile}
                disabled={savingFile}
                className="border-border hover:bg-muted inline-flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                {tr.file.replaceButton}
              </button>
              <button
                type="button"
                onClick={onRemoveFile}
                disabled={savingFile}
                className="border-destructive/40 text-destructive hover:bg-destructive/5 inline-flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                {tr.file.removeButton}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={onPickFile}
            disabled={savingFile}
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            {savingFile ? tr.file.uploadButtonPending : tr.file.uploadButtonIdle}
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT_FILE}
          onChange={onFileChange}
          className="hidden"
          disabled={savingFile}
        />
      </section>

      {/* Summary */}
      <section className="border-border bg-card space-y-2 rounded-2xl border p-6">
        <label
          htmlFor="resume-summary"
          className="block text-sm font-medium text-foreground"
        >
          {tr.summary.label}
        </label>
        <textarea
          id="resume-summary"
          rows={4}
          maxLength={2000}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder={tr.summary.placeholder}
          className={inputClass}
        />
        <p className="text-muted-foreground text-xs">
          {tr.summary.charCount.replace('{count}', String(summary.length))}
        </p>
      </section>

      {/* Experiences */}
      <section className="border-border bg-card space-y-4 rounded-2xl border p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg">{tr.experience.heading}</h2>
          <button
            type="button"
            onClick={addExperience}
            disabled={experiences.length >= 20}
            className="border-border hover:bg-muted inline-flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            {tr.experience.addButton}
          </button>
        </div>
        {experiences.length === 0 && (
          <p className="text-muted-foreground text-sm">
            {tr.experience.emptyState}
          </p>
        )}
        <div className="space-y-4">
          {experiences.map((row, idx) => (
            <div
              key={idx}
              className="border-border space-y-3 rounded-lg border p-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-xs font-medium uppercase">
                  {tr.experience.itemLabel.replace('{n}', String(idx + 1))}
                </p>
                <button
                  type="button"
                  onClick={() => removeExperience(idx)}
                  className="text-destructive hover:bg-destructive/5 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                  {tr.experience.removeButton}
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-foreground mb-1 block text-xs font-medium">
                    {tr.experience.positionLabel}
                  </label>
                  <input
                    type="text"
                    value={row.title}
                    onChange={(e) =>
                      updateExperience(idx, { title: e.target.value })
                    }
                    maxLength={120}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-foreground mb-1 block text-xs font-medium">
                    {tr.experience.companyLabel}
                  </label>
                  <input
                    type="text"
                    value={row.company}
                    onChange={(e) =>
                      updateExperience(idx, { company: e.target.value })
                    }
                    maxLength={120}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-foreground mb-1 block text-xs font-medium">
                    {tr.experience.locationLabel}
                  </label>
                  <input
                    type="text"
                    value={row.location ?? ''}
                    onChange={(e) =>
                      updateExperience(idx, { location: e.target.value })
                    }
                    maxLength={120}
                    className={inputClass}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-foreground mb-1 block text-xs font-medium">
                      {tr.experience.startDateLabel}
                    </label>
                    <input
                      type="text"
                      placeholder="2022-01"
                      value={row.startDate}
                      onChange={(e) =>
                        updateExperience(idx, { startDate: e.target.value })
                      }
                      maxLength={20}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="text-foreground mb-1 block text-xs font-medium">
                      {tr.experience.endDateLabel}
                    </label>
                    <input
                      type="text"
                      placeholder="2024-06"
                      value={row.endDate ?? ''}
                      onChange={(e) =>
                        updateExperience(idx, { endDate: e.target.value })
                      }
                      maxLength={20}
                      disabled={row.current}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={row.current ?? false}
                  onChange={(e) =>
                    updateExperience(idx, { current: e.target.checked })
                  }
                />
                {tr.experience.currentLabel}
              </label>
              <div>
                <label className="text-foreground mb-1 block text-xs font-medium">
                  {tr.experience.descriptionLabel}
                </label>
                <textarea
                  rows={3}
                  value={row.description ?? ''}
                  onChange={(e) =>
                    updateExperience(idx, { description: e.target.value })
                  }
                  maxLength={3000}
                  className={inputClass}
                  placeholder={tr.experience.descriptionPlaceholder}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Educations */}
      <section className="border-border bg-card space-y-4 rounded-2xl border p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg">{tr.education.heading}</h2>
          <button
            type="button"
            onClick={addEducation}
            disabled={educations.length >= 10}
            className="border-border hover:bg-muted inline-flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            {tr.education.addButton}
          </button>
        </div>
        {educations.length === 0 && (
          <p className="text-muted-foreground text-sm">
            {tr.education.emptyState}
          </p>
        )}
        <div className="space-y-4">
          {educations.map((row, idx) => (
            <div
              key={idx}
              className="border-border space-y-3 rounded-lg border p-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-xs font-medium uppercase">
                  {tr.education.itemLabel.replace('{n}', String(idx + 1))}
                </p>
                <button
                  type="button"
                  onClick={() => removeEducation(idx)}
                  className="text-destructive hover:bg-destructive/5 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                  {tr.education.removeButton}
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-foreground mb-1 block text-xs font-medium">
                    {tr.education.institutionLabel}
                  </label>
                  <input
                    type="text"
                    value={row.school}
                    onChange={(e) =>
                      updateEducation(idx, { school: e.target.value })
                    }
                    maxLength={120}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-foreground mb-1 block text-xs font-medium">
                    {tr.education.degreeLabel}
                  </label>
                  <input
                    type="text"
                    value={row.degree ?? ''}
                    onChange={(e) =>
                      updateEducation(idx, { degree: e.target.value })
                    }
                    maxLength={120}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-foreground mb-1 block text-xs font-medium">
                    {tr.education.fieldLabel}
                  </label>
                  <input
                    type="text"
                    value={row.field ?? ''}
                    onChange={(e) =>
                      updateEducation(idx, { field: e.target.value })
                    }
                    maxLength={120}
                    className={inputClass}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-foreground mb-1 block text-xs font-medium">
                      {tr.education.startDateLabel}
                    </label>
                    <input
                      type="text"
                      placeholder="2018-08"
                      value={row.startDate}
                      onChange={(e) =>
                        updateEducation(idx, { startDate: e.target.value })
                      }
                      maxLength={20}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="text-foreground mb-1 block text-xs font-medium">
                      {tr.education.endDateLabel}
                    </label>
                    <input
                      type="text"
                      placeholder="2022-07"
                      value={row.endDate ?? ''}
                      onChange={(e) =>
                        updateEducation(idx, { endDate: e.target.value })
                      }
                      maxLength={20}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-foreground mb-1 block text-xs font-medium">
                  {tr.education.descriptionLabel}
                </label>
                <textarea
                  rows={2}
                  value={row.description ?? ''}
                  onChange={(e) =>
                    updateEducation(idx, { description: e.target.value })
                  }
                  maxLength={1000}
                  className={inputClass}
                  placeholder={tr.education.descriptionPlaceholder}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Skills */}
      <section className="border-border bg-card space-y-3 rounded-2xl border p-6">
        <h2 className="font-heading text-lg">{tr.skills.heading}</h2>
        <p className="text-muted-foreground text-sm">{tr.skills.hint}</p>
        <div className="flex flex-wrap gap-2">
          {skills.map((s) => (
            <span
              key={s}
              className="border-border bg-muted inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs"
            >
              {s}
              <button
                type="button"
                onClick={() => removeSkill(s)}
                className="hover:text-destructive"
                aria-label={tr.skills.removeAriaLabel.replace('{item}', s)}
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={skillDraft}
            onChange={(e) => setSkillDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addSkill()
              }
            }}
            maxLength={60}
            placeholder={tr.skills.inputPlaceholder}
            className={inputClass}
            disabled={skills.length >= 30}
          />
          <button
            type="button"
            onClick={addSkill}
            disabled={skills.length >= 30 || skillDraft.trim().length === 0}
            className="border-border hover:bg-muted inline-flex items-center gap-1.5 rounded-md border bg-background px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {tr.skills.addButton}
          </button>
        </div>
      </section>

      {/* Languages */}
      <section className="border-border bg-card space-y-3 rounded-2xl border p-6">
        <h2 className="font-heading text-lg">{tr.languages.heading}</h2>
        <p className="text-muted-foreground text-sm">{tr.languages.hint}</p>
        <div className="flex flex-wrap gap-2">
          {languages.map((l) => (
            <span
              key={l}
              className="border-border bg-muted inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs"
            >
              {l}
              <button
                type="button"
                onClick={() => removeLanguage(l)}
                className="hover:text-destructive"
                aria-label={tr.languages.removeAriaLabel.replace('{item}', l)}
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={langDraft}
            onChange={(e) => setLangDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addLanguage()
              }
            }}
            maxLength={60}
            placeholder={tr.languages.inputPlaceholder}
            className={inputClass}
            disabled={languages.length >= 10}
          />
          <button
            type="button"
            onClick={addLanguage}
            disabled={languages.length >= 10 || langDraft.trim().length === 0}
            className="border-border hover:bg-muted inline-flex items-center gap-1.5 rounded-md border bg-background px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {tr.languages.addButton}
          </button>
        </div>
      </section>

      {/* Submit */}
      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
        <Link
          href="/dashboard/cv"
          className="text-muted-foreground hover:text-foreground inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-medium"
        >
          {tr.submit.backButton}
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-[hsl(43,74%,55%)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {isPending ? tr.submit.saveButtonPending : tr.submit.saveButtonIdle}
        </button>
      </div>
    </form>
  )
}
