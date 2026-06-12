import { describe, it, expect } from 'vitest'
import { scoreApplicationToJob } from './match-scorer'

// Pure deterministic scorer — no DB, no LLM. We pin the contract (bands, tags,
// dimension maxima) rather than brittle exact totals where the rubric allows
// pro-rated points.

const strongJob = {
  title: 'Senior Backend Engineer',
  description:
    'Membangun API berskala besar dengan Node.js dan PostgreSQL di lingkungan Docker.',
  requirements: 'Minimal 5 tahun pengalaman. Menguasai Node.js, PostgreSQL, dan Docker.',
  employmentType: 'FULL_TIME' as const,
  experienceLevel: 'SENIOR' as const,
  location: 'Jakarta',
  locationType: 'ONSITE' as const,
  tags: ['node', 'postgres', 'docker'],
}

const strongResume = {
  fileUrl: null,
  content: {
    summary: 'Backend engineer berpengalaman membangun API Node.js dan PostgreSQL.',
    skills: ['Node', 'PostgreSQL', 'Docker'],
    experiences: [
      {
        title: 'Senior Backend Engineer',
        company: 'Acme',
        description: 'Node.js APIs',
        startDate: '2018-01-01',
        endDate: '2024-01-01',
        current: false,
      },
    ],
    educations: [{ degree: 'S1', field: 'Informatika', school: 'ITB' }],
  },
}

const strongUser = { headline: 'Senior Backend Engineer', location: 'Jakarta' }

describe('scoreApplicationToJob — malformed input', () => {
  it('returns a zeroed low_match result instead of throwing', () => {
    const r = scoreApplicationToJob(null, null)
    expect(r.score).toBe(0)
    expect(r.tags).toContain('low_match')
  })
})

describe('scoreApplicationToJob — strong candidate', () => {
  const r = scoreApplicationToJob(
    { coverLetter: null },
    strongJob,
    strongResume,
    strongUser,
  )

  it('keeps the score within [0,100]', () => {
    expect(r.score).toBeGreaterThanOrEqual(0)
    expect(r.score).toBeLessThanOrEqual(100)
  })

  it('awards full skills coverage when all required tech is present', () => {
    expect(r.breakdown.skillsCoverage.present).toEqual(
      expect.arrayContaining(['node', 'postgres', 'docker']),
    )
    expect(r.breakdown.skillsCoverage.score).toBe(r.breakdown.skillsCoverage.max)
  })

  it('awards full experience + location fit for a matching senior in-city candidate', () => {
    expect(r.breakdown.experienceFit.score).toBe(r.breakdown.experienceFit.max)
    expect(r.breakdown.locationFit.score).toBe(r.breakdown.locationFit.max)
  })

  it('lands in a positive match band (not weak/low)', () => {
    expect(r.score).toBeGreaterThanOrEqual(70)
    const band = r.tags.find((t) =>
      ['strong_match', 'partial_match', 'weak_match', 'low_match'].includes(t),
    )
    expect(['strong_match', 'partial_match']).toContain(band)
  })
})

describe('scoreApplicationToJob — signal tags', () => {
  it('flags a remote job', () => {
    const r = scoreApplicationToJob(
      { coverLetter: null },
      { ...strongJob, locationType: 'REMOTE' as const },
      strongResume,
      strongUser,
    )
    expect(r.tags).toContain('location_remote_ok')
    expect(r.breakdown.locationFit.score).toBe(r.breakdown.locationFit.max)
  })

  it('flags a skills gap when the candidate lacks the required stack', () => {
    const r = scoreApplicationToJob(
      { coverLetter: null },
      { ...strongJob, tags: ['react', 'vue', 'python', 'aws'] },
      { fileUrl: null, content: { skills: [], experiences: [] } },
      { headline: null, location: null },
    )
    expect(r.breakdown.skillsCoverage.missing.length).toBeGreaterThanOrEqual(3)
    expect(r.tags).toContain('skills_gap')
  })
})
