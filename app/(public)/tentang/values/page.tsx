import type { Metadata } from 'next'
import { CTABanner } from '@/components/organisms/cta-banner'
import {
  ValuesHero,
  ValuesDeepDive,
  ValuesDecisionFilter,
  ValuesTradeoffs,
  ValuesLiving,
  ValuesAccountability,
} from '@/components/organisms/values-sections'

export const metadata: Metadata = {
  title: 'Nilai-Nilai Kami',
  description:
    'Empat prinsip yang memandu setiap keputusan di SSN Pekerja — adil, transparan, berpihak pada pekerja, dan bertumbuh bersama. Bukan poster, tapi pegangan harian.',
}

export default function ValuesPage() {
  return (
    <>
      <ValuesHero />
      <ValuesDeepDive />
      <ValuesDecisionFilter />
      <ValuesTradeoffs />
      <ValuesLiving />
      <ValuesAccountability />
      <CTABanner />
    </>
  )
}
