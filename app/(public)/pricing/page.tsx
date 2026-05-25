import type { Metadata } from 'next'
import { CTABanner } from '@/components/organisms/cta-banner'
import {
  PricingHero,
  PricingCompare,
  PricingAddons,
  PricingFAQ,
} from '@/components/organisms/pricing-sections'

export const metadata: Metadata = {
  title: 'Harga & Paket',
  description:
    'Pilih paket Rumah Pekerja Indonesia yang sesuai skala perekrutan Anda — mulai dari gratis hingga enterprise dengan SSO, SLA, dan dedicated success manager.',
}

export default function PricingPage() {
  return (
    <>
      <PricingHero />
      <PricingCompare />
      <PricingAddons />
      <PricingFAQ />
      <CTABanner />
    </>
  )
}
