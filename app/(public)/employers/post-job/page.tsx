import type { Metadata } from 'next'
import { CTABanner } from '@/components/organisms/cta-banner'
import { FeatureLanding } from '@/components/organisms/feature-landing'

export const metadata: Metadata = {
  title: 'Pasang Lowongan',
  description:
    'Pasang lowongan kerja dan jangkau ratusan ribu kandidat berkualitas di SSN Pekerja.',
}

export default function PostJobPage() {
  return (
    <>
      <FeatureLanding
        eyebrow="Untuk Perusahaan"
        title="Pasang Lowongan, Temukan Talenta"
        subtitle="Jangkau lebih dari 240.000 pekerja Indonesia. Pasang lowongan dalam hitungan menit dan kelola pelamar dengan alat perekrutan modern."
        primaryCta={{ label: 'Pasang Lowongan', href: '/register' }}
        secondaryCta={{ label: 'Lihat Paket Harga', href: '/pricing' }}
        featuresHeading="Mengapa memasang di sini"
        features={[
          {
            title: 'Jangkauan Luas',
            desc: 'Lowongan Anda tampil ke ratusan ribu kandidat aktif di seluruh Indonesia.',
          },
          {
            title: 'Penyaringan AI',
            desc: 'Pelamar otomatis diperingkat berdasarkan kecocokan dengan kebutuhan Anda.',
          },
          {
            title: 'Kelola Pipeline',
            desc: 'Lacak setiap kandidat dari lamaran hingga perekrutan dalam satu papan.',
          },
          {
            title: 'Posting Cepat',
            desc: 'Buat dan publikasikan lowongan dalam hitungan menit, tanpa ribet.',
          },
          {
            title: 'Branding Perusahaan',
            desc: 'Tampilkan profil dan budaya perusahaan untuk menarik talenta terbaik.',
          },
          {
            title: 'Analitik Lowongan',
            desc: 'Pantau performa lowongan: tayangan, pelamar, dan tingkat konversi.',
          },
        ]}
      />
      <CTABanner />
    </>
  )
}
