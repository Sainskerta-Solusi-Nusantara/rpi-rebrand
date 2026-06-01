import Link from 'next/link'
import { CalendarDays, ArrowUpRight } from 'lucide-react'
import type { ArticleListItem } from '@/lib/blog/queries'

const dateFmt = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

function formatPublishedAt(value: Date | null): string {
  if (!value) return ''
  try {
    return dateFmt.format(value)
  } catch {
    return ''
  }
}

/**
 * Server component preview card for a single Article. Renders the cover image
 * (or a coloured fallback derived from the slug), title, summary, up to three
 * tags, the author name, and the published date.
 *
 * The whole card is wrapped in a single `<Link>` to keep the click target
 * large while still surfacing a textual "Baca artikel" hint.
 */
export function ArticleCard({ article }: { article: ArticleListItem }) {
  const href = `/blog/${article.slug}`
  const author = article.author?.name ?? 'Tim RPI'
  const visibleTags = (article.tags ?? []).slice(0, 3)
  const published = formatPublishedAt(article.publishedAt ?? article.createdAt)

  return (
    <article className="group border-border bg-card hover:border-[color:var(--ring)] flex h-full flex-col overflow-hidden rounded-2xl border transition">
      <Link
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        href={href as any}
        className="flex h-full flex-col"
        aria-label={`Baca artikel: ${article.title}`}
      >
        <div className="bg-muted aspect-[16/9] w-full overflow-hidden">
          {article.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={article.coverImage}
              alt=""
              className="h-full w-full object-cover transition group-hover:scale-[1.02]"
              loading="lazy"
            />
          ) : (
            <div
              aria-hidden
              className="h-full w-full"
              style={{
                background:
                  'linear-gradient(135deg, color-mix(in oklab, var(--ring) 22%, transparent), color-mix(in oklab, var(--ring) 4%, transparent))',
              }}
            />
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3 p-5">
          {visibleTags.length > 0 && (
            <ul className="flex flex-wrap gap-1.5" aria-label="Tag artikel">
              {visibleTags.map((t) => (
                <li
                  key={t}
                  className="border-border text-muted-foreground inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide"
                >
                  #{t}
                </li>
              ))}
            </ul>
          )}

          <h3 className="font-heading text-foreground line-clamp-2 text-lg font-semibold leading-snug">
            {article.title}
          </h3>

          {article.summary && (
            <p className="text-muted-foreground line-clamp-3 text-sm">
              {article.summary}
            </p>
          )}

          <div className="text-muted-foreground mt-auto flex items-center justify-between gap-2 pt-3 text-xs">
            <span className="truncate">Oleh {author}</span>
            {published && (
              <span className="inline-flex shrink-0 items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                {published}
              </span>
            )}
          </div>

          <span className="text-[color:var(--ring)] mt-2 inline-flex items-center gap-1 text-sm font-medium">
            Baca artikel
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </span>
        </div>
      </Link>
    </article>
  )
}
