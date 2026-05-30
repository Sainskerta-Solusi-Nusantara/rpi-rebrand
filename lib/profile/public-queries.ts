import { cache } from 'react'
import { prisma } from '@/lib/db'
import { env } from '@/lib/env'

// ---------------------------------------------------------------------------
// Types — must match (subset of) Resume.content schema in lib/resumes/actions.ts
// ---------------------------------------------------------------------------

export type PublicResumeExperience = {
  title: string
  company: string
  location?: string
  startDate: string
  endDate?: string
  current?: boolean
  description?: string
}

export type PublicResumeEducation = {
  school: string
  degree?: string
  field?: string
  startDate: string
  endDate?: string
  description?: string
}

export type PublicResume = {
  summary: string | null
  experiences: PublicResumeExperience[]
  educations: PublicResumeEducation[]
  skills: string[]
  languages: string[]
}

export type PublicCertificate = {
  title: string
  issuer: string
  issuedAt: Date
  courseTitle: string | null
}

export type PublicProfileData = {
  id: string
  displayName: string
  headline: string | null
  location: string | null
  bio: string | null
  image: string | null
  resume: PublicResume | null
  certificates: PublicCertificate[]
  updatedAt: Date
  /** Canonical share URL: /profil/<username|id>, absolute when env configured */
  shareUrl: string
}

// ---------------------------------------------------------------------------
// Sanitization
// ---------------------------------------------------------------------------

// Basic — we redact (not strip) so the surrounding sentence still scans.
// Detects standard emails and 7-15 digit phone runs (with optional + and
// separators). Intentionally conservative to avoid mangling legitimate copy.
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g
const PHONE_RE = /(?:(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{3,4})/g

/**
 * Strip email/phone-like patterns from user-controlled text so candidate
 * contact info doesn't leak via bio/summary/description even if the user
 * accidentally pasted it. We REDACT (replace with a placeholder) rather than
 * delete to keep prose readable; the page renders the result via React, which
 * already escapes HTML.
 */
export function sanitizePublicText(input: string | null | undefined): string | null {
  if (!input) return null
  const cleaned = input
    .replace(EMAIL_RE, '[email disembunyikan]')
    // Phone redaction: only apply to runs that look phone-like (>=7 digits total).
    .replace(PHONE_RE, (m) => {
      const digits = m.replace(/\D/g, '')
      if (digits.length >= 7 && digits.length <= 15) return '[nomor disembunyikan]'
      return m
    })
  return cleaned
}

function sanitizeOrUndefined(s: string | undefined | null): string | undefined {
  const out = sanitizePublicText(s ?? undefined)
  return out ?? undefined
}

// ---------------------------------------------------------------------------
// Resume content shape parser
// ---------------------------------------------------------------------------

function asString(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined
}
function asBool(v: unknown): boolean | undefined {
  return typeof v === 'boolean' ? v : undefined
}
function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.filter((x): x is string => typeof x === 'string' && x.length > 0)
}

function parseResumeContent(raw: unknown): PublicResume | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>

  const summaryRaw = asString(obj.summary) ?? null
  const summary = summaryRaw ? sanitizePublicText(summaryRaw) : null

  const experiences: PublicResumeExperience[] = []
  if (Array.isArray(obj.experiences)) {
    for (const e of obj.experiences) {
      if (!e || typeof e !== 'object') continue
      const x = e as Record<string, unknown>
      const title = asString(x.title)
      const company = asString(x.company)
      const startDate = asString(x.startDate)
      if (!title || !company || !startDate) continue
      experiences.push({
        title,
        company,
        location: sanitizeOrUndefined(asString(x.location)),
        startDate,
        endDate: asString(x.endDate),
        current: asBool(x.current),
        description: sanitizeOrUndefined(asString(x.description)),
      })
    }
  }

  const educations: PublicResumeEducation[] = []
  if (Array.isArray(obj.educations)) {
    for (const e of obj.educations) {
      if (!e || typeof e !== 'object') continue
      const x = e as Record<string, unknown>
      const school = asString(x.school)
      const startDate = asString(x.startDate)
      if (!school || !startDate) continue
      educations.push({
        school,
        degree: asString(x.degree),
        field: asString(x.field),
        startDate,
        endDate: asString(x.endDate),
        description: sanitizeOrUndefined(asString(x.description)),
      })
    }
  }

  const skills = asStringArray(obj.skills)
  const languages = asStringArray(obj.languages)

  // If nothing meaningful is present, return null so callers can hide the
  // resume section entirely instead of showing an empty shell.
  if (
    !summary &&
    experiences.length === 0 &&
    educations.length === 0 &&
    skills.length === 0 &&
    languages.length === 0
  ) {
    return null
  }

  return { summary, experiences, educations, skills, languages }
}

// ---------------------------------------------------------------------------
// findPublicProfile
// ---------------------------------------------------------------------------

const CUID_RE = /^c[a-z0-9]{20,}$/i

function buildShareUrl(handle: string): string {
  const path = `/profil/${handle}`
  try {
    // Prefer NEXT_PUBLIC_APP_URL — fall back to relative path.
    const base = env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
    if (base) return `${base}${path}`
  } catch {
    // env access can throw at import time in edge contexts; ignore.
  }
  return path
}

function deriveDisplayName(name: string | null, email: string): string {
  if (name && name.trim()) return name.trim()
  const local = email.split('@')[0] ?? email
  return local
}

/**
 * Look up a public candidate profile by username (preferred) OR cuid id.
 *
 * Returns null when:
 *   - no user matches the handle
 *   - the user is not ACTIVE
 *   - the user has not opted in (profilePublic === false)
 *
 * Email and phone are NEVER included in the returned snapshot, by design.
 */
export const findPublicProfile = cache(
  async (handle: string): Promise<PublicProfileData | null> => {
    const trimmed = handle?.trim()
    if (!trimmed) return null

    // 1) Resolve user — try lowercase username first, fall back to id.
    const lowered = trimmed.toLowerCase()
    let user = await prisma.user
      .findUnique({
        where: { username: lowered },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          bio: true,
          headline: true,
          location: true,
          status: true,
          profilePublic: true,
          username: true,
          updatedAt: true,
        },
      })
      .catch(() => null)

    if (!user && CUID_RE.test(trimmed)) {
      user = await prisma.user
        .findUnique({
          where: { id: trimmed },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            bio: true,
            headline: true,
            location: true,
            status: true,
            profilePublic: true,
            username: true,
            updatedAt: true,
          },
        })
        .catch(() => null)
    }

    if (!user) return null

    // Privacy gate — public visibility + active account required.
    if (!user.profilePublic) return null
    if (user.status !== 'ACTIVE') return null

    // 2) Fetch primary resume content (fall back to most recent).
    const resumeRow = await prisma.resume
      .findFirst({
        where: { userId: user.id },
        orderBy: [{ isPrimary: 'desc' }, { updatedAt: 'desc' }],
        select: { content: true },
      })
      .catch(() => null)

    const resume = resumeRow ? parseResumeContent(resumeRow.content) : null

    // 3) Last 10 certificates with course title.
    const certificateRows = await prisma.certificate
      .findMany({
        where: { userId: user.id },
        orderBy: { issuedAt: 'desc' },
        take: 10,
        select: {
          title: true,
          issuer: true,
          issuedAt: true,
          course: { select: { title: true } },
        },
      })
      .catch(() => [])

    const certificates: PublicCertificate[] = certificateRows.map((c) => ({
      title: c.title,
      issuer: c.issuer,
      issuedAt: c.issuedAt,
      courseTitle: c.course?.title ?? null,
    }))

    const canonicalHandle = user.username ?? user.id

    return {
      id: user.id,
      displayName: deriveDisplayName(user.name, user.email),
      headline: user.headline,
      location: user.location,
      bio: sanitizePublicText(user.bio),
      image: user.image,
      resume,
      certificates,
      updatedAt: user.updatedAt,
      shareUrl: buildShareUrl(canonicalHandle),
    }
  },
)
