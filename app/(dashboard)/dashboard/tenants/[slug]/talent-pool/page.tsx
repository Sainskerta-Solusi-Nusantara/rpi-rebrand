import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Users, Search, Lock } from 'lucide-react'
import { AuditAction } from '@prisma/client'
import { requireAuth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'
import { prisma } from '@/lib/db'
import {
  searchCandidates,
  type SearchCandidatesParams,
} from '@/lib/talent-pool/queries'
import { TalentPoolCard } from '@/components/organisms/talent-pool-card'
import { SKILLS } from '@/lib/skills/taxonomy'
import { normalizeSkill } from '@/lib/skills/search'

export const metadata = { title: 'Talent Pool — Dasbor' }

const PAGE_SIZE = 20
const MAX_SKILL_FILTERS = 6

function readParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

function parseSkillsParam(raw: string | undefined): string[] {
  if (!raw) return []
  return raw
    .split(',')
    .map((s) => normalizeSkill(s.trim()))
    .filter(Boolean)
    .slice(0, MAX_SKILL_FILTERS)
}

function buildHref(
  base: string,
  overrides: Record<string, string | undefined>,
): string {
  const usp = new URLSearchParams()
  for (const [k, v] of Object.entries(overrides)) {
    if (v) usp.set(k, v)
  }
  const qs = usp.toString()
  return qs ? `${base}?${qs}` : base
}

export default async function TalentPoolPage({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams: Record<string, string | string[] | undefined>
}) {
  const session = await requireAuth(
    `/dashboard/tenants/${params.slug}/talent-pool`,
  )

  const tenant = await prisma.tenant
    .findUnique({
      where: { slug: params.slug },
      select: { id: true, slug: true, name: true },
    })
    .catch(() => null)
  if (!tenant) notFound()

  const { globalRole, tenants } = session.user
  if (!hasTenantPermission(globalRole, tenants, tenant.id, 'job.view')) {
    notFound()
  }

  // -- Parse search params -------------------------------------------------
  const q = readParam(searchParams.q)?.trim() || undefined
  const skillsRaw = readParam(searchParams.skills)
  const skills = parseSkillsParam(skillsRaw)
  const location = readParam(searchParams.location)?.trim() || undefined
  const expMinRaw = readParam(searchParams.expMin)
  const expMaxRaw = readParam(searchParams.expMax)
  const experienceMin = expMinRaw && Number.isFinite(Number(expMinRaw))
    ? Math.max(0, Math.min(60, Number(expMinRaw)))
    : undefined
  const experienceMax = expMaxRaw && Number.isFinite(Number(expMaxRaw))
    ? Math.max(0, Math.min(60, Number(expMaxRaw)))
    : undefined
  const hasResume =
    readParam(searchParams.hasResume) === '1' ? true : undefined
  const pageRaw = readParam(searchParams.page)
  const page = pageRaw && Number.isFinite(Number(pageRaw))
    ? Math.max(1, Math.floor(Number(pageRaw)))
    : 1

  const searchParamsForQuery: SearchCandidatesParams = {
    tenantId: tenant.id,
    callerGlobalRole: globalRole,
    callerMemberships: tenants,
    query: q,
    skills,
    location,
    experienceMin,
    experienceMax,
    hasResume,
    page,
    pageSize: PAGE_SIZE,
  }

  const { items, total, forbidden } = await searchCandidates(
    searchParamsForQuery,
  )

  if (forbidden) notFound()

  // -- Lightweight search audit (best-effort, fire-and-forget) -------------
  // We log non-empty searches so admins can audit recruiter usage. Failures
  // are swallowed since the page should still render.
  if (q || skills.length > 0 || location || experienceMin || experienceMax) {
    prisma.auditLog
      .create({
        data: {
          tenantId: tenant.id,
          userId: session.user.id,
          action: AuditAction.CREATE,
          resource: 'talent_pool.search',
          resourceId: null,
          metadata: {
            q: q ?? null,
            skills,
            location: location ?? null,
            experienceMin: experienceMin ?? null,
            experienceMax: experienceMax ?? null,
            hasResume: hasResume ?? null,
            resultCount: total,
          },
        },
      })
      .catch((err) => {
        console.error('[talent-pool] audit log failed', err)
      })
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const baseHref = `/dashboard/tenants/${tenant.slug}/talent-pool`
  const currentParams: Record<string, string | undefined> = {
    q,
    skills: skills.length > 0 ? skills.join(',') : undefined,
    location,
    expMin: experienceMin !== undefined ? String(experienceMin) : undefined,
    expMax: experienceMax !== undefined ? String(experienceMax) : undefined,
    hasResume: hasResume ? '1' : undefined,
  }

  // Top-30 skills suggestion list for the datalist (full taxonomy is large).
  const skillSuggestions = SKILLS.slice(0, 60)

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div>
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={`/dashboard/tenants/${tenant.slug}` as any}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke {tenant.name}
        </Link>
      </div>

      <header>
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6" aria-hidden="true" />
          <h1 className="font-heading text-2xl md:text-3xl">Talent Pool</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          Cari kandidat yang membuka profil mereka untuk dilihat perekrut.
        </p>
      </header>

      <div
        role="note"
        className="border-border bg-muted/40 flex items-start gap-2 rounded-2xl border p-4 text-sm"
      >
        <Lock
          className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0"
          aria-hidden="true"
        />
        <p className="text-muted-foreground">
          Hanya kandidat yang mempublikasikan profil mereka yang muncul di sini.
          Email dan nomor telepon tidak pernah ditampilkan untuk menjaga
          privasi kandidat.
        </p>
      </div>

      <form
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        action={baseHref as any}
        className="border-border bg-card grid grid-cols-1 gap-3 rounded-2xl border p-4 sm:grid-cols-6"
      >
        <div className="space-y-1 sm:col-span-3">
          <label htmlFor="f-q" className="text-muted-foreground text-xs uppercase">
            Kata kunci
          </label>
          <input
            id="f-q"
            name="q"
            type="text"
            defaultValue={q ?? ''}
            placeholder="contoh: backend, product designer"
            className="border-border bg-background block w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1 sm:col-span-3">
          <label
            htmlFor="f-skills"
            className="text-muted-foreground text-xs uppercase"
          >
            Keahlian (pisahkan dengan koma, maks {MAX_SKILL_FILTERS})
          </label>
          <input
            id="f-skills"
            name="skills"
            type="text"
            defaultValue={skills.join(', ')}
            list="skill-suggestions"
            placeholder="react, typescript"
            className="border-border bg-background block w-full rounded-md border px-3 py-2 text-sm"
          />
          <datalist id="skill-suggestions">
            {skillSuggestions.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
        <div className="space-y-1 sm:col-span-2">
          <label
            htmlFor="f-location"
            className="text-muted-foreground text-xs uppercase"
          >
            Lokasi
          </label>
          <input
            id="f-location"
            name="location"
            type="text"
            defaultValue={location ?? ''}
            placeholder="Jakarta, Bandung, Remote"
            className="border-border bg-background block w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label
            htmlFor="f-expMin"
            className="text-muted-foreground text-xs uppercase"
          >
            Min tahun
          </label>
          <input
            id="f-expMin"
            name="expMin"
            type="number"
            min={0}
            max={60}
            defaultValue={experienceMin ?? ''}
            className="border-border bg-background block w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label
            htmlFor="f-expMax"
            className="text-muted-foreground text-xs uppercase"
          >
            Maks tahun
          </label>
          <input
            id="f-expMax"
            name="expMax"
            type="number"
            min={0}
            max={60}
            defaultValue={experienceMax ?? ''}
            className="border-border bg-background block w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-end gap-3 sm:col-span-2">
          <label className="text-foreground inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="hasResume"
              value="1"
              defaultChecked={hasResume === true}
              className="border-border h-4 w-4 rounded border"
            />
            Hanya yang punya CV
          </label>
        </div>
        <div className="flex items-end gap-2 sm:col-span-6">
          <button
            type="submit"
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            Cari kandidat
          </button>
          {(q || skills.length > 0 || location || experienceMin || experienceMax || hasResume) && (
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={baseHref as any}
              className="text-muted-foreground hover:text-foreground text-sm font-medium"
            >
              Reset
            </Link>
          )}
        </div>
      </form>

      <section>
        <p className="text-muted-foreground mb-3 text-sm">
          {total.toLocaleString('id-ID')} kandidat publik cocok dengan kriteria
          Anda.
        </p>
        {items.length === 0 ? (
          <div className="border-border bg-card text-muted-foreground rounded-2xl border p-10 text-center text-sm">
            Tidak ada kandidat yang cocok. Coba kurangi filter atau ganti kata
            kunci.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((c) => (
              <TalentPoolCard
                key={c.userId}
                candidate={c}
                tenantSlug={tenant.slug}
              />
            ))}
          </div>
        )}
      </section>

      <nav
        aria-label="Pagination"
        className="flex flex-wrap items-center justify-between gap-3 text-sm"
      >
        <p className="text-muted-foreground">
          Halaman {page} dari {totalPages}
        </p>
        <div className="flex gap-2">
          {page > 1 && (
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={
                buildHref(baseHref, {
                  ...currentParams,
                  page: String(page - 1),
                }) as any
              }
              className="border-border bg-background hover:bg-muted rounded-md border px-3 py-1.5"
            >
              ← Sebelumnya
            </Link>
          )}
          {page < totalPages && (
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={
                buildHref(baseHref, {
                  ...currentParams,
                  page: String(page + 1),
                }) as any
              }
              className="border-border bg-background hover:bg-muted rounded-md border px-3 py-1.5"
            >
              Selanjutnya →
            </Link>
          )}
        </div>
      </nav>
    </div>
  )
}
