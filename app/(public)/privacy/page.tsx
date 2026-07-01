import type { Metadata } from 'next'
import { CTABanner } from '@/components/organisms/cta-banner'
import { LegalDocLayout } from '@/components/organisms/legal-doc-layout'

export const metadata: Metadata = {
  title: 'Kebijakan Privasi',
  description:
    'Bagaimana Rumah Pekerja Indonesia mengumpulkan, menggunakan, dan melindungi data pribadi pencari kerja dan mitra perekrut.',
}

export default function PrivacyPage() {
  return (
    <>
      <LegalDocLayout
        eyebrow="Legal"
        title="Kebijakan Privasi"
        intro="Privasi Anda penting bagi kami. Kebijakan ini menjelaskan data apa yang kami kumpulkan, bagaimana kami menggunakannya, dan hak Anda atas data tersebut."
        lastUpdated="30 Juni 2026"
        sections={[
          {
            heading: '1. Data yang Kami Kumpulkan',
            paragraphs: [
              'Kami mengumpulkan data yang Anda berikan secara langsung serta data yang dihasilkan saat Anda menggunakan platform.',
            ],
            bullets: [
              'Data akun: nama, email, nomor telepon, dan kata sandi terenkripsi.',
              'Data profil dan lamaran: CV, riwayat kerja, pendidikan, dan keterampilan.',
              'Data teknis: alamat IP, jenis perangkat, dan aktivitas penggunaan.',
            ],
          },
          {
            heading: '2. Bagaimana Kami Menggunakan Data',
            paragraphs: [
              'Data Anda digunakan untuk menyediakan, memelihara, dan meningkatkan layanan kami.',
            ],
            bullets: [
              'Menghubungkan pencari kerja dengan lowongan dan mitra yang relevan.',
              'Memverifikasi identitas dan menjaga keamanan akun.',
              'Mengirim notifikasi terkait lamaran, lowongan, dan pembaruan layanan.',
            ],
          },
          {
            heading: '3. Berbagi Data',
            paragraphs: [
              'Kami tidak menjual data pribadi Anda. Data hanya dibagikan kepada mitra perekrut saat Anda melamar, atau kepada penyedia layanan yang membantu operasional kami berdasarkan perjanjian kerahasiaan.',
            ],
          },
          {
            heading: '4. Keamanan Data',
            paragraphs: [
              'Kami menerapkan enkripsi saat transit dan saat disimpan, kontrol akses ketat, serta audit keamanan berkala untuk melindungi data Anda.',
            ],
          },
          {
            heading: '5. Hak Anda',
            paragraphs: [
              'Anda dapat mengakses, memperbarui, atau menghapus data pribadi Anda kapan saja melalui pengaturan akun atau dengan menghubungi tim kami.',
            ],
          },
          {
            heading: '6. Hubungi Kami',
            paragraphs: [
              'Untuk pertanyaan terkait privasi, hubungi kami di hello@rumahpekerja.id.',
            ],
          },
        ]}
      />
      <CTABanner />
    </>
  )
}
