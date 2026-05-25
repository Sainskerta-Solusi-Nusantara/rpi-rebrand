import type { Metadata } from 'next'
import { CTABanner } from '@/components/organisms/cta-banner'
import {
  EnterpriseHero,
  EnterpriseTrust,
  EnterpriseCapabilities,
  EnterpriseSecurity,
  EnterpriseImplementation,
  EnterpriseCaseStudy,
  EnterpriseContact,
} from '@/components/organisms/enterprise-sections'

export const metadata: Metadata = {
  title: 'Solusi Enterprise',
  description:
    'Platform perekrutan multi-tenant berskala enterprise untuk grup usaha, BUMN, dan perusahaan terregulasi. SSO, SLA 99.9%, dedicated CSM, dan deployment private cloud.',
}

export default function EnterprisePage() {
  return (
    <>
      <EnterpriseHero />
      <EnterpriseTrust />
      <EnterpriseCapabilities />
      <EnterpriseSecurity />
      <EnterpriseImplementation />
      <EnterpriseCaseStudy />
      <EnterpriseContact />
      <CTABanner />
    </>
  )
}
