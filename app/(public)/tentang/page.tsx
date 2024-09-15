import type { Metadata } from 'next'
import { prisma } from '@/lib/db'

export const metadata: Metadata = {
  title: 'Tentang Kami',
  description:
    'Rumah Pekerja Indonesia adalah platform SaaS multi-tenant yang menghubungkan pekerja, mitra perekrut, dan pelatihan keterampilan di seluruh Indonesia.',
}

export default async function TentangPage() {
  const [jobsCount, usersCount, tenantsCount, coursesCount] = await Promise.all([
    prisma.job.count({ where: { status: 'PUBLISHED' } }).catch(() => 0),
    prisma.user.count({ where: { status: 'ACTIVE' } }).catch(() => 0),
    prisma.tenant.count({ where: { status: 'ACTIVE' } }).catch(() => 0),
    prisma.course.count({ where: { status: 'PUBLISHED' } }).catch(() => 0),
  ])

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-16">
      <header className="mb-12 text-center">
        <h1 className="font-heading text-4xl md:text-6xl">Tentang Rumah Pekerja Indonesia</h1>
        <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-lg">
          Kami percaya setiap pekerja Indonesia berhak atas kesempatan kerja yang adil,
          keterampilan yang berkembang, dan jalur karier yang transparan.
        </p>
      </header>

      <section className="mb-16 grid grid-cols-2 gap-6 md:grid-cols-4">
        {[
          { l: 'Lowongan Aktif', v: jobsCount },
          { l: 'Pekerja Terdaftar', v: usersCount },
          { l: 'Mitra Terverifikasi', v: tenantsCount },
          { l: 'Kursus Tersedia', v: coursesCount },
        ].map((s) => (
          <div
            key={s.l}
            className="border-border bg-card rounded-xl border p-6 text-center"
          >
            <div className="font-heading text-3xl">{s.v.toLocaleString('id-ID')}</div>
            <div className="text-muted-foreground mt-1 text-sm">{s.l}</div>
          </div>
        ))}
      </section>

      <section className="prose prose-neutral mx-auto max-w-none">
        <h2 className="font-heading">Misi Kami</h2>
        <p>
          Membangun infrastruktur ketenagakerjaan digital yang membuat pekerja Indonesia lebih
          terlihat, lebih terampil, dan lebih sejahtera — sambil memberi mitra perekrut alat yang
          adil, transparan, dan efisien untuk menemukan talenta yang tepat.
        </p>

        <h2 className="font-heading mt-10">Bagaimana Kami Bekerja</h2>
        <ul>
          <li>
            <strong>Multi-tenant.</strong> Setiap mitra mendapat subdomain dan brand sendiri,
            namun tetap bagian dari ekosistem yang lebih besar.
          </li>
          <li>
            <strong>Pelatihan terintegrasi.</strong> LMS bawaan membantu pekerja menutup
            kesenjangan keterampilan, dengan sertifikat yang bisa diverifikasi.
          </li>
          <li>
            <strong>Transparansi gaji & lokasi.</strong> Setiap lowongan menampilkan rentang gaji
            dan jenis lokasi (di tempat, hibrida, jarak jauh).
          </li>
          <li>
            <strong>Kepatuhan & audit.</strong> Setiap aksi penting dicatat untuk audit, dengan
            kontrol peran yang ketat (RBAC).
          </li>
        </ul>

        <h2 className="font-heading mt-10">Nilai Kami</h2>
        <p>
          Adil, transparan, fokus pada pekerja, dan terus berkembang bersama komunitas. Kami
          membangun di Indonesia, untuk Indonesia.
        </p>
      </section>
    </div>
  )
}
