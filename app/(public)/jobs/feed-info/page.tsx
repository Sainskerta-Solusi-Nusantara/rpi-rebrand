import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Rss, FileCode, Linkedin, Globe } from 'lucide-react'
import { FeedUrlBlock } from '@/components/organisms/feed-url-block'
import { getServerT } from '@/lib/i18n/server-dictionary'

export const metadata: Metadata = {
  title: 'Feed XML lowongan — Sindikasi',
  description:
    'Feed XML publik RPI untuk LinkedIn Jobs, Indeed, dan generic Atom — siap dikonsumsi mitra ATS dan agregator lowongan.',
  alternates: { canonical: '/jobs/feed-info' },
}

const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://rumahpekerja.id').replace(
  /\/+$/,
  '',
)

const FORMAT_KEYS = ['atom', 'linkedin', 'indeed'] as const
const FORMAT_ICONS = {
  atom: Rss,
  linkedin: Linkedin,
  indeed: FileCode,
} as const

export default async function FeedInfoPage() {
  const t = await getServerT()
  const tf = t.public.feedInfo
  const formats = FORMAT_KEYS.map((key) => ({
    key,
    label: tf.formats[key].label,
    icon: FORMAT_ICONS[key],
    description: tf.formats[key].description,
    url: `${BASE_URL}/jobs/feed.xml?format=${key}`,
  }))

  return (
    <main className="mx-auto max-w-3xl space-y-10 px-4 py-12">
      <div>
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={'/jobs' as any}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {tf.backToJobs}
        </Link>
      </div>

      <header className="space-y-3">
        <div className="bg-muted inline-flex size-12 items-center justify-center rounded-xl">
          <Rss className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="font-heading text-3xl md:text-4xl">{tf.title}</h1>
        <p className="text-muted-foreground text-base">
          {tf.intro}
        </p>
      </header>

      <section className="space-y-5" aria-labelledby="feeds-publik">
        <h2 id="feeds-publik" className="font-heading text-2xl">
          {tf.publicFeeds.title}
        </h2>
        <p className="text-muted-foreground text-sm">
          {tf.publicFeeds.body}
        </p>

        <div className="space-y-5">
          {formats.map((f) => {
            const Icon = f.icon
            return (
              <article
                key={f.key}
                className="border-border bg-card space-y-3 rounded-2xl border p-5"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-muted grid size-9 place-items-center rounded-md">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg">{f.label}</h3>
                    <p className="text-muted-foreground text-xs">
                      {f.description}
                    </p>
                  </div>
                </div>
                <FeedUrlBlock url={f.url} />
              </article>
            )
          })}
        </div>
      </section>

      <section className="space-y-3" aria-labelledby="feed-tenant">
        <h2 id="feed-tenant" className="font-heading text-2xl">
          {tf.tenantFeed.title}
        </h2>
        <p className="text-muted-foreground text-sm">
          {tf.tenantFeed.body} <code className="font-mono">?tenant={'{slug}'}</code>{' '}
          {tf.tenantFeed.bodyTail}
        </p>
        <FeedUrlBlock
          url={`${BASE_URL}/jobs/feed.xml?format=atom&tenant=tenant-anda`}
          description={tf.tenantFeed.replaceHint}
        />
        <p className="text-muted-foreground text-xs">
          {tf.tenantFeed.notFound}
        </p>
      </section>

      <section className="space-y-3" aria-labelledby="untuk-ats">
        <h2 id="untuk-ats" className="font-heading text-2xl">
          {tf.forAts.title}
        </h2>
        <p className="text-muted-foreground text-sm">
          {tf.forAts.body} <code className="font-mono">Content-Type: application/xml; charset=utf-8</code>{' '}
          {tf.forAts.bodyMid} <code className="font-mono">Cache-Control: public, s-maxage=600, stale-while-revalidate=1800</code>.
        </p>
        <pre className="border-border bg-muted/40 overflow-x-auto rounded-md border p-3 text-xs">
{`# Generic Atom (default)
curl -sSL "${BASE_URL}/jobs/feed.xml" -o jobs.atom.xml

# LinkedIn Jobs XML
curl -sSL "${BASE_URL}/jobs/feed.xml?format=linkedin" -o jobs.linkedin.xml

# Indeed XML
curl -sSL "${BASE_URL}/jobs/feed.xml?format=indeed" -o jobs.indeed.xml

# Tenant-specific (contoh slug "acme")
curl -sSL "${BASE_URL}/jobs/feed.xml?format=atom&tenant=acme" -o jobs.acme.atom.xml`}
        </pre>
      </section>

      <section className="space-y-3" aria-labelledby="jadwal-refresh">
        <h2 id="jadwal-refresh" className="font-heading text-2xl">
          {tf.refreshSchedule.title}
        </h2>
        <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
          {tf.refreshSchedule.items.map((item, idx) => (
            <li key={idx} dangerouslySetInnerHTML={{ __html: item }} />
          ))}
        </ul>
      </section>

      <section
        className="border-border bg-muted/30 space-y-2 rounded-2xl border p-5"
        aria-labelledby="bantuan"
      >
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4" aria-hidden="true" />
          <h2 id="bantuan" className="font-heading text-lg">
            {tf.help.title}
          </h2>
        </div>
        <p className="text-muted-foreground text-sm">
          {tf.help.body}
        </p>
      </section>
    </main>
  )
}
