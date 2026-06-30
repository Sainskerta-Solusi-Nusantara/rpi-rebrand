import type { Metadata } from 'next'
import { CTABanner } from '@/components/organisms/cta-banner'
import { FeatureLanding } from '@/components/organisms/feature-landing'

export const metadata: Metadata = {
  title: 'Pencarian Talenta',
  description:
    'Cari dan jangkau kandidat berkualitas secara proaktif dengan basis data talenta Rumah Pekerja Indonesia.',
}

export default function TalentSearchPage() {
  return (
    <>
      <FeatureLanding
        eyebrow="Untuk Perusahaan"
        title="Temukan Kandidat Secara Proaktif"
        subtitle="Jangan tunggu pelamar datang. Telusuri basis data talenta, saring berdasarkan keterampilan dan pengalaman, lalu hubungi kandidat terbaik secara langsung."
        primaryCta={{ label: 'Mulai Mencari', href: '/register' }}
        secondaryCta={{ label: 'Lihat Paket Harga', href: '/pricing' }}
        featuresHeading="Cari talenta lebih cerdas"
        features={[
          {
            title: 'Filter Canggih',
            desc: 'Saring kandidat berdasarkan keterampilan, pengalaman, lokasi, dan ekspektasi gaji.',
          },
          {
            title: 'Pencocokan AI',
            desc: 'Sistem merekomendasikan kandidat paling relevan untuk setiap peran Anda.',
          },
          {
            title: 'Hubungi Langsung',
            desc: 'Kirim undangan dan pesan ke kandidat potensial tanpa perantara.',
          },
          {
            title: 'Profil Lengkap',
            desc: 'Lihat CV, portofolio, dan riwayat verifikasi kandidat dalam satu tampilan.',
          },
          {
            title: 'Simpan & Tandai',
            desc: 'Buat daftar kandidat favorit dan kelola talent pool Anda dengan mudah.',
          },
          {
            title: 'Hemat Waktu',
            desc: 'Isi posisi lebih cepat dengan menjangkau kandidat yang tepat sejak awal.',
          },
        ]}
      />
      <CTABanner />
    </>
  )
}
