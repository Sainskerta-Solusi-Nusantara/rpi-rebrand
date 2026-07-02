/**
 * LinkedIn Jobs XML feed builder.
 *
 * Schema follows the LinkedIn Talent / Limited Listings XML spec:
 *   https://learn.microsoft.com/en-us/linkedin/talent/job-postings/xml-feed
 *
 * Top-level: <source> with one <publisher>, <publisherurl>, <lastBuildDate>
 * and any number of <job> children.
 *
 * Per-job we emit:
 *   <partnerJobId>          stable internal id (Prisma cuid)
 *   <company>               tenant display name (LinkedIn historically uses
 *                           <company>; the older <companyName> is also accepted)
 *   <title>                 job.title
 *   <description>           HTML, wrapped in CDATA
 *   <location>              free-form location string
 *   <city>                  best-effort split of location (first segment)
 *   <country>               defaults to Indonesia (SSN is Indonesia-only)
 *   <jobtype>               mapped to LinkedIn job type vocabulary
 *   <workplaceTypes>        ON_SITE | REMOTE | HYBRID
 *   <listDate>              publishedAt (RFC3339)
 *   <expirationDate>        publishedAt + 60 days
 *   <applyUrl>              absolute URL to our public job detail page
 *
 * Salary range is optionally exposed via <salaries> so LinkedIn can display
 * a compensation badge.
 */

import type { FeedJob } from './feed-queries'
import { cdata, el, escapeXml, textEl } from './xml-builder'

const EMPLOYMENT_MAP: Record<FeedJob['employmentType'], string> = {
  FULL_TIME: 'FULL_TIME',
  PART_TIME: 'PART_TIME',
  CONTRACT: 'CONTRACTOR',
  INTERNSHIP: 'INTERNSHIP',
  FREELANCE: 'CONTRACTOR',
}

const WORKPLACE_MAP: Record<FeedJob['locationType'], string> = {
  ONSITE: 'ON_SITE',
  HYBRID: 'HYBRID',
  REMOTE: 'REMOTE',
}

const DAY_MS = 24 * 60 * 60 * 1000
const EXPIRY_DAYS = 60

function firstSegment(location: string): string {
  return (location.split(/[,/]/)[0] ?? location).trim()
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

function buildSalariesBlock(job: FeedJob): string {
  if (job.salaryMin == null && job.salaryMax == null) return ''
  const inner = [
    textEl('currency', job.salaryCurrency),
    textEl('period', job.salaryPeriod.toUpperCase()),
    textEl('minSalary', job.salaryMin ?? job.salaryMax ?? 0),
    textEl('maxSalary', job.salaryMax ?? job.salaryMin ?? 0),
  ].join('')
  return el('salary', undefined, inner)
}

function buildJobElement(job: FeedJob, baseUrl: string): string {
  const applyUrl = `${baseUrl}/jobs/${job.slug}`
  const listDate = job.publishedAt.toISOString()
  const expirationDate = new Date(job.publishedAt.getTime() + EXPIRY_DAYS * DAY_MS).toISOString()
  const city = firstSegment(job.location)

  const inner = [
    textEl('partnerJobId', job.id),
    textEl('company', job.tenant.name),
    textEl('companyName', job.tenant.name),
    textEl('title', job.title),
    el('description', undefined, cdata(jobDescriptionHtml(job))),
    textEl('location', job.location),
    textEl('city', city),
    textEl('country', 'Indonesia'),
    textEl('jobtype', EMPLOYMENT_MAP[job.employmentType] ?? 'OTHER'),
    textEl('workplaceTypes', WORKPLACE_MAP[job.locationType] ?? 'ON_SITE'),
    textEl('experienceLevel', job.experienceLevel),
    textEl('listDate', listDate),
    textEl('expirationDate', expirationDate),
    textEl('applyUrl', applyUrl),
    job.category ? textEl('industry', job.category.name) : '',
    buildSalariesBlock(job),
  ].join('')

  return el('job', undefined, inner)
}

export function buildLinkedInJobsXml(jobs: FeedJob[], baseUrl: string): string {
  const lastBuildDate = (jobs[0]?.publishedAt ?? new Date()).toUTCString()
  const jobsXml = jobs.map((j) => buildJobElement(j, baseUrl)).join('\n')

  const header = [
    `<publisher>${escapeXml('SSN Pekerja')}</publisher>`,
    `<publisherurl>${escapeXml(baseUrl)}</publisherurl>`,
    `<lastBuildDate>${escapeXml(lastBuildDate)}</lastBuildDate>`,
  ].join('\n  ')

  return `<?xml version="1.0" encoding="UTF-8"?>
<source>
  ${header}
${jobsXml}
</source>
`
}
