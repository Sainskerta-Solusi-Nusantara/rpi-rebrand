/**
 * Indeed XML feed builder.
 *
 * Schema reference: https://docs.indeed.com/posting-jobs/xml-feed
 *
 * Top-level: <source> containing <publisher>, <publisherurl>, <lastBuildDate>
 * and any number of <job> children. Most per-job fields are optional — we
 * emit them when we have data.
 */

import type { FeedJob } from './feed-queries'
import { cdata, el, escapeXml, textEl } from './xml-builder'

const EMPLOYMENT_MAP: Record<FeedJob['employmentType'], string> = {
  FULL_TIME: 'fulltime',
  PART_TIME: 'parttime',
  CONTRACT: 'contract',
  INTERNSHIP: 'internship',
  FREELANCE: 'contract',
}

const EXPERIENCE_MAP: Record<FeedJob['experienceLevel'], string> = {
  ENTRY: 'Entry level',
  JUNIOR: 'Junior',
  MID: 'Mid level',
  SENIOR: 'Senior',
  LEAD: 'Lead',
  EXECUTIVE: 'Executive',
}

function rfc822(d: Date): string {
  return d.toUTCString()
}

function splitLocation(location: string): { city: string; state: string } {
  const parts = location.split(/[,/]/).map((s) => s.trim()).filter(Boolean)
  return {
    city: parts[0] ?? location,
    state: parts[1] ?? '',
  }
}

function formatSalary(job: FeedJob): string {
  if (job.salaryMin == null && job.salaryMax == null) return ''
  const cur = job.salaryCurrency || 'IDR'
  const per = job.salaryPeriod || 'month'
  if (job.salaryMin != null && job.salaryMax != null) {
    return `${cur} ${job.salaryMin.toLocaleString('id-ID')} - ${cur} ${job.salaryMax.toLocaleString('id-ID')} per ${per}`
  }
  const one = job.salaryMin ?? job.salaryMax!
  return `${cur} ${one.toLocaleString('id-ID')} per ${per}`
}

function jobDescriptionHtml(job: FeedJob): string {
  const parts: string[] = [`<div>${job.description}</div>`]
  if (job.responsibilities && job.responsibilities.trim().length > 0) {
    parts.push(`<h3>Tanggung jawab</h3>${job.responsibilities}`)
  }
  if (job.requirements && job.requirements.trim().length > 0) {
    parts.push(`<h3>Kualifikasi</h3>${job.requirements}`)
  }
  if (job.benefits && job.benefits.trim().length > 0) {
    parts.push(`<h3>Benefit</h3>${job.benefits}`)
  }
  return parts.join('\n')
}

function buildJobElement(job: FeedJob, baseUrl: string): string {
  const url = `${baseUrl}/jobs/${job.slug}`
  const { city, state } = splitLocation(job.location)
  const salary = formatSalary(job)

  const inner = [
    textEl('title', job.title),
    textEl('date', rfc822(job.publishedAt)),
    textEl('referencenumber', job.id),
    textEl('requisitionid', job.id),
    textEl('url', url),
    textEl('company', job.tenant.name),
    textEl('sourcename', 'Rumah Pekerja Indonesia'),
    textEl('city', city),
    textEl('state', state),
    textEl('country', 'Indonesia'),
    textEl('postalcode', ''),
    el('description', undefined, cdata(jobDescriptionHtml(job))),
    salary ? textEl('salary', salary) : '',
    textEl('jobtype', EMPLOYMENT_MAP[job.employmentType] ?? 'fulltime'),
    job.category ? textEl('category', job.category.name) : '',
    textEl('experience', EXPERIENCE_MAP[job.experienceLevel] ?? ''),
  ]
    .filter(Boolean)
    .join('')

  return el('job', undefined, inner)
}

export function buildIndeedXml(jobs: FeedJob[], baseUrl: string): string {
  const lastBuildDate = rfc822(jobs[0]?.publishedAt ?? new Date())
  const jobsXml = jobs.map((j) => buildJobElement(j, baseUrl)).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<source>
  <publisher>${escapeXml('Rumah Pekerja Indonesia')}</publisher>
  <publisherurl>${escapeXml(baseUrl)}</publisherurl>
  <lastBuildDate>${escapeXml(lastBuildDate)}</lastBuildDate>
${jobsXml}
</source>
`
}
