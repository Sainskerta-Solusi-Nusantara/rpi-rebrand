import type { Metadata } from 'next'
import { CTABanner } from '@/components/organisms/cta-banner'
import { LegalDocLayout } from '@/components/organisms/legal-doc-layout'

export const metadata: Metadata = {
  title: 'Ketentuan Penagihan',
  description:
    'Ketentuan penagihan, pembayaran, pengembalian dana, dan pajak untuk langganan Rumah Pekerja Indonesia.',
}

export default function BillingTermsPage() {
  return (
    <>
      <LegalDocLayout
        eyebrow="Legal · Billing Terms"
        title="Ketentuan Penagihan"
        intro="Halaman ini menjelaskan ketentuan penagihan, metode pembayaran, pengembalian dana, dan perpajakan untuk layanan berbayar kami."
        lastUpdated="30 Juni 2026"
        sections={[
          {
            heading: '1. Siklus Penagihan',
            paragraphs: [
              'Biaya langganan ditagih di muka sesuai siklus yang dipilih — bulanan atau tahunan — dan otomatis diperpanjang hingga dibatalkan.',
            ],
          },
          {
            heading: '2. Metode Pembayaran',
            bullets: [
              'Kartu kredit/debit, transfer bank, dan dompet digital yang didukung.',
              'Pembayaran diproses melalui penyedia pembayaran tepercaya dengan standar keamanan industri.',
            ],
          },
          {
            heading: '3. Pajak',
            paragraphs: [
              'Harga yang tercantum belum termasuk pajak yang berlaku. Pajak akan ditambahkan sesuai ketentuan perpajakan yang berlaku di Indonesia.',
            ],
          },
          {
            heading: '4. Pengembalian Dana',
            paragraphs: [
              'Pembayaran umumnya tidak dapat dikembalikan, kecuali diwajibkan oleh hukum atau dinyatakan lain dalam ketentuan paket Anda.',
            ],
          },
          {
            heading: '5. Pembatalan',
            paragraphs: [
              'Anda dapat membatalkan langganan kapan saja; akses tetap aktif hingga akhir periode penagihan berjalan.',
            ],
          },
          {
            heading: '6. Pertanyaan Tagihan',
            paragraphs: [
              'Untuk pertanyaan terkait tagihan, hubungi kami di hello@rumahpekerja.id.',
            ],
          },
        ]}
      />
      <CTABanner />
    </>
  )
}
