import type { Metadata } from 'next'
import { CTABanner } from '@/components/organisms/cta-banner'
import { LegalDocLayout } from '@/components/organisms/legal-doc-layout'

export const metadata: Metadata = {
  title: 'Perjanjian Tingkat Layanan',
  description:
    'Service Level Agreement — komitmen ketersediaan, dukungan, dan kinerja layanan SSN Pekerja.',
}

export default function ServiceLevelAgreementPage() {
  return (
    <>
      <LegalDocLayout
        eyebrow="Legal · Service Level Agreement"
        title="Perjanjian Tingkat Layanan"
        intro="SLA ini menetapkan komitmen kami atas ketersediaan, dukungan, dan kinerja layanan untuk pelanggan berbayar."
        lastUpdated="30 Juni 2026"
        sections={[
          {
            heading: '1. Ketersediaan Layanan',
            paragraphs: [
              'Kami berkomitmen pada ketersediaan bulanan sebesar 99,9% untuk layanan inti, di luar pemeliharaan terjadwal yang diumumkan sebelumnya.',
            ],
          },
          {
            heading: '2. Pemeliharaan Terjadwal',
            paragraphs: [
              'Pemeliharaan terencana dilakukan di luar jam sibuk dan diumumkan minimal 48 jam sebelumnya melalui halaman status.',
            ],
          },
          {
            heading: '3. Tingkat Dukungan',
            bullets: [
              'Prioritas kritis: respons awal dalam 1 jam pada hari kerja.',
              'Prioritas tinggi: respons awal dalam 4 jam.',
              'Prioritas normal: respons awal dalam 1 hari kerja.',
            ],
          },
          {
            heading: '4. Kredit Layanan',
            paragraphs: [
              'Jika ketersediaan bulanan berada di bawah komitmen, pelanggan yang memenuhi syarat dapat mengajukan kredit layanan sesuai ketentuan paket.',
            ],
          },
          {
            heading: '5. Pengecualian',
            paragraphs: [
              'SLA tidak berlaku untuk gangguan akibat keadaan kahar, faktor di luar kendali kami, atau penggunaan yang melanggar ketentuan.',
            ],
          },
        ]}
      />
      <CTABanner />
    </>
  )
}
