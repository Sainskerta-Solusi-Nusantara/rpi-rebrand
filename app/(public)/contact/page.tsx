import type { Metadata } from 'next'
import { CTABanner } from '@/components/organisms/cta-banner'
import { FAQAccordion } from '@/components/organisms/faq-accordion'
import {
  ContactHero,
  ContactChannels,
  ContactFormSection,
  ContactAudience,
} from '@/components/organisms/contact-sections'
import { getServerT } from '@/lib/i18n/server-dictionary'

export const metadata: Metadata = {
  title: 'Hubungi Kami',
  description:
    'Tim Rumah Pekerja Indonesia siap membantu pencari kerja, mitra perekrut, dan media. Hubungi kami lewat email, telepon, WhatsApp, atau kunjungi kantor di Jakarta.',
}

export default async function ContactPage() {
  const t = await getServerT()
  const tc = t.public.contact
  return (
    <>
      <ContactHero />
      <ContactChannels />
      <ContactFormSection />
      <ContactAudience />
      <section
        className="bg-background py-20 md:py-24"
        aria-labelledby="contact-faq-heading"
      >
        <div className="container mx-auto w-full max-w-3xl px-6">
          <div className="mb-10 text-center">
            <div className="mb-4 flex items-center justify-center gap-3">
              <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {tc.faqEyebrow}
              </span>
              <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
            </div>
            <h2
              id="contact-faq-heading"
              className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
            >
              {tc.faqTitle}
            </h2>
            <p className="text-muted-foreground mt-3">
              {tc.faqSubtitle}
            </p>
          </div>
          <FAQAccordion />
        </div>
      </section>
      <CTABanner />
    </>
  )
}
