import type { Metadata } from 'next'
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

      {/* 4. Why RPI — 4 value props */}
      <WhyChooseUs />

      {/* 5. LMS — 3 featured courses */}
      <LMSPathTimeline courses={courses} />

      {/* 6. Social proof + FAQ + CTA closer */}
      <SuccessStories testimonial={featuredTestimonial} />
      <FAQAccordion />
      <CTABanner />
    </>
  )
}
