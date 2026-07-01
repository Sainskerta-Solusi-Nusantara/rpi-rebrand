import type { Metadata } from 'next'
import { CTABanner } from '@/components/organisms/cta-banner'
import { FeatureLanding } from '@/components/organisms/feature-landing'

export const metadata: Metadata = {
  title: 'Komunitas',
  description:
    'Bergabung dengan komunitas pekerja Indonesia untuk berbagi pengalaman, belajar keterampilan baru, dan bertumbuh bersama.',
}

export default function CommunityPage() {
  return (
    <>
      <FeatureLanding
        eyebrow="Untuk Pekerja"
        title="Bertumbuh Bersama Komunitas"
        subtitle="Terhubung dengan ratusan ribu pekerja Indonesia. Berbagi pengalaman, bertanya, dan dapatkan dukungan dalam perjalanan karier Anda."
        primaryCta={{ label: 'Gabung Komunitas', href: '/register' }}
        secondaryCta={{ label: 'Pelatihan & Kursus', href: '/courses' }}
        featuresHeading="Apa yang Anda dapatkan"
        features={[
          {
            title: 'Forum Diskusi',
            desc: 'Tanya jawab seputar karier, lamaran kerja, dan pengembangan diri.',
          },
          {
            title: 'Grup Industri',
            desc: 'Bergabung dengan grup sesuai bidang Anda dan perluas jaringan profesional.',
          },
          {
            title: 'Mentor & Ahli',
            desc: 'Belajar langsung dari praktisi berpengalaman di berbagai bidang.',
          },
          {
            title: 'Acara & Webinar',
            desc: 'Ikuti acara rutin tentang keterampilan, tren industri, dan peluang kerja.',
          },
          {
            title: 'Cerita Sukses',
            desc: 'Terinspirasi dari kisah anggota yang berhasil meraih pekerjaan impian.',
          },
          {
            title: 'Dukungan Sesama',
            desc: 'Lingkungan yang suportif untuk saling membantu dan tumbuh bersama.',
          },
        ]}
      />
      <CTABanner />
    </>
  )
}
