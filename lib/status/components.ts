/**
 * Static definition of the service components that appear on the public
 * status page. Kept in code (instead of a DB table) because the list rarely
 * changes and the health checks are also hard-coded against these keys.
 *
 * Adding a new component:
 *  1. Add an entry below with a unique `key`.
 *  2. Add a corresponding health check in `lib/status/health-checks.ts`
 *     and wire it up inside `runAllHealthChecks()`.
 */

export type StatusComponentKey =
  | 'web'
  | 'api'
  | 'database'
  | 'email'
  | 'storage'
  | 'auth'
  | 'webhooks'
  | 'cron'

export interface StatusComponent {
  key: StatusComponentKey
  name: string
  description: string
}

export const STATUS_COMPONENTS: StatusComponent[] = [
  {
    key: 'web',
    name: 'Situs Web',
    description: 'Halaman publik dan dasbor pengguna.',
  },
  {
    key: 'api',
    name: 'API Publik',
    description: 'Endpoint REST untuk integrasi pihak ketiga.',
  },
  {
    key: 'database',
    name: 'Basis Data',
    description: 'PostgreSQL utama untuk seluruh layanan aplikasi.',
  },
  {
    key: 'email',
    name: 'Email Transaksional',
    description: 'Pengiriman notifikasi, OTP, dan email lamaran.',
  },
  {
    key: 'storage',
    name: 'Penyimpanan Berkas',
    description: 'Unggahan CV, logo, dan lampiran lamaran.',
  },
  {
    key: 'auth',
    name: 'Autentikasi',
    description: 'Layanan login, SSO, dan manajemen sesi.',
  },
  {
    key: 'webhooks',
    name: 'Webhook',
    description: 'Pengiriman event ke endpoint pelanggan.',
  },
  {
    key: 'cron',
    name: 'Tugas Terjadwal',
    description: 'Pekerjaan batch internal (digest, retensi, sinkron).',
  },
]

export function getComponent(key: string): StatusComponent | undefined {
  return STATUS_COMPONENTS.find((c) => c.key === key)
}

export function getComponentName(key: string): string {
  return getComponent(key)?.name ?? key
}
