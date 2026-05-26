export type CourseTopic = {
  slug: string
  name: string
  emoji: string
  description: string
  /** Lowercase keywords matched against course title + description. */
  keywords: string[]
}

export const COURSE_TOPICS: CourseTopic[] = [
  {
    slug: 'engineering',
    name: 'Engineering',
    emoji: '⚛️',
    description: 'Pengembangan perangkat lunak: backend, frontend, mobile, infra.',
    keywords: [
      'engineering',
      'developer',
      'pemrograman',
      'react',
      'next',
      'node',
      'python',
      'java',
      'backend',
      'frontend',
      'mobile',
      'devops',
    ],
  },
  {
    slug: 'data',
    name: 'Data & AI',
    emoji: '📊',
    description: 'Analitik data, machine learning, dan kecerdasan buatan.',
    keywords: [
      'data',
      'machine learning',
      'ai',
      'analytics',
      'sql',
      'statistika',
      'pandas',
      'tensorflow',
    ],
  },
  {
    slug: 'design',
    name: 'Desain',
    emoji: '🎨',
    description: 'UI/UX, desain produk, dan riset pengguna.',
    keywords: [
      'design',
      'ui',
      'ux',
      'figma',
      'desain',
      'product design',
      'riset pengguna',
    ],
  },
  {
    slug: 'product',
    name: 'Produk',
    emoji: '🎯',
    description: 'Manajemen produk, strategi, dan eksperimen.',
    keywords: [
      'product',
      'produk',
      'product manager',
      'manajemen produk',
      'strategi',
    ],
  },
  {
    slug: 'marketing',
    name: 'Marketing',
    emoji: '📢',
    description: 'Digital marketing, branding, konten, dan growth.',
    keywords: [
      'marketing',
      'pemasaran',
      'seo',
      'iklan',
      'branding',
      'konten',
      'growth',
    ],
  },
  {
    slug: 'leadership',
    name: 'Kepemimpinan',
    emoji: '👑',
    description: 'Manajerial, kepemimpinan tim, dan komunikasi.',
    keywords: [
      'leadership',
      'kepemimpinan',
      'manajemen',
      'manager',
      'komunikasi',
    ],
  },
]

export function findCourseTopic(slug: string): CourseTopic | undefined {
  return COURSE_TOPICS.find((t) => t.slug === slug)
}

/** Returns courses whose title or description matches any of the topic's keywords (case-insensitive). */
export function matchesTopic(
  course: { title: string; description: string },
  topic: CourseTopic,
): boolean {
  const haystack = (course.title + ' ' + course.description).toLowerCase()
  return topic.keywords.some((kw) => haystack.includes(kw.toLowerCase()))
}
