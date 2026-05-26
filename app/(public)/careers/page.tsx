import type { Metadata } from 'next'
import { CTABanner } from '@/components/organisms/cta-banner'
import {
  CareersHero,
  CareersWhy,
  CareersLife,
  CareersTeams,
  CareersOpenings,
  CareersProcess,
} from '@/components/organisms/careers-sections'
import {
  CAREER_OPENINGS,
  type CareerOpening,
  filterOpenings,
  getCareerLevels,
  getCareerTeams,
  getCareerTypes,
} from '@/lib/careers-data'

export const metadata: Metadata = {
  title: 'Karier di RPI',
  description:
    'Bergabung dengan tim Rumah Pekerja Indonesia. Bangun produk yang mempertemukan jutaan pencari kerja dengan perusahaan terverifikasi di seluruh Indonesia.',
}

const VALID_TYPES: CareerOpening['type'][] = ['Full-time', 'Part-time', 'Contract', 'Internship']
const VALID_LEVELS: CareerOpening['level'][] = ['Junior', 'Mid', 'Senior', 'Staff', 'Lead']

function parseMulti(v: string | string[] | undefined): string[] {
  if (!v) return []
  if (Array.isArray(v)) return v.flatMap((x) => x.split(',')).filter(Boolean)
  return v.split(',').filter(Boolean)
}

type CareersState = {
  team?: string
  types: CareerOpening['type'][]
  levels: CareerOpening['level'][]
  q?: string
}

function buildCareersUrl(
  current: CareersState,
  patch: Partial<{
    team: string | null
    types: CareerOpening['type'][]
    levels: CareerOpening['level'][]
    q: string | null
  }>,
): string {
  const next = {
    team: 'team' in patch ? patch.team ?? undefined : current.team,
    types: patch.types ?? current.types,
    levels: patch.levels ?? current.levels,
    q: 'q' in patch ? patch.q ?? undefined : current.q,
  }
  const params: string[] = []
  if (next.q) params.push(`q=${encodeURIComponent(next.q)}`)
  if (next.team) params.push(`team=${encodeURIComponent(next.team)}`)
  if (next.types.length) params.push(`type=${next.types.join(',')}`)
  if (next.levels.length) params.push(`level=${next.levels.join(',')}`)
  const tail = params.length ? `/careers?${params.join('&')}` : '/careers'
  return `${tail}#openings`
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

export default function CareersPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const activeTeam =
    typeof searchParams.team === 'string' ? searchParams.team : undefined
  const activeTypes = parseMulti(searchParams.type).filter(
    (t): t is CareerOpening['type'] => (VALID_TYPES as string[]).includes(t),
  )
  const activeLevels = parseMulti(searchParams.level).filter(
    (l): l is CareerOpening['level'] => (VALID_LEVELS as string[]).includes(l),
  )
  const activeQuery =
    typeof searchParams.q === 'string' ? searchParams.q.trim() : ''

  const current: CareersState = {
    team: activeTeam,
    types: activeTypes,
    levels: activeLevels,
    q: activeQuery || undefined,
  }
  const hasAnyFilter =
    !!activeTeam ||
    activeTypes.length > 0 ||
    activeLevels.length > 0 ||
    !!activeQuery

  const openings = filterOpenings({
    team: activeTeam,
    types: activeTypes,
    levels: activeLevels,
    q: activeQuery || undefined,
  })

  // Pre-build URL strings on the server so the (client) CareersOpenings
  // component receives plain serializable props only.
  const teams = getCareerTeams().map((t) => ({
    ...t,
    href: buildCareersUrl(current, {
      team: activeTeam === t.name ? null : t.name,
    }),
  }))
  const types = getCareerTypes().map((t) => ({
    ...t,
    href: buildCareersUrl(current, { types: toggle(activeTypes, t.value) }),
  }))
  const levels = getCareerLevels().map((l) => ({
    ...l,
    href: buildCareersUrl(current, { levels: toggle(activeLevels, l.value) }),
  }))
  const allTeamsHref = buildCareersUrl(current, { team: null })

  return (
    <>
      <CareersHero />
      <CareersWhy />
      <CareersLife />
      <CareersTeams />
      <CareersOpenings
        openings={openings}
        totalCount={CAREER_OPENINGS.length}
        activeTeam={activeTeam}
        activeTypes={activeTypes}
        activeLevels={activeLevels}
        activeQuery={activeQuery || undefined}
        teams={teams}
        types={types}
        levels={levels}
        allTeamsHref={allTeamsHref}
        clearAllHref="/careers#openings"
        hasAnyFilter={hasAnyFilter}
      />
      <CareersProcess />
      <CTABanner />
    </>
  )
}
