import type { Metadata } from 'next'
import { CTABanner } from '@/components/organisms/cta-banner'
import { LegalDocLayout } from '@/components/organisms/legal-doc-layout'

export const metadata: Metadata = {
  title: 'Kebijakan Penggunaan yang Wajar',
  description:
    'Acceptable Use Policy — batasan penggunaan platform Rumah Pekerja Indonesia yang dapat diterima.',
}

export default function AcceptableUsePolicyPage() {
  return (
    <>
      <LegalDocLayout
        eyebrow="Legal · Acceptable Use Policy"
        title="Kebijakan Penggunaan yang Wajar"
        intro="Kebijakan ini menjelaskan penggunaan platform yang dapat diterima dan perilaku yang dilarang demi menjaga komunitas tetap aman dan tepercaya."
        lastUpdated="30 Juni 2026"
        sections={[
          {
            heading: '1. Tujuan',
            paragraphs: [
              'Kebijakan ini berlaku bagi semua pengguna — pencari kerja, mitra perekrut, dan pengunjung — yang mengakses layanan Rumah Pekerja Indonesia.',
            ],
          },
          {
            heading: '2. Penggunaan yang Dilarang',
            bullets: [
              'Mengunggah lowongan palsu, menyesatkan, atau bersifat penipuan.',
              'Mengirim spam, materi promosi tanpa izin, atau pesan massal.',
              'Mengakses sistem secara tidak sah, melakukan scraping, atau memutar balik rekayasa platform.',
              'Mengunggah konten yang melanggar hukum, menyinggung, atau melanggar hak kekayaan intelektual.',
            ],
          },
          {
            heading: '3. Penegakan',
            paragraphs: [
              'Pelanggaran dapat berakibat peringatan, penangguhan sementara, atau penghentian akun secara permanen, tergantung tingkat keparahannya.',
            ],
          },
          {
            heading: '4. Pelaporan',
            paragraphs: [
              'Laporkan dugaan penyalahgunaan ke hello@rumahpekerja.id agar dapat kami tindak lanjuti.',
            ],
          },
        ]}
      />
      <CTABanner />
    </>
  )
}
