import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import {
  AboutHero,
  AboutMission,
  AboutJourney,
  AboutValues,
  AboutImpact,
  AboutTeam,
} from '@/components/organisms/about-sections'
import { CTABanner } from '@/components/organisms/cta-banner'

export const metadata: Metadata = {
  title: 'Tentang Kami',
  description:
    'Rumah Pekerja Indonesia adalah platform SaaS multi-tenant yang menghubungkan pekerja, mitra perekrut, dan pelatihan keterampilan di seluruh Indonesia.',
}

export default async function TentangPage() {
  const [jobsCount, usersCount, tenantsCount, coursesCount] = await Promise.all([
    prisma.job.count({ where: { status: 'PUBLISHED' } }).catch(() => 0),
    prisma.user.count({ where: { status: 'ACTIVE' } }).catch(() => 0),
    prisma.tenant.count({ where: { status: 'ACTIVE' } }).catch(() => 0),
    prisma.course.count({ where: { status: 'PUBLISHED' } }).catch(() => 0),
  ])

  return (
    <>
      <AboutHero />
      <AboutMission />
      <AboutJourney />
      <AboutValues />
      <AboutImpact
        jobsCount={jobsCount}
        usersCount={usersCount}
        tenantsCount={tenantsCount}
        coursesCount={coursesCount}
      />
      <AboutTeam />
      <CTABanner />
    </>
  )
}
