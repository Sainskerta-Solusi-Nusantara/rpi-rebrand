export type CareerTeamMeta = {
  name: string
  slug: string
  emoji: string
  tagline: string
  description: string
}

export const CAREER_TEAM_META: CareerTeamMeta[] = [
  { name: 'Engineering', slug: 'engineering', emoji: '⚛️', tagline: 'Membangun platform multi-tenant skala juta', description: 'Tim Engineering SSN mendesain dan menjalankan infrastruktur yang menopang 2,4 juta pencari kerja dan 12.000+ mitra perekrut. Anda akan bekerja dengan TypeScript, Go, Postgres, dan platform cloud-native untuk mengirim sistem yang stabil di skala produksi.' },
  { name: 'Design', slug: 'design', emoji: '🎨', tagline: 'Membentuk pengalaman pencari kerja & perekrut', description: 'Designer di SSN memiliki produk dari riset hingga ship. Tim ini meliputi product design (consumer, partner dashboard, LMS) dan brand/content design untuk publikasi SSN Insight.' },
  { name: 'Product', slug: 'product', emoji: '🎯', tagline: 'Mengarahkan strategi dan eksperimen produk', description: 'PM di SSN menggerakkan metrik, bukan sekadar mengirim fitur. Tim Product bertanggung jawab atas surface talent, partner, dan academy — masing-masing dengan dampak terukur pada KPI inti.' },
  { name: 'Partnership', slug: 'partnership', emoji: '🤝', tagline: 'Menumbuhkan ekosistem mitra perekrut', description: 'Tim Partnership menjangkau perusahaan dari startup hingga BUMN — onboarding, retention, dan ekspansi. Kerja Anda mempengaruhi langsung kapasitas platform untuk membantu pencari kerja.' },
  { name: 'Marketing', slug: 'marketing', emoji: '📢', tagline: 'Cerita dan growth lintas kanal', description: 'Tim Marketing membangun mesin pertumbuhan untuk konsumen dan B2B — lifecycle, brand, content video, kampanye, dan publikasi riset.' },
  { name: 'Support', slug: 'support', emoji: '💬', tagline: 'Suara SSN ke pengguna sehari-hari', description: 'Tim Support adalah lini depan empati. Selain menyelesaikan tiket, mereka menjadi sumber utama insight produk dari frustrasi nyata pengguna.' },
  { name: 'Academy', slug: 'academy', emoji: '📚', tagline: 'Mendesain jalur belajar yang dipekerjakan', description: 'SSN Academy mendesain kurikulum yang menerjemahkan kompetensi industri menjadi outcome belajar terukur. Tim ini bekerja erat dengan industri dan mitra perekrut.' },
  { name: 'Operations', slug: 'operations', emoji: '🧭', tagline: 'Data, proses, dan kesehatan platform', description: 'Operations memastikan marketplace tetap sehat — analytics, riset, vendor management, dan optimasi proses lintas tim.' },
]

export function findCareerTeam(slug: string): CareerTeamMeta | undefined {
  return CAREER_TEAM_META.find((t) => t.slug === slug)
}
