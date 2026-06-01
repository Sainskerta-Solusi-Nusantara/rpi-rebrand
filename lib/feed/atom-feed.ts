/**
 * Generic Atom 1.0 (RFC 4287) feed for published jobs.
 *
 * Usable by any standard RSS / Atom reader. Each <entry> exposes:
 *   <id>       canonical absolute URL of the job detail page
 *   <title>    job.title
 *   <updated>  job.updatedAt or publishedAt
 *   <published> job.publishedAt
 *   <author>   tenant name
 *   <link>     absolute href to the job detail page
 *   <content type="html">  description HTML (CDATA)
 *   <category> tags / category slug
 */

import type { FeedJob } from './feed-queries'
import { cdata, el, escapeXml, textEl } from './xml-builder'

function entry(job: FeedJob, baseUrl: string): string {
  const link = `${baseUrl}/jobs/${job.slug}`
  const updated = (job.updatedAt ?? job.publishedAt).toISOString()
  const published = job.publishedAt.toISOString()

  const tagsXml = job.tags
    .map((t) => el('category', { term: t }, undefined))
    .join('')
  const catXml = job.category
    ? el('category', { term: job.category.slug, label: job.category.name }, undefined)
    : ''

  const author = el(
    'author',
    undefined,
    [textEl('name', job.tenant.name)].join(''),
  )

  const inner = [
    textEl('id', link),
    textEl('title', job.title),
    textEl('updated', updated),
    textEl('published', published),
    author,
    el('link', { rel: 'alternate', type: 'text/html', href: link }, undefined),
    textEl('summary', job.location),
    el('content', { type: 'html' }, cdata(job.description)),
    tagsXml,
    catXml,
  ].join('')

  return el('entry', undefined, inner)
}

export function buildAtomFeed(
  jobs: FeedJob[],
  baseUrl: string,
  feedTitle: string,
  opts: { selfHref?: string; alternateHref?: string } = {},
): string {
  const updated = (jobs[0]?.updatedAt ?? jobs[0]?.publishedAt ?? new Date()).toISOString()
  const selfHref = opts.selfHref ?? `${baseUrl}/jobs/feed.xml?format=atom`
  const alternateHref = opts.alternateHref ?? `${baseUrl}/jobs`
  const feedId = selfHref

  const entriesXml = jobs.map((j) => entry(j, baseUrl)).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="id-ID">
  <id>${escapeXml(feedId)}</id>
  <title>${escapeXml(feedTitle)}</title>
  <updated>${escapeXml(updated)}</updated>
  <link rel="self" type="application/atom+xml" href="${escapeXml(selfHref)}" />
  <link rel="alternate" type="text/html" href="${escapeXml(alternateHref)}" />
  <generator uri="${escapeXml(baseUrl)}">Rumah Pekerja Indonesia</generator>
${entriesXml}
</feed>
`
}
