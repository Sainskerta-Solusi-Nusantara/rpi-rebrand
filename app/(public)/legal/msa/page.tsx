import type { Metadata } from 'next'
import { CTABanner } from '@/components/organisms/cta-banner'
import { LegalDocLayout } from '@/components/organisms/legal-doc-layout'

export const metadata: Metadata = {
  title: 'Perjanjian Langganan Utama',
  description:
    'Master Subscription Agreement — kerangka kontrak utama untuk pelanggan langganan Rumah Pekerja Indonesia.',
}

export default function MasterSubscriptionAgreementPage() {
  return (
    <>
      <LegalDocLayout
        eyebrow="Legal · Master Subscription Agreement"
        title="Perjanjian Langganan Utama"
        intro="MSA ini merupakan kerangka kontrak utama yang mengatur penggunaan layanan berlangganan kami oleh pelanggan bisnis dan enterprise."
        lastUpdated="30 Juni 2026"
        sections={[
          {
            heading: '1. Lingkup Perjanjian',
            paragraphs: [
              'Perjanjian ini mengatur hubungan antara Rumah Pekerja Indonesia dan pelanggan, mencakup seluruh order form dan adendum yang merujuk padanya.',
            ],
          },
          {
            heading: '2. Langganan & Lisensi',
            paragraphs: [
              'Pelanggan memperoleh lisensi non-eksklusif dan tidak dapat dipindahtangankan untuk mengakses layanan selama masa langganan sesuai paket yang dipilih.',
            ],
          },
          {
            heading: '3. Pembayaran & Pembaruan',
            bullets: [
              'Biaya ditagih sesuai siklus pada order form (bulanan atau tahunan).',
              'Langganan diperpanjang otomatis kecuali dibatalkan sebelum periode berakhir.',
              'Keterlambatan pembayaran dapat mengakibatkan penangguhan layanan.',
            ],
          },
          {
            heading: '4. Kerahasiaan',
            paragraphs: [
              'Masing-masing pihak wajib menjaga kerahasiaan informasi rahasia yang diperoleh dan menggunakannya hanya untuk keperluan perjanjian.',
            ],
          },
          {
            heading: '5. Jangka Waktu & Pengakhiran',
            paragraphs: [
              'Perjanjian berlaku selama masa langganan aktif dan dapat diakhiri sesuai ketentuan pengakhiran yang disepakati kedua pihak.',
            ],
          },
        ]}
      />
      <CTABanner />
    </>
  )
}
