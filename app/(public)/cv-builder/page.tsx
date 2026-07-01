import type { Metadata } from 'next'
import { CTABanner } from '@/components/organisms/cta-banner'
import { FeatureLanding } from '@/components/organisms/feature-landing'

export const metadata: Metadata = {
  title: 'Pembuat CV',
  description:
    'Buat CV profesional yang lolos seleksi ATS dalam hitungan menit dengan template gratis dari Rumah Pekerja Indonesia.',
}

export default function CvBuilderPage() {
  return (
    <>
      <FeatureLanding
        eyebrow="Untuk Pekerja"
        title="Buat CV Profesional Gratis"
        subtitle="Susun CV yang menonjol dan lolos seleksi ATS dalam hitungan menit. Pilih template, isi data, dan unduh dalam format PDF — semuanya gratis."
        primaryCta={{ label: 'Mulai Buat CV', href: '/register' }}
        secondaryCta={{ label: 'Lihat Lowongan', href: '/jobs' }}
        featuresHeading="Semua yang Anda butuhkan"
        features={[
          {
            title: 'Template Lolos ATS',
            desc: 'Desain bersih yang mudah dibaca sistem pelacak pelamar maupun perekrut.',
          },
          {
            title: 'Saran Berbasis AI',
            desc: 'Dapatkan rekomendasi kata kunci dan perbaikan kalimat agar CV lebih kuat.',
          },
          {
            title: 'Unduh PDF Instan',
            desc: 'Simpan dan unduh CV Anda kapan saja dalam format PDF berkualitas tinggi.',
          },
          {
            title: 'Beberapa Versi',
            desc: 'Sesuaikan CV untuk tiap lowongan dan simpan beberapa versi sekaligus.',
          },
          {
            title: 'Lamar Langsung',
            desc: 'Gunakan CV Anda untuk melamar lowongan di platform hanya dengan satu klik.',
          },
          {
            title: 'Aman & Privat',
            desc: 'Data Anda terenkripsi dan tidak pernah dibagikan tanpa izin Anda.',
          },
        ]}
      />
      <CTABanner />
    </>
  )
}
