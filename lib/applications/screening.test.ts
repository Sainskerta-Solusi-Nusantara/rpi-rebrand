import { describe, it, expect } from 'vitest'
import { scoreApplication } from './screening'

// Deterministic recruiter-side screening heuristic (the AI path wraps this).

describe('scoreApplication — malformed input', () => {
  it('returns a zeroed "perlu-tinjauan" result rather than throwing', () => {
    const r = scoreApplication({
      application: null,
      job: null,
      user: null,
      primaryResume: null,
    })
    expect(r.score).toBe(0)
    expect(r.tags).toEqual(['perlu-tinjauan'])
    expect(r.matchedSkills).toEqual([])
  })
})

describe('scoreApplication — strong candidate', () => {
  const r = scoreApplication({
    application: {
      coverLetter:
        'Saya tertarik dengan posisi ini dan memiliki pengalaman relevan yang panjang.',
    },
    job: {
      title: 'Senior Backend Engineer',
      tags: ['node', 'postgres', 'react'],
      location: 'Jakarta',
      locationType: 'ONSITE',
      experienceLevel: 'SENIOR',
    },
    user: { headline: 'Senior Backend Engineer', location: 'Jakarta' },
    primaryResume: {
      fileUrl: 'https://example.com/cv.pdf',
      content: {
        summary: 'Backend engineer dengan 6 tahun pengalaman.',
        skills: ['Node', 'Postgres', 'React'],
        experiences: [
          { title: 'Senior Backend Engineer' },
          { title: 'Backend Engineer' },
          { title: 'Software Engineer' },
        ],
      },
    },
  })

  it('scores high and tags it match-tinggi', () => {
    expect(r.score).toBeGreaterThanOrEqual(75)
    expect(r.tags).toContain('match-tinggi')
  })

  it('surfaces skill, location, and completeness signals', () => {
    expect(r.matchedSkills).toEqual(
      expect.arrayContaining(['node', 'postgres', 'react']),
    )
    expect(r.tags).toContain('skill-cocok')
    expect(r.tags).toContain('lokasi-cocok')
    expect(r.tags).toContain('lengkap')
  })
})

describe('scoreApplication — signal tags', () => {
  it('tags "tidak-ada-cv" when the applicant has no resume row', () => {
    const r = scoreApplication({
      application: { coverLetter: null },
      job: {
        title: 'Data Analyst',
        tags: ['sql'],
        location: 'Bandung',
        locationType: 'ONSITE',
        experienceLevel: 'JUNIOR',
      },
      user: { headline: 'Fresh graduate', location: 'Surabaya' },
      primaryResume: null,
    })
    expect(r.tags).toContain('tidak-ada-cv')
  })

  it('tags "remote-friendly" for a remote job', () => {
    const r = scoreApplication({
      application: { coverLetter: null },
      job: {
        title: 'Data Analyst',
        tags: ['sql'],
        location: 'Bandung',
        locationType: 'REMOTE',
        experienceLevel: 'JUNIOR',
      },
      user: { headline: 'Analyst', location: 'Surabaya' },
      primaryResume: { fileUrl: null, content: { skills: ['sql'] } },
    })
    expect(r.tags).toContain('remote-friendly')
  })
})
