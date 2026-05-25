import type { Metadata } from 'next'
import { CTABanner } from '@/components/organisms/cta-banner'
import {
  TimHero,
  TimLeadership,
  TimDepartments,
  TimPrinciples,
  TimAdvisors,
  TimOpenRoles,
} from '@/components/organisms/team-sections'

export const metadata: Metadata = {
  title: 'Tim Kami',
  description:
    'Bertemu dengan 120+ orang di balik Rumah Pekerja Indonesia — eksekutif, lead, dan tim yang membangun masa depan kerja di Indonesia.',
}

export default function TimPage() {
  return (
    <>
      <TimHero />
      <TimLeadership />
      <TimDepartments />
      <TimPrinciples />
      <TimAdvisors />
      <TimOpenRoles />
      <CTABanner />
    </>
  )
}
