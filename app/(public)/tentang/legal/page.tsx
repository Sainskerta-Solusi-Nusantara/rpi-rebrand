import type { Metadata } from 'next'
import { CTABanner } from '@/components/organisms/cta-banner'
import {
  LegalHero,
  LegalEntity,
  LegalCompliance,
  LegalDocuments,
  LegalIP,
  LegalDisclosure,
  LegalContact,
} from '@/components/organisms/legal-sections'

export const metadata: Metadata = {
  title: 'Legal & Kepatuhan',
  description:
    'Informasi entitas hukum, kepatuhan regulasi, dokumen legal, dan kontak tim hukum SSN Pekerja.',
}

export default function LegalPage() {
  return (
    <>
      <LegalHero />
      <LegalEntity />
      <LegalCompliance />
      <LegalDocuments />
      <LegalIP />
      <LegalDisclosure />
      <LegalContact />
      <CTABanner />
    </>
  )
}
