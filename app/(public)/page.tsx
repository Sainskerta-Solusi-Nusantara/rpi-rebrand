import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { prisma } from '@/lib/db'
import { HeroBanner } from '@/components/organisms/hero-banner'
import { SkillChips } from '@/components/organisms/skill-chips'
import { LiveJobTicker } from '@/components/organisms/live-job-ticker'
import { StatsStrip } from '@/components/organisms/stats-strip'
import { CategoriesGrid } from '@/components/organisms/categories-grid'
import { JobsCarousel } from '@/components/organisms/jobs-carousel'
import { HowItWorks } from '@/components/organisms/how-it-works'
import { WhyChooseUs } from '@/components/organisms/why-choose-us'
import { IndustrySpotlight } from '@/components/organisms/industry-spotlight'
import { LMSPathTimeline } from '@/components/organisms/lms-path-timeline'
import { SuccessStories } from '@/components/organisms/success-stories'
import { TestimonialVideo } from '@/components/organisms/testimonial-video'
import { FeaturedPartners } from '@/components/organisms/featured-partners'
import { CareerInsights } from '@/components/organisms/career-insights'
import { AppPromo } from '@/components/organisms/app-promo'
import { NewsletterSignup } from '@/components/organisms/newsletter-signup'
import { FAQAccordion } from '@/components/organisms/faq-accordion'
import { CTABanner } from '@/components/organisms/cta-banner'

export const metadata: Metadata = {
  title: 'Karier, Kursus & Mitra Kerja — Rumah Pekerja Indonesia',
  description:
    'Temukan lowongan kerja terverifikasi, ikuti kursus keterampilan, dan terhubung dengan mitra perekrut di seluruh Indonesia melalui Rumah Pekerja Indonesia.',
  openGraph: {
    title: 'Rumah Pekerja Indonesia — Karier & Kursus',
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
    tickerJobs,
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
    prisma.job
      .findMany({
        where: jobWhere,
        take: 20,
        orderBy: { publishedAt: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          location: true,
          tenant: { select: { name: true } },
          publishedAt: true,
        },
      })
      .catch(() => []),
    prisma.jobCategory
      .findMany({
        where: { parentId: null },
        take: 12,
        include: { _count: { select: { jobs: true } } },
        orderBy: { name: 'asc' },
      })
      .catch(() => []),
    prisma.course
      .findMany({
        where: courseWhere,
        take: 6,
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

  const stats = [
    { label: 'Lowongan Aktif', value: jobsCount > 0 ? jobsCount : 12000, icon: 'jobs' as const, suffix: '+' },
    { label: 'Pekerja Terdaftar', value: usersCount > 0 ? usersCount : 240000, icon: 'talents' as const, suffix: '+' },
    { label: 'Mitra Terverifikasi', value: partnersCount > 0 ? partnersCount : 850, icon: 'partners' as const, suffix: '+' },
    { label: 'Kursus Tersedia', value: coursesCount > 0 ? coursesCount : 500, icon: 'courses' as const, suffix: '+' },
  ]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: 'Rumah Pekerja Indonesia',
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
        name: 'Rumah Pekerja Indonesia',
        url: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
        logo: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/logo.png`,
      },
      ...latestJobs.slice(0, 5).map((j) => ({
        '@type': 'JobPosting',
        title: j.title,
        datePosted: j.publishedAt?.toISOString(),
        hiringOrganization: { '@type': 'Organization', name: j.tenant?.name ?? 'RPI' },
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 1. Hero — search + stats + portrait */}
      <HeroBanner
        stats={{
          jobs: jobsCount > 0 ? `${jobsCount}+` : '12K+',
          partners: partnersCount > 0 ? `${partnersCount}+` : '850+',
          talents: usersCount > 0 ? `${usersCount}+` : '240K',
        }}
      />

      {/* 2. Skill quick-filter chips */}
      <SkillChips />

      {/* 3. Live job ticker (marquee) */}
      <section aria-label="Lowongan live" className="border-b border-border bg-background">
        <div className="mx-auto w-full max-w-7xl px-6 py-6">
          <LiveJobTicker jobs={tickerJobs} />
        </div>
      </section>

      {/* 4. Stats strip (animated counters, overlaps hero) */}
      <StatsStrip stats={stats} />

      {/* 5. Categories grid */}
      <CategoriesGrid categories={categories} />

      {/* 6. Jobs carousel */}
      <JobsCarousel jobs={latestJobs} />

      {/* 7. How it works (4-step process) */}
      <HowItWorks />

      {/* 8. Why choose us (benefits) */}
      <WhyChooseUs />

      {/* 9. Industry spotlight */}
      <IndustrySpotlight />

      {/* 10. LMS courses */}
      <LMSPathTimeline courses={courses} />

      {/* 11. Success stories wall */}
      <SuccessStories />

      {/* 12. Featured testimonial (video) */}
      <TestimonialVideo testimonial={featuredTestimonial} />

      {/* 13. Featured partners marquee */}
      <FeaturedPartners />

      {/* 14. Career insights blog */}
      <CareerInsights />

      {/* 15. Mobile app promo */}
      <AppPromo />

      {/* 16. Newsletter signup */}
      <NewsletterSignup />

      {/* 17. FAQ */}
      <FAQAccordion />

      {/* 18. Final CTA banner */}
      <CTABanner />
    </>
  )
}
