import Link from 'next/link'
import {
  Building2,
  Users,
  Flag,
  ShieldCheck,
  CreditCard,
  BarChart3,
  ScrollText,
  ChevronRight,
} from 'lucide-react'
import { requireRole } from '@/lib/auth/session'

export const metadata = { title: 'Pengaturan — Admin' }

type SettingLink = {
  href: string
  title: string
  desc: string
  icon: typeof Users
  color: string
}

const LINKS: SettingLink[] = [
  {
    href: '/admin/tenants',
    title: 'Tenant',
    desc: 'Kelola tenant, provisioning, dan status langganan.',
    icon: Building2,
    color: '#2563eb',
  },
  {
    href: '/admin/users',
    title: 'Pengguna',
    desc: 'Kelola pengguna platform dan peran global.',
    icon: Users,
    color: '#0891b2',
  },
  {
    href: '/admin/moderasi',
    title: 'Moderasi',
    desc: 'Tinjau laporan konten dan antrian moderasi.',
    icon: Flag,
    color: '#dc2626',
  },
  {
    href: '/admin/billing',
    title: 'Penagihan',
    desc: 'Langganan tenant, paket, dan status pembayaran.',
    icon: CreditCard,
    color: '#16a34a',
  },
  {
    href: '/admin/analytics',
    title: 'Analitik',
    desc: 'Metrik pertumbuhan platform dan agregat data.',
    icon: BarChart3,
    color: '#7c3aed',
  },
  {
    href: '/admin/sistem',
    title: 'Sistem',
    desc: 'Kesehatan sistem, sesi aktif, dan event audit.',
    icon: ShieldCheck,
    color: '#0d9488',
  },
  {
    href: '/admin/audit',
    title: 'Audit Log',
    desc: 'Jejak audit lengkap aktivitas platform.',
    icon: ScrollText,
    color: '#d97706',
  },
]

export default async function AdminSettingsPage() {
  await requireRole('ADMIN', 'SUPERADMIN')

  return (
    <div className="p-6 space-y-8 max-w-3xl">
      <header>
        <h1 className="font-heading text-2xl md:text-3xl">Pengaturan</h1>
        <p className="text-muted-foreground mt-1">
          Pusat kontrol administrasi platform.
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
