import type { Metadata } from 'next'
import { CTABanner } from '@/components/organisms/cta-banner'
import {
  CareersHero,
  CareersWhy,
  CareersLife,
  CareersTeams,
  CareersOpenings,
  CareersProcess,
} from '@/components/organisms/careers-sections'

export const metadata: Metadata = {
  title: 'Karier di RPI',
  description:
    'Bergabung dengan tim Rumah Pekerja Indonesia. Bangun produk yang mempertemukan jutaan pencari kerja dengan perusahaan terverifikasi di seluruh Indonesia.',
}

export default function CareersPage() {
  return (
    <>
      <CareersHero />
      <CareersWhy />
      <CareersLife />
      <CareersTeams />
      <CareersOpenings />
      <CareersProcess />
      <CTABanner />
    </>
  )
}
