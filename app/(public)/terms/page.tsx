import type { Metadata } from 'next'
import { CTABanner } from '@/components/organisms/cta-banner'
import { LegalDocLayout } from '@/components/organisms/legal-doc-layout'

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan',
  description:
    'Ketentuan penggunaan platform Rumah Pekerja Indonesia bagi pencari kerja dan mitra perekrut.',
}

export default function TermsPage() {
  return (
    <>
      <LegalDocLayout
        eyebrow="Legal"
        title="Syarat & Ketentuan"
        intro="Dengan mengakses dan menggunakan Rumah Pekerja Indonesia, Anda menyetujui ketentuan berikut. Mohon dibaca dengan saksama."
        lastUpdated="30 Juni 2026"
        sections={[
          {
            heading: '1. Penerimaan Ketentuan',
            paragraphs: [
              'Dengan membuat akun atau menggunakan layanan kami, Anda menyatakan telah membaca, memahami, dan menyetujui Syarat & Ketentuan ini beserta Kebijakan Privasi kami.',
            ],
          },
          {
            heading: '2. Penggunaan Akun',
            paragraphs: [
              'Anda bertanggung jawab menjaga kerahasiaan kredensial akun dan atas seluruh aktivitas yang terjadi di dalamnya.',
            ],
            bullets: [
              'Berikan informasi yang akurat dan terkini.',
              'Jangan menggunakan akun orang lain tanpa izin.',
              'Segera laporkan penggunaan akun yang tidak sah.',
            ],
          },
          {
            heading: '3. Perilaku yang Dilarang',
            paragraphs: [
              'Anda setuju untuk tidak menyalahgunakan platform, termasuk namun tidak terbatas pada:',
            ],
            bullets: [
              'Mengunggah konten palsu, menipu, atau melanggar hukum.',
              'Mengganggu, melecehkan, atau merugikan pengguna lain.',
              'Mengumpulkan data pengguna lain tanpa izin.',
            ],
          },
          {
            heading: '4. Konten Pengguna',
            paragraphs: [
              'Anda tetap memiliki hak atas konten yang Anda unggah. Dengan mengunggahnya, Anda memberi kami lisensi untuk menampilkan konten tersebut sebatas keperluan penyediaan layanan.',
            ],
          },
          {
            heading: '5. Penghentian Layanan',
            paragraphs: [
              'Kami berhak menangguhkan atau menghentikan akun yang melanggar ketentuan ini tanpa pemberitahuan sebelumnya.',
            ],
          },
          {
            heading: '6. Pembatasan Tanggung Jawab',
            paragraphs: [
              'Layanan disediakan "sebagaimana adanya". Kami tidak bertanggung jawab atas kerugian tidak langsung yang timbul dari penggunaan platform.',
            ],
          },
          {
            heading: '7. Perubahan Ketentuan',
            paragraphs: [
              'Kami dapat memperbarui ketentuan ini sewaktu-waktu. Perubahan signifikan akan diberitahukan melalui email atau notifikasi di platform.',
            ],
          },
        ]}
      />
      <CTABanner />
    </>
  )
}
