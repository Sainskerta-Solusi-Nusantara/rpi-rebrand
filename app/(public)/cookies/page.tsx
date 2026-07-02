import type { Metadata } from 'next'
import { CTABanner } from '@/components/organisms/cta-banner'
import { LegalDocLayout } from '@/components/organisms/legal-doc-layout'

export const metadata: Metadata = {
  title: 'Kebijakan Cookie',
  description:
    'Bagaimana SSN Pekerja menggunakan cookie dan teknologi serupa, serta cara Anda mengelola preferensinya.',
}

export default function CookiesPage() {
  return (
    <>
      <LegalDocLayout
        eyebrow="Legal"
        title="Kebijakan Cookie"
        intro="Kami menggunakan cookie dan teknologi serupa untuk menjaga platform tetap berfungsi, aman, dan relevan. Halaman ini menjelaskan jenis cookie yang kami gunakan dan cara mengelolanya."
        lastUpdated="30 Juni 2026"
        sections={[
          {
            heading: '1. Apa itu Cookie',
            paragraphs: [
              'Cookie adalah berkas teks kecil yang disimpan di perangkat Anda saat mengunjungi situs. Cookie membantu situs mengingat tindakan dan preferensi Anda.',
            ],
          },
          {
            heading: '2. Jenis Cookie yang Kami Gunakan',
            bullets: [
              'Cookie esensial: diperlukan agar platform berfungsi, seperti autentikasi dan keamanan sesi.',
              'Cookie preferensi: mengingat pengaturan seperti bahasa dan tema.',
              'Cookie analitik: membantu kami memahami cara platform digunakan agar dapat ditingkatkan.',
            ],
          },
          {
            heading: '3. Mengelola Cookie',
            paragraphs: [
              'Anda dapat mengatur preferensi cookie melalui banner persetujuan saat pertama berkunjung, atau mengubahnya kapan saja lewat pengaturan browser Anda. Menonaktifkan cookie esensial dapat memengaruhi fungsi platform.',
            ],
          },
          {
            heading: '4. Cookie Pihak Ketiga',
            paragraphs: [
              'Beberapa layanan pihak ketiga yang kami gunakan dapat menetapkan cookie sendiri. Penggunaan cookie tersebut tunduk pada kebijakan privasi masing-masing penyedia.',
            ],
          },
          {
            heading: '5. Hubungi Kami',
            paragraphs: [
              'Untuk pertanyaan terkait kebijakan cookie, hubungi kami di hello@pekerja.sainskerta.net.',
            ],
          },
        ]}
      />
      <CTABanner />
    </>
  )
}
