import Link from 'next/link'
import { LifeBuoy, Mail, ChevronRight } from 'lucide-react'

export const metadata = {
  title: 'Bantuan & FAQ — SSN Pekerja',
  description:
    'Pusat bantuan SSN Pekerja: jawaban atas pertanyaan umum seputar lowongan, lamaran, kursus, dan akun.',
}

type Faq = { q: string; a: string }

const SECTIONS: { heading: string; items: Faq[] }[] = [
  {
    heading: 'Lowongan & Lamaran',
    items: [
      {
        q: 'Bagaimana cara melamar pekerjaan?',
        a: 'Buka halaman lowongan, pilih posisi yang Anda minati, lalu klik "Lamar". Pastikan CV pada profil Anda sudah terisi agar lamaran lebih cepat diproses.',
      },
      {
        q: 'Di mana saya bisa melihat status lamaran?',
        a: 'Semua lamaran Anda tersedia di menu Lamaran pada dasbor. Status akan diperbarui oleh perekrut, dan Anda akan menerima notifikasi setiap ada perubahan.',
      },
      {
        q: 'Bisakah saya berkomunikasi dengan perekrut?',
        a: 'Ya. Jika perekrut membuka percakapan, Anda dapat membalasnya melalui menu Pesan di dasbor atau langsung dari halaman lamaran terkait.',
      },
    ],
  },
  {
    heading: 'Kursus & Sertifikat',
    items: [
      {
        q: 'Bagaimana cara mengikuti kursus?',
        a: 'Telusuri katalog kursus, klik kursus yang diinginkan, lalu daftar. Progres belajar Anda tersimpan otomatis dan dapat dilanjutkan kapan saja.',
      },
      {
        q: 'Bagaimana saya mendapatkan sertifikat?',
        a: 'Sertifikat diterbitkan setelah Anda menyelesaikan seluruh materi kursus. Sertifikat dapat diunduh dari menu Sertifikat di dasbor.',
      },
    ],
  },
  {
    heading: 'Akun & Keamanan',
    items: [
      {
        q: 'Bagaimana cara mengubah kata sandi?',
        a: 'Buka Pengaturan → Keamanan, lalu pilih "Ubah Kata Sandi". Kami menyarankan mengaktifkan autentikasi dua faktor (2FA) untuk keamanan tambahan.',
      },
      {
        q: 'Bagaimana cara mengunduh atau menghapus data saya?',
        a: 'Pada halaman Keamanan tersedia opsi ekspor data dan penghapusan akun. Penghapusan bersifat permanen setelah dikonfirmasi.',
      },
    ],
  },
]

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <header className="mb-10">
        <span className="bg-primary/10 text-primary inline-flex h-12 w-12 items-center justify-center rounded-2xl">
          <LifeBuoy className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="font-heading mt-4 text-3xl md:text-4xl">Pusat Bantuan</h1>
        <p className="text-muted-foreground mt-2">
          Temukan jawaban cepat untuk pertanyaan yang paling sering diajukan.
        </p>
      </header>

      <div className="space-y-10">
        {SECTIONS.map((section) => (
          <section key={section.heading}>
            <h2 className="font-heading mb-4 text-xl">{section.heading}</h2>
            <dl className="space-y-3">
              {section.items.map((item) => (
                <div
                  key={item.q}
                  className="border-border bg-card rounded-2xl border p-5"
                >
                  <dt className="font-medium">{item.q}</dt>
                  <dd className="text-muted-foreground mt-2 text-sm leading-relaxed">
                    {item.a}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>

      <section className="border-border bg-card mt-12 rounded-2xl border p-6">
        <div className="flex items-center gap-2">
          <Mail className="text-primary h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-lg">Masih butuh bantuan?</h2>
        </div>
        <p className="text-muted-foreground mt-2 text-sm">
          Tim kami siap membantu. Hubungi kami dan kami akan merespons sesegera mungkin.
        </p>
        <Link
          href="/contact"
          className="text-primary mt-4 inline-flex items-center gap-1 text-sm font-medium hover:underline"
        >
          Hubungi kami
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </section>
    </div>
  )
}
