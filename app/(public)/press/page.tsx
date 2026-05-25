import type { Metadata } from 'next'
import { CTABanner } from '@/components/organisms/cta-banner'
import {
  PressHero,
  PressReleases,
  PressCoverage,
  PressKit,
  PressAwards,
  PressLeadership,
  PressContact,
} from '@/components/organisms/press-sections'

export const metadata: Metadata = {
  title: 'Press & Media',
  description:
    'Siaran pers, peliputan media, dan press kit Rumah Pekerja Indonesia. Materi resmi untuk jurnalis, peneliti, dan mitra media.',
}

export default function PressPage() {
  return (
    <>
      <PressHero />
      <PressReleases />
      <PressCoverage />
      <PressAwards />
      <PressLeadership />
      <PressKit />
      <PressContact />
      <CTABanner />
    </>
  )
}
