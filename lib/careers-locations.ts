export type CareerLocationMeta = {
  name: string
  slug: string
  emoji: string
  description: string
}

export const CAREER_LOCATIONS_META: CareerLocationMeta[] = [
  { name: 'Jakarta', slug: 'jakarta', emoji: '🏙️', description: 'Kantor pusat RPI terletak di Jakarta. Sebagian besar tim Engineering, Product, Design, dan Partnership berbasis di sini dengan fleksibilitas hybrid.' },
  { name: 'Remote', slug: 'remote', emoji: '🌐', description: 'Bekerja dari mana saja di Indonesia. Kami menetapkan fleksibilitas penuh untuk peran-peran yang dapat dilakukan asinkron, dengan dukungan tooling kolaborasi yang matang.' },
  { name: 'Hybrid', slug: 'hybrid', emoji: '⚡', description: 'Kombinasi kerja dari kantor (umumnya Jakarta) dan jarak jauh. Tim mengatur ritme on-site mingguan sesuai kebutuhan kolaborasi.' },
  { name: 'Bandung', slug: 'bandung', emoji: '🏔️', description: 'Hub support dan beberapa peran operasional. Komunitas kerja yang erat dengan ekosistem startup dan kampus.' },
  { name: 'Surabaya', slug: 'surabaya', emoji: '⚓', description: 'Hub sales enterprise untuk wilayah Indonesia Timur. Peran berfokus pada partnership dan account management dengan korporasi besar regional.' },
]

export function findCareerLocation(slug: string): CareerLocationMeta | undefined {
  return CAREER_LOCATIONS_META.find((l) => l.slug === slug)
}

/** Match an opening to a location by tokenizing on " / " (case-insensitive). */
export function openingInLocation(
  opening: { location: string },
  location: CareerLocationMeta,
): boolean {
  const tokens = opening.location.split(/\s*\/\s*/).map((t) => t.trim().toLowerCase())
  return tokens.includes(location.name.toLowerCase())
}
