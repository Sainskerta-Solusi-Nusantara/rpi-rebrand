import { describe, it, expect } from 'vitest'
import { analyzeResume, type Suggestion } from './analyzer'

function byId(suggestions: Suggestion[], id: string): Suggestion | undefined {
  return suggestions.find((s) => s.id === id)
}

describe('analyzeResume — empty resume', () => {
  const r = analyzeResume({})

  it('scores low and emits high-severity completeness gaps', () => {
    expect(r.score).toBeLessThan(50)
    expect(byId(r.suggestions, 'no-skills')).toBeDefined()
    expect(byId(r.suggestions, 'summary-missing')).toBeDefined()
    expect(byId(r.suggestions, 'few-experiences')).toBeDefined()
  })

  it('returns a breakdown row per category plus the synthetic summary row', () => {
    const categories = r.breakdown.map((b) => b.category)
    expect(categories).toContain('skills')
    expect(categories).toContain('contact')
    // Each row stays within [0, max].
    for (const b of r.breakdown) {
      expect(b.score).toBeGreaterThanOrEqual(0)
      expect(b.score).toBeLessThanOrEqual(b.max)
    }
  })
})

describe('analyzeResume — auto-fixable suggestions', () => {
  it('offers a trim-summary auto-fix for an over-long summary', () => {
    const r = analyzeResume({ summary: 'a'.repeat(700) })
    const s = byId(r.suggestions, 'summary-too-long')
    expect(s).toBeDefined()
    expect(s?.autoFix?.kind).toBe('trim-summary')
  })

  it('suggests adding a tech to skills when it appears only in experience', () => {
    const r = analyzeResume({
      summary: 'Engineer yang membangun aplikasi.',
      skills: ['communication'],
      experiences: [
        { title: 'Engineer', description: 'Membangun layanan dengan React dan Node.' },
      ],
    })
    expect(byId(r.suggestions, 'add-skill-react')).toBeDefined()
  })
})

describe('analyzeResume — a fuller resume scores higher than an empty one', () => {
  it('rewards completeness', () => {
    const empty = analyzeResume({})
    const filled = analyzeResume({
      name: 'CV Backend Engineer',
      summary:
        'Backend engineer dengan 5 tahun pengalaman membangun API yang meningkatkan konversi 30%.',
      skills: ['Node', 'PostgreSQL', 'Docker', 'TypeScript', 'AWS'],
      experiences: [
        {
          title: 'Senior Backend Engineer',
          company: 'Acme',
          description: 'Meluncurkan layanan baru yang menambah pendapatan 25%.',
          startDate: 'Jan 2020',
          current: true,
        },
        {
          title: 'Backend Engineer',
          company: 'Beta',
          description: 'Mengurangi latensi API sebesar 40%.',
          startDate: 'Jan 2018',
          endDate: 'Dec 2019',
        },
      ],
      educations: [{ school: 'ITB', degree: 'S1', field: 'Informatika' }],
      email: 'kandidat@example.com',
      phone: '+6281234567890',
      links: ['https://linkedin.com/in/kandidat'],
    })
    expect(filled.score).toBeGreaterThan(empty.score)
  })
})
