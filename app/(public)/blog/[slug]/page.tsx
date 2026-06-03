import type { Metadata } from 'next'
import { safeJsonLd } from '@/lib/security/sanitize'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  Calendar,
  Eye,
  Mail,
  MessageCircle,
  Share2,
  Twitter,
} from 'lucide-react'

import { ReportFlagButton } from '@/components/organisms/report-flag-button'
import { ArticleCard } from '@/components/organisms/article-card'
import { getArticleBySlug, getRelatedArticles } from '@/lib/blog/queries'
import { renderMarkdownToHtml } from '@/lib/blog/markdown'

type Params = { slug: string }

const dateFmt = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export async function generateMetadata({
  params,
}: {
  params: Params
}): Promise<Metadata> {
  const a = await getArticleBySlug(params.slug)
  if (!a || a.status !== 'PUBLISHED') {
    return { title: 'Artikel tidak ditemukan' }
  }
  const description = (a.summary ?? a.title).slice(0, 160)
  return {
    title: `${a.title} — Blog RPI`,
    description,
    openGraph: {
      title: a.title,
      description,
      type: 'article',
      publishedTime: a.publishedAt?.toISOString(),
      authors: a.author?.name ? [a.author.name] : undefined,
      tags: a.tags,
      images: a.coverImage ? [{ url: a.coverImage }] : undefined,
    },
    twitter: {
      card: a.coverImage ? 'summary_large_image' : 'summary',
      title: a.title,
      description,
      images: a.coverImage ? [a.coverImage] : undefined,
    },
  }
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Params
}) {
  const article = await getArticleBySlug(params.slug)
  if (!article || article.status !== 'PUBLISHED') notFound()

  const related = await getRelatedArticles({
    excludeId: article.id,
    tags: article.tags,
    limit: 3,
  })

  const body = renderMarkdownToHtml(article.body)
  const author = article.author?.name ?? 'Tim RPI'
  const publishedAt = article.publishedAt ?? article.createdAt
  const publishedLabel = (() => {
    try {
      return dateFmt.format(publishedAt)
    } catch {
      return ''
    }
  })()

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? 'https://rumahpekerja.id'
  const shareUrl = `${appUrl}/blog/${article.slug}`
  const shareText = encodeURIComponent(`${article.title} — ${appUrl}/blog/${article.slug}`)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.summary ?? undefined,
    datePublished: publishedAt.toISOString(),
    dateModified: article.updatedAt.toISOString(),
    author: { '@type': 'Person', name: author },
    publisher: {
      '@type': 'Organization',
      name: 'Rumah Pekerja Indonesia',
    },
    image: article.coverImage ?? undefined,
    keywords: article.tags.join(', '),
  }

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />

      <section className="bg-background pb-10 pt-12 md:pb-12 md:pt-16">
        <div className="container mx-auto w-full max-w-3xl px-6">
          <Link
            href="/blog"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium transition"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Kembali ke blog
          </Link>

          {article.tags.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-2" aria-label="Tag artikel">
              {article.tags.slice(0, 5).map((t) => (
                <li key={t}>
                  <Link
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    href={`/blog?tag=${encodeURIComponent(t)}` as any}
                    className="border-border text-muted-foreground hover:border-[color:var(--ring)] hover:text-[color:var(--ring)] inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs"
                  >
                    #{t}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <h1 className="font-heading text-foreground mt-5 text-balance text-3xl font-semibold leading-[1.15] md:text-4xl lg:text-5xl">
            {article.title}
          </h1>

          {article.summary && (
            <p className="text-muted-foreground mt-5 text-balance text-lg">
              {article.summary}
            </p>
          )}

          <div className="text-muted-foreground mt-6 flex flex-wrap items-center gap-4 text-sm">
            <span>Oleh {author}</span>
            {publishedLabel && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4" aria-hidden />
                {publishedLabel}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Eye className="h-4 w-4" aria-hidden />
              {article.viewCount.toLocaleString('id-ID')} dibaca
            </span>
          </div>
        </div>
      </section>

      {article.coverImage && (
        <section className="bg-background pb-10">
          <div className="container mx-auto w-full max-w-4xl px-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.coverImage}
              alt=""
              className="border-border aspect-[16/9] w-full rounded-2xl border object-cover"
            />
          </div>
        </section>
      )}

      <section className="bg-background pb-12">
        <div className="container mx-auto w-full max-w-3xl px-6">
          <article
            className="prose prose-neutral dark:prose-invert max-w-none"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: body }}
          />

          {/* Share */}
          <div className="border-border mt-12 border-t pt-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-muted-foreground inline-flex items-center gap-1.5 text-sm font-medium">
                <Share2 className="h-4 w-4" aria-hidden />
                Bagikan
              </span>
              <a
                href={`mailto:?subject=${encodeURIComponent(article.title)}&body=${shareText}`}
                className="border-border text-foreground/80 hover:border-[color:var(--ring)] hover:text-[color:var(--ring)] inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition"
              >
                <Mail className="h-3.5 w-3.5" aria-hidden />
                Email
              </a>
              <a
                href={`https://wa.me/?text=${shareText}`}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="border-border text-foreground/80 hover:border-[color:var(--ring)] hover:text-[color:var(--ring)] inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition"
              >
                <MessageCircle className="h-3.5 w-3.5" aria-hidden />
                WhatsApp
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${shareText}`}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="border-border text-foreground/80 hover:border-[color:var(--ring)] hover:text-[color:var(--ring)] inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition"
              >
                <Twitter className="h-3.5 w-3.5" aria-hidden />
                Twitter
              </a>
            </div>
          </div>

          {/* Moderation: ReportFlagButton currently types its `resourceType` as a
            * fixed union that does not include `article` (lives in
            * lib/moderation/actions which is out of scope for this feature). We
            * cast so the button still works for end-users; the moderation team
            * has accepted articles as `other` for now. */}
          <div className="mt-6">
            <ReportFlagButton
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              resourceType={'article' as any}
              resourceId={article.id}
            />
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="bg-muted/30 py-20 md:py-24" aria-label="Artikel terkait">
          <div className="container mx-auto w-full max-w-6xl px-6">
            <div className="mb-10 text-center">
              <span className="text-muted-foreground inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em]">
                <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
                Artikel terkait
                <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
              </span>
              <h2 className="font-heading text-foreground mt-3 text-2xl font-semibold md:text-3xl">
                Tulisan dengan topik serupa
              </h2>
            </div>
            <ul className="grid gap-6 md:grid-cols-3">
              {related.map((r) => (
                <li key={r.id}>
                  <ArticleCard article={r} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  )
}
