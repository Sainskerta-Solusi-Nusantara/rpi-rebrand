// Presentation metadata for tenants — info that isn't in the DB schema.
// Keyed by tenant.slug. Add new entries here as tenants onboard.

export type TenantMeta = {
  tagline: string
  about: string
  industry: string
  /** Fallback brand color if the tenant has no Branding row. */
  fallbackColor: string
}

const TENANT_META: Record<string, TenantMeta> = {
  main: {
    tagline:
      'Platform multi-tenant untuk perekrutan & pelatihan Indonesia',
    about:
      'Rumah Pekerja Indonesia adalah platform multi-tenant terdepan untuk perekrutan dan pelatihan di Indonesia. Kami melayani 2,4 juta+ pekerja dan 12.000+ mitra perekrut di seluruh provinsi.',
    industry: 'Teknologi',
    fallbackColor: '#0A2540',
  },
  telkom: {
    tagline: 'Telekomunikasi BUMN terbesar Indonesia',
    about:
      'Telkom adalah perusahaan telekomunikasi terbesar di Indonesia dengan lebih dari 170 juta pelanggan. Divisi Digital Business sedang membangun platform cloud-native untuk transformasi digital nasional.',
    industry: 'Telekomunikasi',
    fallbackColor: '#E60000',
  },
}

const DEFAULT_TENANT_META: TenantMeta = {
  tagline: 'Mitra perekrut terverifikasi RPI',
  about:
    'Perusahaan ini adalah mitra perekrut terverifikasi di platform Rumah Pekerja Indonesia.',
  industry: 'Umum',
  fallbackColor: '#0A2540',
}

export function tenantMeta(slug: string): TenantMeta {
  return TENANT_META[slug] ?? DEFAULT_TENANT_META
}
