'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  EmploymentType,
  ExperienceLevel,
  JobStatus,
  LocationType,
} from '@prisma/client'
import { createJob, updateJob } from '@/lib/tenants/job-actions'
import { generateJdAction } from '@/lib/jd-generator/actions'
import { SkillAutocomplete } from '@/components/organisms/skill-autocomplete'

const inputClass =
  'block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60'

const textareaClass = `${inputClass} min-h-[8rem] resize-y leading-relaxed`

const labelClass = 'text-muted-foreground text-xs uppercase tracking-wide'

const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-md bg-[hsl(220,50%,14%)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[hsl(220,50%,18%)] disabled:cursor-not-allowed disabled:opacity-60'

const btnSecondary =
  'border-border bg-background hover:bg-muted inline-flex items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium text-foreground transition disabled:cursor-not-allowed disabled:opacity-60'

const EMPLOYMENT_LABELS: Record<EmploymentType, string> = {
  FULL_TIME: 'Penuh waktu',
  PART_TIME: 'Paruh waktu',
  CONTRACT: 'Kontrak',
  INTERNSHIP: 'Magang',
  FREELANCE: 'Freelance',
}

const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  ENTRY: 'Entry-level',
  JUNIOR: 'Junior',
  MID: 'Mid-level',
  SENIOR: 'Senior',
  LEAD: 'Lead',
  EXECUTIVE: 'Executive',
}

const STATUS_LABELS: Record<JobStatus, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Dipublikasikan',
  PAUSED: 'Dijeda',
  CLOSED: 'Ditutup',
  ARCHIVED: 'Diarsipkan',
}

const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  ONSITE: 'On-site',
  HYBRID: 'Hybrid',
  REMOTE: 'Remote',
}

export type JobFormInitial = {
  title: string
  description: string
  responsibilities: string
  requirements: string
  benefits: string
  salaryMin: number | null
  salaryMax: number | null
  employmentType: EmploymentType
  experienceLevel: ExperienceLevel
  location: string
  locationType: LocationType
  categoryId: string | null
  tags: string[]
  status: JobStatus
}

const EMPTY_INITIAL: JobFormInitial = {
  title: '',
  description: '',
  responsibilities: '',
  requirements: '',
  benefits: '',
  salaryMin: null,
  salaryMax: null,
  employmentType: EmploymentType.FULL_TIME,
  experienceLevel: ExperienceLevel.MID,
  location: '',
  locationType: LocationType.ONSITE,
  categoryId: null,
  tags: [],
  status: JobStatus.DRAFT,
}

type Banner = { kind: 'idle' } | { kind: 'success' } | { kind: 'error'; message: string }

export function JobForm({
  tenantSlug,
  jobId,
  initial,
  categories,
}: {
  tenantSlug: string
  jobId?: string
  initial?: JobFormInitial
  categories: { id: string; name: string }[]
}) {
  const router = useRouter()
  const seed: JobFormInitial = initial ?? EMPTY_INITIAL
  const isEdit = Boolean(jobId)

  const [pending, startTransition] = useTransition()
  const [banner, setBanner] = useState<Banner>({ kind: 'idle' })

  const [title, setTitle] = useState(seed.title)
  const [description, setDescription] = useState(seed.description)
  const [responsibilities, setResponsibilities] = useState(seed.responsibilities)
  const [requirements, setRequirements] = useState(seed.requirements)
  const [benefits, setBenefits] = useState(seed.benefits)
  const [salaryMin, setSalaryMin] = useState<string>(
    seed.salaryMin != null ? String(seed.salaryMin) : '',
  )
  const [salaryMax, setSalaryMax] = useState<string>(
    seed.salaryMax != null ? String(seed.salaryMax) : '',
  )
  const [employmentType, setEmploymentType] = useState<EmploymentType>(
    seed.employmentType,
  )
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(
    seed.experienceLevel,
  )
  const [location, setLocation] = useState(seed.location)
  const [locationType, setLocationType] = useState<LocationType>(seed.locationType)
  const [categoryId, setCategoryId] = useState<string>(seed.categoryId ?? '')
  const [tags, setTags] = useState<string[]>(seed.tags)
  const [status, setStatus] = useState<JobStatus>(seed.status)

  // JD generator state — local to this form, no schema change.
  const [jdPending, setJdPending] = useState(false)
  const [jdPreview, setJdPreview] = useState<{
    description: string
    responsibilities: string
    requirements: string
    benefits: string
  } | null>(null)
  const [jdError, setJdError] = useState<string | null>(null)

  async function onGenerateJd() {
    setJdError(null)
    setJdPreview(null)
    if (!title.trim() || title.trim().length < 3) {
      setJdError('Isi judul terlebih dahulu (minimal 3 karakter).')
      return
    }
    setJdPending(true)
    try {
      const result = await generateJdAction({
        tenantSlug,
        title,
        level: experienceLevel,
        employmentType,
        location,
        locationType,
        tags,
      })
      if (!result.ok) {
        setJdError(result.error)
        return
      }
      setJdPreview(result.data ?? null)
    } finally {
      setJdPending(false)
    }
  }

  function applyJdPreview() {
    if (!jdPreview) return
    setDescription(jdPreview.description)
    setResponsibilities(jdPreview.responsibilities)
    setRequirements(jdPreview.requirements)
    setBenefits(jdPreview.benefits)
    setJdPreview(null)
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBanner({ kind: 'idle' })
    const fd = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = isEdit
        ? await updateJob({ jobId: jobId as string, values: fd })
        : await createJob({ tenantSlug, values: fd })

      if (!result.ok) {
        setBanner({ kind: 'error', message: result.error })
        return
      }
      setBanner({ kind: 'success' })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.push(`/dashboard/tenants/${tenantSlug}/jobs` as any)
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-foreground">Identitas lowongan</legend>
        <div className="space-y-1">
          <label htmlFor="f-title" className={labelClass}>
            Judul
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
            placeholder="Senior Backend Engineer"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="f-location" className={labelClass}>
              Lokasi
            </label>
            <input
              id="f-location"
              name="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={pending}
              required
              minLength={2}
              maxLength={120}
              placeholder="Jakarta, Indonesia"
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <span className={labelClass}>Tipe lokasi</span>
            <div className="flex flex-wrap gap-3">
              {(Object.keys(LOCATION_TYPE_LABELS) as LocationType[]).map((lt) => (
                <label
                  key={lt}
                  className="border-border bg-background inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm"
                >
                  <input
                    type="radio"
                    name="locationType"
                    value={lt}
                    checked={locationType === lt}
                    onChange={() => setLocationType(lt)}
                    disabled={pending}
                  />
                  <span>{LOCATION_TYPE_LABELS[lt]}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="f-employmentType" className={labelClass}>
              Tipe pekerjaan
            </label>
            <select
              id="f-employmentType"
              name="employmentType"
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
              disabled={pending}
              className={inputClass}
            >
              {(Object.keys(EMPLOYMENT_LABELS) as EmploymentType[]).map((et) => (
                <option key={et} value={et}>
                  {EMPLOYMENT_LABELS[et]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="f-experienceLevel" className={labelClass}>
              Level pengalaman
            </label>
            <select
              id="f-experienceLevel"
              name="experienceLevel"
              value={experienceLevel}
              onChange={(e) =>
                setExperienceLevel(e.target.value as ExperienceLevel)
              }
              disabled={pending}
              className={inputClass}
            >
              {(Object.keys(EXPERIENCE_LABELS) as ExperienceLevel[]).map((lv) => (
                <option key={lv} value={lv}>
                  {EXPERIENCE_LABELS[lv]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="f-salaryMin" className={labelClass}>
              Gaji minimum (IDR / bulan)
            </label>
            <input
              id="f-salaryMin"
              name="salaryMin"
              type="number"
              min={0}
              step={100_000}
              value={salaryMin}
              onChange={(e) => setSalaryMin(e.target.value)}
              disabled={pending}
              placeholder="Opsional"
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="f-salaryMax" className={labelClass}>
              Gaji maksimum (IDR / bulan)
            </label>
            <input
              id="f-salaryMax"
              name="salaryMax"
              type="number"
              min={0}
              step={100_000}
              value={salaryMax}
              onChange={(e) => setSalaryMax(e.target.value)}
              disabled={pending}
              placeholder="Opsional"
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="f-categoryId" className={labelClass}>
              Kategori
            </label>
            <select
              id="f-categoryId"
              name="categoryId"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={pending}
              className={inputClass}
            >
              <option value="">— Tidak ada kategori —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="f-tags" className={labelClass}>
              Skill / tag
            </label>
            <SkillAutocomplete
              name="tags"
              value={tags}
              onChange={setTags}
              disabled={pending}
              placeholder="Ketik skill (mis. react), Enter untuk menambah"
            />
            <p className="text-muted-foreground text-xs">
              Pilih dari saran atau ketik skill baru. Tekan Enter atau koma untuk menambahkan.
            </p>
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-foreground">Detail konten</legend>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="f-description" className={labelClass}>
              Deskripsi <span className="text-muted-foreground">(min 50 karakter)</span>
            </label>
            <button
              type="button"
              onClick={onGenerateJd}
              disabled={pending || jdPending}
              className="border-border bg-background hover:bg-muted inline-flex items-center justify-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium text-foreground transition disabled:cursor-not-allowed disabled:opacity-60"
              title="Buat draft JD berdasarkan judul, level, dan skill"
            >
              {jdPending ? 'Membuat draft…' : 'Generate dari role'}
            </button>
          </div>
          {jdError && (
            <p
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs text-destructive"
            >
              {jdError}
            </p>
          )}
          {jdPreview && (
            <div className="space-y-2 rounded-md border border-border bg-muted/40 p-3 text-xs">
              <p className="text-muted-foreground">
                Draft berhasil dibuat. Tinjau ringkasan di bawah lalu konfirmasi untuk menerapkan
                (akan menimpa deskripsi, tanggung jawab, kualifikasi, dan benefit).
              </p>
              <details className="rounded border border-border bg-background/60 p-2">
                <summary className="cursor-pointer font-medium text-foreground">
                  Pratinjau deskripsi
                </summary>
                <pre className="mt-2 whitespace-pre-wrap text-foreground">
                  {jdPreview.description}
                </pre>
              </details>
              <details className="rounded border border-border bg-background/60 p-2">
                <summary className="cursor-pointer font-medium text-foreground">
                  Pratinjau tanggung jawab
                </summary>
                <pre className="mt-2 whitespace-pre-wrap text-foreground">
                  {jdPreview.responsibilities}
                </pre>
              </details>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={applyJdPreview}
                  className="inline-flex items-center justify-center gap-1.5 rounded-md bg-[hsl(220,50%,14%)] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[hsl(220,50%,18%)]"
                >
                  Terapkan draft
                </button>
                <button
                  type="button"
                  onClick={() => setJdPreview(null)}
                  className="border-border bg-background hover:bg-muted inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium text-foreground"
                >
                  Batal
                </button>
              </div>
            </div>
          )}
          <textarea
            id="f-description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={pending}
            required
            minLength={50}
            placeholder="Ringkasan posisi, peran, dan dampaknya."
            className={textareaClass}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="f-responsibilities" className={labelClass}>
            Tanggung jawab (opsional)
          </label>
          <textarea
            id="f-responsibilities"
            name="responsibilities"
            value={responsibilities}
            onChange={(e) => setResponsibilities(e.target.value)}
            disabled={pending}
            placeholder="• Memimpin pengembangan layanan inti…"
            className={textareaClass}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="f-requirements" className={labelClass}>
            Kualifikasi (opsional)
          </label>
          <textarea
            id="f-requirements"
            name="requirements"
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            disabled={pending}
            placeholder="• 5+ tahun pengalaman backend…"
            className={textareaClass}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="f-benefits" className={labelClass}>
            Benefit (opsional)
          </label>
          <textarea
            id="f-benefits"
            name="benefits"
            value={benefits}
            onChange={(e) => setBenefits(e.target.value)}
            disabled={pending}
            placeholder="• Asuransi kesehatan, stock options…"
            className={textareaClass}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-foreground">Status publikasi</legend>
        <div className="space-y-1 sm:max-w-xs">
          <label htmlFor="f-status" className={labelClass}>
            Status
          </label>
          <select
            id="f-status"
            name="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as JobStatus)}
            disabled={pending}
            className={inputClass}
          >
            {(Object.keys(STATUS_LABELS) as JobStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <p className="text-muted-foreground text-xs">
            Mengubah status menjadi “Dipublikasikan” membutuhkan izin{' '}
            <code className="bg-muted rounded px-1">job.publish</code>.
          </p>
        </div>
      </fieldset>

      {banner.kind === 'success' && (
        <p
          role="status"
          className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success"
        >
          {isEdit ? 'Perubahan berhasil disimpan.' : 'Lowongan berhasil dibuat.'}
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
            ? 'Menyimpan…'
            : isEdit
              ? 'Simpan perubahan'
              : 'Buat lowongan'}
        </button>
        <button
          type="button"
          onClick={() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            router.push(`/dashboard/tenants/${tenantSlug}/jobs` as any)
          }}
          disabled={pending}
          className={btnSecondary}
        >
          Batal
        </button>
      </div>
    </form>
  )
}
