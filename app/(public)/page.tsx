import type { Metadata } from 'next'
import { safeJsonLd } from '@/lib/security/sanitize'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { headers } from 'next/headers'
import { prisma } from '@/lib/db'
import { HeroBanner } from '@/components/organisms/hero-banner'
import { JobsCarousel } from '@/components/organisms/jobs-carousel'
import { HowItWorks } from '@/components/organisms/how-it-works'
import { WhyChooseUs } from '@/components/organisms/why-choose-us'
import { LMSPathTimeline } from '@/components/organisms/lms-path-timeline'
import { SuccessStories } from '@/components/organisms/success-stories'
import { FAQAccordion } from '@/components/organisms/faq-accordion'
import { CTABanner } from '@/components/organisms/cta-banner'
import { ArticleCard } from '@/components/organisms/article-card'
import { getRecentArticles } from '@/lib/blog/queries'
import { getServerT } from '@/lib/i18n/server-dictionary'

export const metadata: Metadata = {
  title: 'Karier, Kursus & Mitra Kerja — SSN Pekerja',
  description:
    'Temukan lowongan kerja terverifikasi, ikuti kursus keterampilan, dan terhubung dengan mitra perekrut di seluruh Indonesia melalui SSN Pekerja.',
  openGraph: {
    title: 'SSN Pekerja — Karier & Kursus',
    description:
      'Platform multi-tenant untuk pekerja Indonesia: lowongan terverifikasi, pelatihan, sertifikat, dan mitra terpercaya.',
  },
}

async function getTenantId(): Promise<string | null> {
  const slug = headers().get('x-tenant-slug')
  if (!slug) return null
  const t = await prisma.tenant
    .findUnique({ where: { slug }, select: { id: true } })
    .catch(() => null)
  return t?.id ?? null
}

export default async function HomePage() {
  const t = await getServerT()
  const th = t.public.home
  const tenantId = await getTenantId()
  const jobWhere = {
    status: 'PUBLISHED' as const,
    ...(tenantId ? { tenantId } : {}),
  }
  const courseWhere = {
    status: 'PUBLISHED' as const,
    ...(tenantId ? { tenantId } : {}),
  }

  const [
    latestJobs,
    categories,
    courses,
    jobsCount,
    usersCount,
    partnersCount,
    coursesCount,
    featuredTestimonial,
  ] = await Promise.all([
    prisma.job
      .findMany({
        where: jobWhere,
        take: 12,
        orderBy: { publishedAt: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          location: true,
          locationType: true,
          employmentType: true,
          salaryMin: true,
          salaryMax: true,
          salaryCurrency: true,
          publishedAt: true,
          tenant: { select: { name: true, slug: true } },
          category: { select: { name: true, slug: true } },
        },
      })
      .catch(() => []),
    prisma.jobCategory
      .findMany({
        where: { parentId: null },
        take: 8,
        include: { _count: { select: { jobs: true } } },
        orderBy: { name: 'asc' },
      })
      .catch(() => []),
    prisma.course
      .findMany({
        where: courseWhere,
        take: 3,
        orderBy: { publishedAt: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          thumbnail: true,
          level: true,
          durationHours: true,
          instructor: { select: { name: true, image: true } },
          _count: { select: { enrollments: true } },
        },
      })
      .catch(() => []),
    prisma.job.count({ where: jobWhere }).catch(() => 0),
    prisma.user.count({ where: { status: 'ACTIVE' } }).catch(() => 0),
    prisma.tenant.count({ where: { status: 'ACTIVE' } }).catch(() => 0),
    prisma.course.count({ where: courseWhere }).catch(() => 0),
    prisma.enrollment
      .findFirst({
        where: { status: 'COMPLETED' },
        orderBy: { completedAt: 'desc' },
        include: {
          user: { select: { name: true, image: true, headline: true } },
          course: { select: { title: true, slug: true } },
        },
      })
      .catch(() => null),
  ])

  const recentArticles = await getRecentArticles(3).catch(() => [])

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: 'SSN Pekerja',
        url: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/jobs?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Organization',
        name: 'SSN Pekerja',
        url: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
        logo: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/logo.png`,
      },
      ...latestJobs.slice(0, 5).map((j) => ({
        '@type': 'JobPosting',
        title: j.title,
        datePosted: j.publishedAt?.toISOString(),
        hiringOrganization: { '@type': 'Organization', name: j.tenant?.name ?? 'SSN' },
        jobLocation: {
          '@type': 'Place',
          address: { '@type': 'PostalAddress', addressLocality: j.location, addressCountry: 'ID' },
        },
        employmentType: j.employmentType,
        ...(j.salaryMin && j.salaryMax
          ? {
              baseSalary: {
                '@type': 'MonetaryAmount',
                currency: j.salaryCurrency,
                value: {
                  '@type': 'QuantitativeValue',
                  minValue: j.salaryMin,
                  maxValue: j.salaryMax,
                  unitText: 'MONTH',
                },
              },
            }
          : {}),
      })),
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />

      {/* 1. Hero — stats-forward */}
      <HeroBanner
        stats={{
          talents: usersCount > 0 ? usersCount : 240000,
          jobs: jobsCount > 0 ? jobsCount : 12000,
          partners: partnersCount > 0 ? partnersCount : 850,
          courses: coursesCount > 0 ? coursesCount : 500,
        }}
      />

      {/* 2. Jobs — kategori chips + carousel */}
      <JobsCarousel jobs={latestJobs} categories={categories} />

      {/* 3. How it works — 4 linear steps */}
      <HowItWorks />

      {/* 4. Why SSN — 4 value props */}
      <WhyChooseUs />

      {/* 5. LMS — 3 featured courses */}
      <LMSPathTimeline courses={courses} />

      {/* 6. Social proof + FAQ + CTA closer */}
      <SuccessStories testimonial={featuredTestimonial} />

      {/* 6b. Artikel terbaru — small DB-backed slot, hidden when no articles */}
      {recentArticles.length > 0 && (
        <section
          className="bg-muted/30 py-20 md:py-24"
          aria-label={th.latestArticlesEyebrow}
        >
          <div className="container mx-auto w-full max-w-6xl px-6">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="text-muted-foreground inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em]">
                  <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
                  {th.latestArticlesEyebrow}
                </span>
                <h2 className="font-heading text-foreground mt-3 text-2xl font-semibold md:text-3xl">
                  {th.latestArticlesTitle}
                </h2>
              </div>
              <Link
                href="/blog"
                className="text-[color:var(--ring)] inline-flex items-center gap-1 text-sm font-medium"
              >
                {th.viewAllArticles}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
            <ul className="grid gap-6 md:grid-cols-3">
              {recentArticles.map((a) => (
                <li key={a.id}>
                  <ArticleCard article={a} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <FAQAccordion />
      <CTABanner />
    </>
  )
}
