import Link from 'next/link'
import {
  User,
  ShieldCheck,
  Bell,
  Search,
  Activity,
  FileText,
  ChevronRight,
} from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'

export const metadata = { title: 'Pengaturan — Dasbor' }

type SettingLink = {
  href: string
  title: string
  desc: string
  icon: typeof User
  color: string
}

const LINKS: SettingLink[] = [
  {
    href: '/dashboard/profil',
    title: 'Profil',
    desc: 'Kelola nama, foto, dan informasi publik Anda.',
    icon: User,
    color: '#2563eb',
  },
  {
    href: '/dashboard/keamanan',
    title: 'Keamanan',
    desc: 'Kata sandi, 2FA, perangkat, dan koneksi akun.',
    icon: ShieldCheck,
    color: '#16a34a',
  },
  {
    href: '/dashboard/notifikasi',
    title: 'Notifikasi',
    desc: 'Atur preferensi email dan notifikasi push.',
    icon: Bell,
    color: '#d97706',
  },
  {
    href: '/dashboard/pencarian-tersimpan',
    title: 'Pencarian Tersimpan',
    desc: 'Kelola pencarian dan alert lowongan yang Anda simpan.',
    icon: Search,
    color: '#7c3aed',
  },
  {
    href: '/dashboard/aktivitas',
    title: 'Aktivitas',
    desc: 'Lihat riwayat aktivitas dan log akun Anda.',
    icon: Activity,
    color: '#dc2626',
  },
  {
    href: '/dashboard/cv',
    title: 'CV & Dokumen',
    desc: 'Kelola CV dan dokumen lamaran Anda.',
    icon: FileText,
    color: '#0891b2',
  },
]

export default async function DashboardSettingsPage() {
  await requireAuth('/dashboard/settings')

  return (
    <div className="p-6 space-y-8 max-w-3xl">
      <header>
        <h1 className="font-heading text-2xl md:text-3xl">Pengaturan</h1>
        <p className="text-muted-foreground mt-1">
          Kelola akun, keamanan, dan preferensi Anda dari satu tempat.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {LINKS.map((item) => {
          const ItemIcon = item.icon
          return (
            <Link
              key={item.href}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={item.href as any}
              className="border-border bg-card hover:border-primary/40 hover:bg-accent/40 group flex items-start gap-4 rounded-2xl border p-5 transition-colors"
            >
              <span
                className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${item.color}1a`, color: item.color }}
              >
                <ItemIcon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="font-heading text-base font-medium">{item.title}</span>
                  <ChevronRight className="text-muted-foreground group-hover:text-foreground h-4 w-4 shrink-0 transition-colors" aria-hidden="true" />
                </span>
                <span className="text-muted-foreground mt-1 block text-sm">{item.desc}</span>
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
