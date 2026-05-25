import type { Metadata } from 'next'
import { CTABanner } from '@/components/organisms/cta-banner'
import {
  KarierHero,
  KarierMission,
  KarierDayInLife,
  KarierGrowth,
  KarierDEI,
  KarierAlumni,
  KarierOpeningsCTA,
} from '@/components/organisms/karier-sections'

export const metadata: Metadata = {
  title: 'Karier di RPI',
  description:
    'Bergabung dengan tim yang membangun infrastruktur kerja yang adil untuk Indonesia. Pelajari budaya, jalur tumbuh, dan kisah alumni RPI.',
}

export default function KarierPage() {
  return (
    <>
      <KarierHero />
      <KarierMission />
      <KarierDayInLife />
      <KarierGrowth />
      <KarierDEI />
      <KarierAlumni />
      <KarierOpeningsCTA />
      <CTABanner />
    </>
  )
}
