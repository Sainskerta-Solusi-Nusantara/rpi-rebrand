// TEMPORARY DUMMY DATA — replace with prisma query / CMS once review is approved.

export type BlogCategory = {
  slug: string
  label: string
  color: string
  emoji?: string
  description?: string
}

export const BLOG_CATEGORIES: BlogCategory[] = [
  {
    slug: 'all',
    label: 'Semua',
    color: '#0A2540',
  },
  {
    slug: 'tips-karier',
    label: 'Tips Karier',
    color: '#635BFF',
    emoji: '🎯',
    description:
      'Panduan praktis untuk setiap tahap karier — CV yang dilirik, interview yang sukses, negosiasi gaji, hingga keputusan job hopping. Disusun dari data dan wawancara dengan ratusan recruiter.',
  },
  {
    slug: 'rekrutmen',
    label: 'Rekrutmen',
    color: '#10B981',
    emoji: '🔍',
    description:
      'Untuk perekrut dan tim TA: framework hiring modern, JD yang menarik kandidat berkualitas, employer branding, dan praktik wawancara yang benar-benar memprediksi performa.',
  },
  {
    slug: 'gaji',
    label: 'Gaji & Industri',
    color: '#F59E0B',
    emoji: '💰',
    description:
      'Benchmark gaji terkini, tren industri, dan laporan riset State of Work. Berbasis data anonim dari ribuan perusahaan dan jutaan profesional di seluruh Indonesia.',
  },
  {
    slug: 'skills',
    label: 'Skill & Belajar',
    color: '#0EA5E9',
    emoji: '📚',
    description:
      'Apa yang harus dipelajari di 2026, kursus yang benar-benar berbayar (atau tidak), dan roadmap belajar untuk transisi karier. Fokus pada outcome, bukan koleksi sertifikat.',
  },
  {
    slug: 'kepemimpinan',
    label: 'Kepemimpinan',
    color: '#EC4899',
    emoji: '🧭',
    description:
      'Untuk manajer baru dan pemimpin yang berkembang: 1-on-1 yang berguna, memberi feedback yang berdampak, mengelola tim lintas generasi, dan menghindari jebakan manajer pemula.',
  },
  {
    slug: 'cerita',
    label: 'Cerita Pekerja',
    color: '#8B5CF6',
    emoji: '✨',
    description:
      'Cerita personal dari pekerja Indonesia — career switch, pindah kota, membangun karier sambil ngurus keluarga, dan keputusan-keputusan kecil yang menentukan hidup profesional.',
  },
]

export function findCategory(slug: string): BlogCategory | undefined {
  return BLOG_CATEGORIES.find((c) => c.slug === slug)
}

export function articlesByCategory(slug: string): BlogArticle[] {
  return BLOG_ARTICLES.filter((a) => a.category === slug).sort(
    (a, b) => (a.dateIso < b.dateIso ? 1 : -1),
  )
}

export type BlogAuthor = {
  name: string
  role: string
  bio: string
  initial: string
  color: string
}

const AUTHORS = {
  riset: {
    name: 'Tim Riset SSN',
    role: 'Insight Editorial',
    bio: 'Tim editorial dan riset SSN Pekerja menerbitkan studi tahunan dan laporan industri berbasis data dari jutaan pengguna platform.',
    initial: 'RP',
    color: '#0A2540',
  },
  andi: {
    name: 'Andi Wijaya',
    role: 'Senior Career Coach',
    bio: 'Career coach dengan 12+ tahun pengalaman, eks-recruiter di Gojek dan Stripe. Telah membimbing 5.000+ profesional dalam transisi karier.',
    initial: 'AW',
    color: '#635BFF',
  },
  citra: {
    name: 'Citra Lestari',
    role: 'Head of TA, SSN',
    bio: 'Memimpin Talent Acquisition di SSN. Sebelumnya membangun fungsi TA dari nol di tiga unicorn Indonesia.',
    initial: 'CL',
    color: '#EC4899',
  },
  data: {
    name: 'Tim Data SSN',
    role: 'Compensation Research',
    bio: 'Tim riset gaji dan kompensasi SSN menerbitkan benchmark industri kuartalan berbasis data anonim dari ribuan perusahaan mitra.',
    initial: 'TD',
    color: '#F59E0B',
  },
  eko: {
    name: 'Eko Pratama',
    role: 'AI Practitioner',
    bio: 'Engineer dan praktisi AI yang aktif menulis tentang penerapan AI untuk audiens non-teknis. Eks-engineer di tim ML Tokopedia.',
    initial: 'EP',
    color: '#0EA5E9',
  },
  fitri: {
    name: 'Fitri Handayani',
    role: 'Leadership Coach',
    bio: 'Eks-HR Director, sekarang leadership coach bersertifikasi ICF. Telah mendampingi 200+ manajer baru di tahun pertama mereka.',
    initial: 'FH',
    color: '#10B981',
  },
  hana: {
    name: 'Hana Putri',
    role: 'Data Engineer, Tokopedia',
    bio: 'Akuntan yang transisi menjadi data engineer dalam 18 bulan. Aktif membagikan perjalanan career-switch lewat tulisan praktis.',
    initial: 'HP',
    color: '#8B5CF6',
  },
  dewi: {
    name: 'Dewi Anggraini',
    role: 'Talent Brand Lead',
    bio: 'Spesialis employer branding dengan latar belakang content marketing. Membantu mitra SSN membangun talent funnel yang berkualitas.',
    initial: 'DA',
    color: '#10B981',
  },
  budi: {
    name: 'Budi Santoso',
    role: 'Career Counselor',
    bio: 'Career counselor untuk fresh graduate dan early-career professionals. Spesialis dalam membantu pencari kerja pertama kali.',
    initial: 'BS',
    color: '#F59E0B',
  },
  indra: {
    name: 'Indra Kusuma',
    role: 'Learning Strategist',
    bio: 'Eks-Head of L&D di Telkom Group. Reviewer aktif kursus online dan platform pembelajaran untuk audiens Indonesia.',
    initial: 'IK',
    color: '#0EA5E9',
  },
  joko: {
    name: 'Joko Susilo',
    role: 'Org Design Consultant',
    bio: 'Konsultan organizational design yang berfokus pada tim lintas-generasi. Penulis buku "Memimpin Tim Multi-Generasi".',
    initial: 'JS',
    color: '#EC4899',
  },
  gilang: {
    name: 'Gilang Ramadhan',
    role: 'Mobile Developer, Freelance',
    bio: 'Mobile developer freelance yang pindah dari Jakarta ke Yogyakarta. Aktif menulis tentang trade-off remote-life di Indonesia.',
    initial: 'GR',
    color: '#8B5CF6',
  },
} as const

export type BlogSection =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'list'; items: string[]; ordered?: boolean }
  | { type: 'quote'; text: string; author?: string }
  | { type: 'callout'; title: string; body: string; tone?: 'info' | 'warn' | 'tip' }
  | { type: 'image'; emoji: string; caption?: string; gradient: [string, string] }

export type BlogArticle = {
  id: string
  slug: string
  title: string
  subtitle: string
  category: string
  author: BlogAuthor
  date: string
  dateIso: string
  readMin: number
  gradient: [string, string]
  emoji: string
  excerpt: string
  tags: string[]
  body: BlogSection[]
  featured?: boolean
}

export const BLOG_ARTICLES: BlogArticle[] = [
  {
    id: '0',
    slug: 'state-of-work-indonesia-2026',
    title: 'State of Work Indonesia 2026: Apa yang Berubah dalam 12 Bulan Terakhir',
    subtitle:
      'Riset tahunan terhadap 12.400 pekerja dan 480 perekrut di seluruh Indonesia mengungkap tiga pergeseran besar dalam ekspektasi karier, gaji, dan budaya kerja.',
    category: 'gaji',
    author: AUTHORS.riset,
    date: '20 Mei 2026',
    dateIso: '2026-05-20',
    readMin: 14,
    gradient: ['#0A2540', '#635BFF'],
    emoji: '📊',
    excerpt:
      'Riset tahunan terhadap 12.400 pekerja dan 480 perekrut di seluruh Indonesia. Kami menemukan tiga pergeseran besar dalam ekspektasi karier, gaji, dan budaya kerja — termasuk fakta bahwa "remote-first" tidak lagi menjadi pemenang otomatis.',
    tags: ['Riset', 'State of Work', 'Indonesia', '2026'],
    featured: true,
    body: [
      {
        type: 'p',
        text: 'Selama tiga bulan terakhir, tim riset SSN bekerja sama dengan 480 perekrut di 12 industri dan menyurvei 12.400 pekerja aktif di seluruh provinsi Indonesia. Hasilnya: tiga pergeseran besar yang akan menentukan strategi rekrutmen dan retensi di sisa 2026 dan masuk 2027.',
      },
      {
        type: 'callout',
        title: 'Ringkasan utama',
        tone: 'info',
        body: 'Remote-first kehilangan momentum, ekspektasi gaji junior naik tajam, dan hybrid 2-3 hari muncul sebagai konfigurasi yang paling diinginkan kedua sisi pasar — bukan kompromi, tapi pemenang sebenarnya.',
      },
      { type: 'h2', text: '1. Remote tidak lagi menjadi pemenang otomatis' },
      {
        type: 'p',
        text: 'Pada survei kami 2024, 68% pekerja Indonesia memilih full-remote sebagai konfigurasi ideal. Pada 2026, angka itu turun ke 41% — bukan karena perusahaan memaksa balik ke kantor, tetapi karena pekerja sendiri yang berubah pikiran setelah mengalami isolasi profesional.',
      },
      {
        type: 'list',
        items: [
          '41% pekerja memilih hybrid 2–3 hari di kantor (naik dari 22% di 2024)',
          '38% memilih full-remote (turun dari 68%)',
          '21% memilih full on-site (naik dari 10%)',
        ],
      },
      {
        type: 'p',
        text: 'Yang menarik: pekerja yang paling kuat menginginkan kembali ke kantor adalah mereka yang berusia 22–28 tahun — generasi yang ingin belajar dari rekan senior dan membangun jaringan. Pekerja 35+ tetap mempertahankan preferensi remote.',
      },
      { type: 'h2', text: '2. Ekspektasi gaji junior naik 23% YoY' },
      {
        type: 'p',
        text: 'Junior software engineer di Jakarta saat ini meminta median Rp 11,5 juta untuk peran entry-level (1-2 tahun pengalaman), naik dari Rp 9,3 juta di 2024. Industri lain mengikuti pola serupa: junior product designer minta median Rp 9,8 juta (dari Rp 7,5 juta), junior data analyst Rp 9 juta (dari Rp 7,2 juta).',
      },
      {
        type: 'quote',
        text: 'Banyak perekrut belum menyesuaikan band gaji dengan ekspektasi pasar 2026. Kami melihat 6 dari 10 ofertura ditolak karena di bawah ekspektasi kandidat junior.',
        author: 'Citra Lestari, Head of TA SSN',
      },
      { type: 'h2', text: '3. Manfaat non-tunai jadi pembeda' },
      {
        type: 'p',
        text: 'Ketika gaji semakin kompetitif, kandidat membuat keputusan berdasarkan benefit. Tiga benefit yang paling sering disebut sebagai "tie-breaker" di survei kami:',
      },
      {
        type: 'list',
        ordered: true,
        items: [
          'Anggaran belajar mandiri (Rp 8-15jt/tahun) — disebut oleh 67% kandidat',
          'Asuransi mental health yang menyeluruh — 54%',
          'Cuti tanpa pertanyaan ("trust-based PTO") — 48%',
        ],
      },
      {
        type: 'p',
        text: 'Yang menarik: bonus uang tunai berada di urutan ke-7, di bawah benefit seperti home office allowance dan parental leave. Pesan untuk perekrut: jika band gaji sulit naik, fokus ke benefit.',
      },
      { type: 'h2', text: 'Apa artinya untuk perekrut?' },
      {
        type: 'callout',
        title: 'Rekomendasi tindakan',
        tone: 'tip',
        body: 'Audit ulang band gaji terutama untuk junior level. Pertimbangkan menawarkan hybrid 2-3 hari sebagai default, bukan exception. Tinjau benefit non-tunai — investasi di learning budget dan mental health berdampak lebih besar pada konversi offer daripada bonus tunai.',
      },
      {
        type: 'p',
        text: 'Riset lengkap tersedia gratis untuk semua mitra SSN di dashboard mereka. Jika Anda bukan mitra, ringkasan PDF (24 halaman) dapat diunduh dari halaman press kit kami.',
      },
    ],
  },
  {
    id: '1',
    slug: 'cv-yang-dilirik-recruiter',
    title: 'CV yang Dilirik Recruiter dalam 7 Detik Pertama',
    subtitle:
      'Hasil eye-tracking dari 60 recruiter senior — apa yang mereka cari, apa yang mereka lewati, dan urutan yang paling penting.',
    category: 'tips-karier',
    author: AUTHORS.andi,
    date: '18 Mei 2026',
    dateIso: '2026-05-18',
    readMin: 8,
    gradient: ['#635BFF', '#0EA5E9'],
    emoji: '📝',
    excerpt:
      'Hasil eye-tracking dari 60 recruiter senior — apa yang mereka cari, apa yang mereka lewati, dan urutan yang paling penting.',
    tags: ['CV', 'Resume', 'Karier', 'Recruiter'],
    body: [
      {
        type: 'p',
        text: 'Kami baru saja menyelesaikan studi eye-tracking dengan 60 recruiter senior dari 8 industri. Mereka diberi 240 CV dan diminta menyaring seperti pekerjaan sehari-hari. Setiap mata gerakan, fiksasi, dan keputusan direkam.',
      },
      { type: 'h2', text: 'Recruiter benar-benar hanya menatap 7,4 detik per CV' },
      {
        type: 'p',
        text: 'Median waktu fiksasi pertama per CV adalah 7,4 detik. Setelah itu, mata mereka sudah meraba ke CV berikutnya. Dalam 7 detik tersebut, tatapan mereka konsisten mengikuti pola Z: kiri atas → kanan atas → tengah → kiri bawah → kanan bawah.',
      },
      { type: 'h2', text: 'Tiga elemen yang paling banyak dilihat' },
      {
        type: 'list',
        ordered: true,
        items: [
          'Nama dan jabatan terbaru (98% recruiter melihat dalam 2 detik pertama)',
          'Nama perusahaan terbaru (94% — bahkan sebelum melihat jabatan)',
          'Tahun lulus atau pendidikan tertinggi (87% — terutama untuk early-career)',
        ],
      },
      {
        type: 'p',
        text: 'Yang sering diabaikan: cover letter (hanya 14% yang membuka), foto (38% tidak melihat sama sekali), dan daftar skill di bagian bawah (52% tidak baca lengkap).',
      },
      { type: 'h2', text: 'Apa yang membuat CV lolos 7 detik?' },
      {
        type: 'callout',
        title: 'Format yang berhasil',
        tone: 'tip',
        body: 'Letakkan jabatan + perusahaan terbaru di baris paling atas, sebelum nama Anda. Tulis 1 baris ringkasan dampak di bawahnya. Daftar pengalaman dengan format "Achievement → Dampak terukur" daripada list tugas.',
      },
      {
        type: 'quote',
        text: 'CV yang terbaik dalam studi kami adalah yang membaca seperti 1 halaman LinkedIn — bukan riwayat hidup formal. Tujuannya bukan menceritakan siapa Anda, tetapi membuktikan bahwa Anda menyelesaikan masalah serupa.',
        author: 'Andi Wijaya, Senior Career Coach',
      },
      { type: 'h2', text: 'Tiga kesalahan paling umum' },
      {
        type: 'list',
        items: [
          'Bullet point yang mendeskripsikan tugas, bukan dampak ("Bertanggung jawab atas marketing campaign" → "Memimpin campaign yang menghasilkan Rp 2,3M revenue baru dalam 6 bulan")',
          'CV 3+ halaman untuk early-career (recruiter berhenti di halaman 2 — 81% kasus)',
          'Daftar skill yang generik tanpa konteks ("Communication, Teamwork, Leadership" → sebut konteks: "Memimpin 4 designer cross-functional")',
        ],
      },
      { type: 'h2', text: 'Bukti dari A/B test' },
      {
        type: 'p',
        text: 'Setelah studi eye-tracking, kami meminta 30 alumni SSN Academy untuk merevisi CV mereka sesuai panduan ini lalu mengirim ulang ke role yang sama. Hasilnya: callback rate naik dari 12% menjadi 31% — peningkatan 2,6×.',
      },
    ],
  },
  {
    id: '2',
    slug: 'gaji-product-manager-2026',
    title: 'Gaji Product Manager Indonesia 2026: Junior sampai VP',
    subtitle:
      'Benchmark dari 1.200 PM aktif. Dipisah per industri, tahap perusahaan, dan jenjang — plus paket saham yang lazim ditawarkan.',
    category: 'gaji',
    author: AUTHORS.data,
    date: '15 Mei 2026',
    dateIso: '2026-05-15',
    readMin: 12,
    gradient: ['#F59E0B', '#EF4444'],
    emoji: '💰',
    excerpt:
      'Benchmark dari 1.200 PM aktif. Dipisah per industri, tahap perusahaan, dan jenjang — plus paket saham yang lazim ditawarkan.',
    tags: ['Gaji', 'Product Manager', 'Benchmark', '2026'],
    body: [
      {
        type: 'p',
        text: 'Setiap tahun kami mensurvei gaji Product Manager Indonesia. Edisi 2026 ini berbasis 1.200 PM aktif dari 8 industri — dari fintech early-stage sampai BUMN besar. Semua angka adalah median, dengan range P25–P75 untuk konteks.',
      },
      { type: 'h2', text: 'Junior PM (0–2 tahun): Rp 12–18jt' },
      {
        type: 'p',
        text: 'Median Junior PM Indonesia: Rp 14,8jt/bulan. Range P25–P75 berkisar Rp 12jt sampai Rp 18jt. Industri tertinggi: fintech (Rp 16,5jt median), terendah: BUMN dan tradisional (Rp 11jt).',
      },
      {
        type: 'callout',
        title: 'Catatan untuk junior',
        tone: 'tip',
        body: 'Saham/RSU di startup berseri B+ biasanya senilai 0,02–0,05% equity, vesting 4 tahun. Nilai matematis tergantung valuasi — di unicorn (USD 1B+), 0,02% = ~USD 200K total kalau exit di valuasi sama.',
      },
      { type: 'h2', text: 'Mid PM (2–5 tahun): Rp 22–35jt' },
      {
        type: 'p',
        text: 'Median Mid PM: Rp 27jt/bulan. Posisi ini paling banyak variasinya karena scope bisa sangat berbeda — dari mengelola 1 produk kecil sampai memimpin proyek lintas tim. PM dengan track record memimpin feature impactful (>10% gain di metric utama) berada di P75 ke atas.',
      },
      { type: 'h2', text: 'Senior PM (5–8 tahun): Rp 35–55jt' },
      {
        type: 'p',
        text: 'Median Senior PM: Rp 42jt/bulan. Senior PM di unicorn dan top-tier (Gojek, Tokopedia, GoTo Financial) bisa mencapai Rp 60jt+ dengan saham terpisah. Senior PM di Telkom dan BUMN biasanya di band Rp 32-40jt tapi dengan benefit struktural yang besar.',
      },
      { type: 'h2', text: 'Lead / Group PM: Rp 55–85jt' },
      {
        type: 'p',
        text: 'Lead atau Group PM mulai berperan sebagai pemimpin tim 3-6 PM. Median: Rp 65jt. Range besar tergantung apakah individual contributor atau people manager — yang second cenderung lebih tinggi.',
      },
      { type: 'h2', text: 'Director of Product: Rp 75–120jt' },
      {
        type: 'p',
        text: 'Director mengelola portofolio dengan ownership P&L. Median: Rp 90jt. Pada level ini, base salary mulai diimbangi dengan bonus performa (15-30% dari base) dan paket saham yang lebih substantial.',
      },
      { type: 'h2', text: 'VP / CPO: Rp 120jt+' },
      {
        type: 'p',
        text: 'VP Product mulai dari Rp 120jt, dengan median Rp 150jt. CPO di unicorn bisa mencapai Rp 200-300jt dengan equity 0,5-2%. Pada level ini, total compensation lebih bermakna daripada base — dan negosiasi sangat individual.',
      },
      { type: 'h2', text: 'Catatan tentang remote' },
      {
        type: 'p',
        text: 'Remote PM Indonesia yang bekerja untuk perusahaan US/Singapura mendapatkan 30-80% premium dibandingkan rate Indonesia. Tetapi pajak, kompleksitas employment, dan jam kerja yang lebih ekstrem membuatnya bukan untuk semua orang. Data lengkap di laporan PDF.',
      },
    ],
  },
  {
    id: '3',
    slug: 'interview-perilaku-yang-bekerja',
    title: 'Interview Perilaku yang Benar-Benar Bekerja (STAR sudah lewat)',
    subtitle:
      'Framework STAR mulai usang. Ini metode baru yang dipakai tim TA di Stripe dan Gojek — lebih cepat, lebih akurat.',
    category: 'rekrutmen',
    author: AUTHORS.citra,
    date: '12 Mei 2026',
    dateIso: '2026-05-12',
    readMin: 10,
    gradient: ['#10B981', '#0EA5E9'],
    emoji: '🎯',
    excerpt:
      'Framework STAR mulai usang. Ini metode baru yang dipakai tim TA di Stripe dan Gojek — lebih cepat, lebih akurat.',
    tags: ['Interview', 'Rekrutmen', 'TA', 'Hiring'],
    body: [
      {
        type: 'p',
        text: 'STAR (Situation, Task, Action, Result) telah menjadi framework default selama dua dekade. Tapi setelah memimpin proses hiring di 3 unicorn dan menganalisis 4.000+ interview, kami menemukan bahwa STAR sebenarnya buruk dalam memprediksi performa.',
      },
      { type: 'h2', text: 'Masalah dengan STAR' },
      {
        type: 'p',
        text: 'STAR mengajak kandidat menyiapkan cerita rapih. Tapi kerja nyata bukan cerita rapih — kerja nyata adalah keputusan ambigu, trade-off yang sulit, dan iterasi setelah gagal. STAR melatih kandidat untuk meratakan kompleksitas ini.',
      },
      {
        type: 'quote',
        text: 'Saya bisa beri saya 10 menit dan saya akan menulis cerita STAR yang sempurna untuk pertanyaan apapun. Yang membedakan kandidat hebat dari yang baik adalah saat saya keluar dari skenario — saat saya tanya "bagaimana kalau bos Anda menentang keputusan tersebut?"',
        author: 'Citra Lestari, Head of TA SSN',
      },
      { type: 'h2', text: 'Framework baru: ASTRO' },
      {
        type: 'p',
        text: 'Setelah eksperimen di tim TA Stripe dan Gojek, kami mengonsolidasi pendekatan ke framework yang kami sebut ASTRO: Anchor, Stakes, Trade-off, Reflection, Outcome.',
      },
      {
        type: 'list',
        ordered: true,
        items: [
          'Anchor — Apa konteks waktu dan organisasi spesifik? (Bukan "di pekerjaan saya sebelumnya" — tapi "Q2 2024 saat tim baru di-restructure")',
          'Stakes — Apa yang akan terjadi kalau salah? (Bukan tugas, tapi konsekuensi)',
          'Trade-off — Pilihan apa yang ditolak dan kenapa?',
          'Reflection — Kalau diulang, apa yang akan dilakukan berbeda?',
          'Outcome — Hasil terukur dan apa yang dipelajari',
        ],
      },
      { type: 'h2', text: 'Mengapa ini bekerja lebih baik' },
      {
        type: 'p',
        text: 'ASTRO sulit dipersiapkan karena 4 dari 5 elemen membutuhkan refleksi nyata, bukan storytelling. "Trade-off" terutama sulit dipalsu — karena kandidat harus tahu pilihan apa yang ada dan kenapa salah satu dipilih.',
      },
      { type: 'h2', text: 'Contoh pertanyaan dengan ASTRO' },
      {
        type: 'callout',
        title: 'Pertanyaan: Ceritakan pengalaman menerima feedback sulit',
        tone: 'info',
        body: 'Anchor: Kapan? Konteksnya? · Stakes: Apa risiko kalau Anda tidak meresponse? · Trade-off: Anda pilih X atau Y? Kenapa X? · Reflection: Kalau diulang? · Outcome: Apa yang berubah dan apa yang dipelajari?',
      },
      {
        type: 'p',
        text: 'Test ASTRO di tim TA Stripe Singapore menunjukkan korelasi hire-to-performance yang 1,4× lebih tinggi dibandingkan STAR setelah 6 bulan. Kami sedang menulis playbook lengkap untuk mitra SSN — keluar akhir bulan ini.',
      },
    ],
  },
  {
    id: '4',
    slug: 'belajar-ai-untuk-non-teknis',
    title: 'Belajar AI Tanpa Latar Belakang Teknis: 30 Hari Pertama',
    subtitle:
      'Roadmap praktis untuk marketer, finance, dan ops yang ingin jadi lebih relevan. Tanpa coding wajib, tanpa hype.',
    category: 'skills',
    author: AUTHORS.eko,
    date: '10 Mei 2026',
    dateIso: '2026-05-10',
    readMin: 11,
    gradient: ['#0EA5E9', '#8B5CF6'],
    emoji: '🤖',
    excerpt:
      'Roadmap praktis untuk marketer, finance, dan ops yang ingin jadi lebih relevan. Tanpa coding wajib, tanpa hype.',
    tags: ['AI', 'Skill', 'Belajar', 'Career'],
    body: [
      {
        type: 'p',
        text: 'Setiap minggu saya menerima 5-10 DM dari profesional non-teknis yang bertanya: "Bagaimana saya mulai belajar AI?" Sebagian besar artikel di internet menjawab dengan kursus Python atau matematika berat. Itu salah arah.',
      },
      { type: 'h2', text: 'Anda tidak perlu coding untuk relevan dengan AI' },
      {
        type: 'p',
        text: 'Yang dibutuhkan adalah literasi AI — kemampuan memilih, mengevaluasi, dan menggunakan AI sebagai alat. Hanya kalau Anda ingin membangun AI dari nol, baru perlu coding. Kebanyakan dari kita perlu menggunakan AI lebih baik.',
      },
      { type: 'h2', text: 'Minggu 1: Penggunaan praktis' },
      {
        type: 'list',
        items: [
          'Gunakan ChatGPT/Claude untuk 5 tugas kerja Anda setiap hari. Bukan satu, lima.',
          'Catat: apa yang berhasil? Apa yang gagal? Pola apa yang muncul?',
          'Pelajari "prompt engineering" praktis — bukan teori, tapi pola yang bekerja',
        ],
      },
      { type: 'h2', text: 'Minggu 2: Memahami cara kerja LLM (tanpa matematika)' },
      {
        type: 'p',
        text: 'Bukan: "apa itu transformer architecture?" — tapi: kenapa model kadang halusinasi? Kapan model bisa diandalkan? Kapan tidak? Tonton 2-3 video YouTube non-teknis (3Blue1Brown, Andrej Karpathy edisi pemula).',
      },
      {
        type: 'callout',
        title: 'Mental model yang berguna',
        tone: 'tip',
        body: 'LLM adalah "rata-rata internet yang lebih kompak". Kalau topiknya jarang ada di internet (mis. data internal Anda), output akan buruk. Kalau topiknya banyak di internet, output bisa sangat berguna.',
      },
      { type: 'h2', text: 'Minggu 3: Tools spesifik bidang Anda' },
      {
        type: 'p',
        text: 'Marketer: HubSpot AI, Jasper, Copy.ai. Finance: Excel Copilot, Patronus, Pry. Ops: Notion AI, Asana AI. Pilih 2-3 yang langsung relevan dengan rutinitas Anda. Habiskan 1 minggu memakai setiap hari.',
      },
      { type: 'h2', text: 'Minggu 4: Membangun "small AI workflow"' },
      {
        type: 'p',
        text: 'Pilih 1 alur kerja yang Anda lakukan rutin (misalnya: bulanan report, brief campaign, audit transaksi). Bangun versi AI-augmented. Tidak perlu coding — gunakan Zapier, Make, atau Notion templates.',
      },
      {
        type: 'quote',
        text: 'Profesional yang lebih efektif di 2026 bukan yang tahu teori AI paling banyak — tapi yang paling banyak mengintegrasikan AI ke pekerjaan sehari-hari mereka.',
        author: 'Eko Pratama',
      },
      { type: 'h2', text: 'Setelah 30 hari' },
      {
        type: 'p',
        text: 'Setelah 30 hari, Anda akan tahu apakah AI relevan untuk peran Anda dan ke mana arah belajar berikutnya. Sebagian akan ingin lebih teknis (mulai SQL, kemudian Python). Sebagian akan fokus jadi ahli "AI orchestrator" di bidangnya. Keduanya valid.',
      },
    ],
  },
  {
    id: '5',
    slug: 'menjadi-pemimpin-baru',
    title: 'Bulan Pertama sebagai Pemimpin Baru: Panduan 30-60-90',
    subtitle:
      'Bagaimana memenangkan kepercayaan tim tanpa terdengar palsu — disusun dari wawancara 28 manajer baru di tahun pertama.',
    category: 'kepemimpinan',
    author: AUTHORS.fitri,
    date: '8 Mei 2026',
    dateIso: '2026-05-08',
    readMin: 9,
    gradient: ['#EC4899', '#F59E0B'],
    emoji: '🧭',
    excerpt:
      'Bagaimana memenangkan kepercayaan tim tanpa terdengar palsu — disusun dari wawancara 28 manajer baru di tahun pertama.',
    tags: ['Leadership', 'Manajer Baru', '30-60-90'],
    body: [
      {
        type: 'p',
        text: 'Sebagai leadership coach, saya pernah mendampingi 200+ manajer baru. Yang membedakan mereka yang sukses dari yang tidak bukan kepintaran atau pengalaman — tapi apa yang mereka lakukan di 90 hari pertama.',
      },
      { type: 'h2', text: 'Hari 1–30: Mendengarkan lebih banyak dari berbicara' },
      {
        type: 'p',
        text: 'Banyak manajer baru tergoda untuk "buat impresi" di bulan pertama dengan keputusan besar. Itu kesalahan. Bulan pertama adalah untuk mendengarkan — mengerti tim, konteks, sejarah, dan dinamika sebelum Anda mengubah apapun.',
      },
      {
        type: 'list',
        ordered: true,
        items: [
          '1-on-1 dengan setiap anggota tim — 45 menit, fokus pada cerita karier mereka',
          '1-on-1 dengan rekan manajer dan stakeholder utama',
          'Audit dokumentasi tim (handbook, OKR sebelumnya, post-mortem)',
          'Observe meeting tanpa intervensi — pelajari pola interaksi',
        ],
      },
      {
        type: 'callout',
        title: 'Pertanyaan magic untuk 1-on-1 pertama',
        tone: 'tip',
        body: '"Apa yang akan membuat 6 bulan ke depan menjadi tahun terbaik karier Anda?" — Pertanyaan ini mengungkap motivasi, aspirasi, dan friction yang tidak akan keluar dari pertanyaan standar.',
      },
      { type: 'h2', text: 'Hari 31–60: Memberi sinyal kecil yang konsisten' },
      {
        type: 'p',
        text: 'Setelah 30 hari, Anda mulai punya pemahaman. Sekarang bukan saatnya keputusan besar — tapi saatnya memberi sinyal kecil tentang prioritas Anda. Setiap meeting, setiap feedback, setiap email adalah sinyal.',
      },
      {
        type: 'quote',
        text: 'Tim membaca Anda dari konsistensi mikro — apa yang Anda puji, apa yang Anda lewati, apa yang Anda response cepat, apa yang Anda biarkan lama. Lebih dari pengumuman besar, ini yang membentuk budaya tim.',
        author: 'Fitri Handayani',
      },
      { type: 'h2', text: 'Hari 61–90: Mulai mengubah dengan bukti' },
      {
        type: 'p',
        text: 'Setelah 60 hari, Anda telah membangun cukup kredibilitas dan pemahaman untuk membuat perubahan. Tapi setiap perubahan harus disertai bukti — apa yang Anda lihat, kenapa ini penting, apa yang Anda harap berubah.',
      },
      {
        type: 'list',
        items: [
          'Mulai dari 1-2 perubahan kecil dengan ROI cepat',
          'Komunikasikan rasional secara transparan — termasuk apa yang masih unknown',
          'Akui kalau Anda salah arah — perubahan dengan reversal terhormat lebih baik dari ngotot dengan keputusan jelek',
        ],
      },
      { type: 'h2', text: 'Tiga kesalahan paling umum' },
      {
        type: 'list',
        items: [
          'Mengubah terlalu cepat tanpa konteks (tim merasa tidak didengar)',
          'Mencoba menjadi "teman" semua orang (tim kehilangan rasa pemimpin)',
          'Menghindari konflik sulit (tim kehilangan rasa kemudi)',
        ],
      },
    ],
  },
  {
    id: '6',
    slug: 'cerita-pindah-karier',
    title: 'Dari Akuntan ke Data Engineer: Perjalanan 18 Bulan Hana',
    subtitle:
      'Bukan cerita "berhenti dan ikut bootcamp". Hana mengubah karier sambil tetap bekerja — ini bagaimana ia melakukannya.',
    category: 'cerita',
    author: AUTHORS.hana,
    date: '5 Mei 2026',
    dateIso: '2026-05-05',
    readMin: 13,
    gradient: ['#8B5CF6', '#EC4899'],
    emoji: '✨',
    excerpt:
      'Bukan cerita "berhenti dan ikut bootcamp". Hana mengubah karier sambil tetap bekerja — ini bagaimana ia melakukannya.',
    tags: ['Cerita', 'Career Switch', 'Data Engineer'],
    body: [
      {
        type: 'p',
        text: 'Saya seorang akuntan selama 6 tahun. Sekarang saya data engineer di Tokopedia. Perpindahan ini memakan 18 bulan dan saya tetap bekerja full-time sebagai akuntan selama 14 bulan dari 18 itu. Ini cerita lengkapnya.',
      },
      { type: 'h2', text: 'Bulan 1–3: Membuktikan diri sendiri (tanpa orang lain tahu)' },
      {
        type: 'p',
        text: 'Saya tidak memberitahu siapapun tujuan saya di awal. Saya mulai dengan 1 jam setiap pagi sebelum kerja — kursus SQL gratis, lalu Python untuk data. Saya menghabiskan 200 jam selama 3 bulan ini sebelum bilang "saya serius tentang ini" pada diri sendiri.',
      },
      {
        type: 'callout',
        title: 'Pelajaran #1',
        tone: 'tip',
        body: 'Jangan umumkan career switch sampai Anda telah membuktikan 200+ jam komitmen. Banyak orang berhenti di minggu ke-3, dan pengumuman dini menambah tekanan sosial yang malah memperburuk.',
      },
      { type: 'h2', text: 'Bulan 4–8: Proyek nyata di pekerjaan saat ini' },
      {
        type: 'p',
        text: 'Setelah saya yakin saya bisa konsisten, saya mencari proyek SQL/data di pekerjaan saya saat ini. Tim finance saya butuh laporan otomatis, dan saya menawarkan untuk membangunnya. Selama 5 bulan, saya membangun 4 proyek data internal — dipakai oleh tim saya hingga sekarang.',
      },
      { type: 'h2', text: 'Bulan 9–12: Portfolio yang menjual' },
      {
        type: 'p',
        text: 'Saya menulis 8 case study di Medium tentang proyek internal saya (dengan persetujuan perusahaan). Setiap case study menjelaskan: konteks bisnis, masalah, solusi teknis, dan dampak terukur. Inilah portfolio saya — bukan kumpulan tutorial Coursera.',
      },
      {
        type: 'quote',
        text: 'Recruiter pertama yang menghubungi saya bilang: "Saya melihat case study Medium Anda — sangat unusual karena Anda menulis dari sudut bisnis, bukan teknik." Itu jadi advantage saya.',
      },
      { type: 'h2', text: 'Bulan 13–15: Interview & rejection' },
      {
        type: 'p',
        text: 'Saya mengajukan 47 lamaran. 32 ditolak otomatis (CV terlihat seperti akuntan). 12 interview, 9 ditolak setelah technical. 3 offer. Yang menarik: 3 offer ini semua adalah tim yang menyukai background akuntansi saya — mereka mencari "data engineer yang bisa bicara bisnis".',
      },
      { type: 'h2', text: 'Bulan 16–18: Onboarding dan imposter syndrome' },
      {
        type: 'p',
        text: 'Bulan pertama di Tokopedia adalah yang paling sulit. Saya merasa imposter setiap hari. Yang menyelamatkan saya: mengakui ini ke manajer di minggu pertama. Ia memberi saya buddy senior yang ditugaskan untuk membantu.',
      },
      { type: 'h2', text: 'Pelajaran untuk yang sedang menjalani' },
      {
        type: 'list',
        ordered: true,
        items: [
          'Hentikan menonton "career change in 6 months" — tidak realistis untuk 95% kasus',
          'Background lama Anda bukan beban — kalau ditarasikan dengan tepat, itu advantage',
          'Proyek di pekerjaan saat ini > tutorial kursus',
          'Tulis. Bahkan jika tidak ada yang baca. Tulisan adalah cermin pemahaman Anda',
          'Cari rekan switch — saya punya 4 teman di whatsapp group yang juga switching',
        ],
      },
    ],
  },
  {
    id: '7',
    slug: 'menulis-job-description-yang-menarik',
    title: 'Menulis Job Description yang Menarik (Bukan Salinan Template)',
    subtitle:
      'A/B test 240 JD menunjukkan tiga elemen yang meningkatkan apply rate 3.4×. Tidak ada yang melibatkan "fast-paced environment".',
    category: 'rekrutmen',
    author: AUTHORS.dewi,
    date: '3 Mei 2026',
    dateIso: '2026-05-03',
    readMin: 7,
    gradient: ['#10B981', '#F59E0B'],
    emoji: '✍️',
    excerpt:
      'A/B test 240 JD menunjukkan tiga elemen yang meningkatkan apply rate 3.4×. Tidak ada yang melibatkan "fast-paced environment".',
    tags: ['JD', 'Job Description', 'Rekrutmen'],
    body: [
      {
        type: 'p',
        text: 'Kami menjalankan A/B test pada 240 job description di platform SSN selama 4 bulan terakhir. Hasilnya: ada tiga elemen yang konsisten meningkatkan apply rate 3,4× — dan tidak satupun melibatkan kata "fast-paced", "rockstar", atau "ninja".',
      },
      { type: 'h2', text: '1. Tulis impact, bukan tugas' },
      {
        type: 'p',
        text: 'JD tradisional: "Anda akan bertanggung jawab atas content marketing." Versi yang menang: "Dalam 6 bulan pertama, Anda akan mendesain ulang funnel content kami yang saat ini melayani 200K visitor/bulan. Tujuan: peningkatan konversi dari 1,2% ke 2,5%."',
      },
      { type: 'h2', text: '2. Sebut tantangan, bukan kesempatan' },
      {
        type: 'p',
        text: 'JD biasa: "Bergabung dengan tim dinamis untuk kesempatan tumbuh!" Versi yang menang: "Tim ini baru saja restructure dan butuh seseorang yang bisa men-stabilkan proses sebelum scale. Bukan untuk Anda yang ingin operasi mulus — untuk Anda yang menikmati membangun dari setengah jadi."',
      },
      {
        type: 'callout',
        title: 'Kenapa ini bekerja',
        tone: 'info',
        body: 'Kandidat berkualitas tinggi mencari realitas, bukan glamour. JD yang jujur tentang tantangan menarik kandidat yang sudah siap untuknya — dan menyaring yang tidak.',
      },
      { type: 'h2', text: '3. Cantumkan band gaji' },
      {
        type: 'p',
        text: 'Ini paling kontroversial. Tapi data jelas: JD dengan range gaji eksplisit mendapat 2,8× lebih banyak apply, dan dari kandidat yang lebih cocok. Yang sering takut tentang transparansi adalah perusahaan yang membayar di bawah pasar.',
      },
      { type: 'h2', text: 'Daftar kata yang harus dihindari' },
      {
        type: 'list',
        items: [
          '"Rockstar", "ninja", "guru" — terdengar tidak profesional',
          '"Fast-paced environment" — cliche, tidak memberi informasi',
          '"Self-starter" — semua kandidat akan bilang mereka self-starter',
          '"Family-like culture" — sering jadi sinyal toxic boundaries',
          '"Competitive salary" — kalau benar-benar kompetitif, sebut angkanya',
        ],
      },
      { type: 'h2', text: 'Template yang berhasil' },
      {
        type: 'p',
        text: 'Struktur 4 bagian: (1) Misi peran dalam 1 paragraf, (2) Apa yang akan Anda capai dalam 6 bulan dengan target terukur, (3) Pengalaman yang dicari + nice-to-have, (4) Tentang tim, gaji, dan benefit secara jujur. Total: 400-600 kata. Lebih dari itu, kandidat tidak baca lengkap.',
      },
    ],
  },
  {
    id: '8',
    slug: 'remote-vs-hybrid-2026',
    title: 'Remote vs Hybrid 2026: Data Terbaru dari 850 Perusahaan Indonesia',
    subtitle:
      'Tren balik ke kantor nyata, tapi tidak seperti yang diberitakan. Inilah angka sebenarnya — dan apa artinya untuk Anda.',
    category: 'gaji',
    author: AUTHORS.riset,
    date: '1 Mei 2026',
    dateIso: '2026-05-01',
    readMin: 10,
    gradient: ['#0EA5E9', '#10B981'],
    emoji: '🏢',
    excerpt:
      'Tren balik ke kantor nyata, tapi tidak seperti yang diberitakan. Inilah angka sebenarnya — dan apa artinya untuk Anda.',
    tags: ['Remote', 'Hybrid', 'Future of Work'],
    body: [
      {
        type: 'p',
        text: 'Headline media: "Perusahaan memaksa karyawan kembali ke kantor." Realitanya jauh lebih nuansa. Data dari 850 perusahaan Indonesia yang kami survei menunjukkan gambaran berbeda.',
      },
      { type: 'h2', text: 'Tren utama: konsolidasi ke hybrid 2-3 hari' },
      {
        type: 'list',
        items: [
          '52% perusahaan: hybrid 2-3 hari di kantor (naik dari 31% di 2024)',
          '24% perusahaan: full on-site (turun dari 38%)',
          '18% perusahaan: full remote (turun dari 24%)',
          '6% perusahaan: hybrid 4 hari di kantor',
        ],
      },
      {
        type: 'p',
        text: 'Yang menarik: bukan full on-site yang menang, bukan juga full remote. Hybrid 2-3 hari muncul sebagai konfigurasi yang paling diinginkan kedua sisi pasar.',
      },
      { type: 'h2', text: 'Industri mana yang paling remote-friendly?' },
      {
        type: 'p',
        text: 'Tech (78% hybrid atau remote), keuangan digital/fintech (66%), media digital (62%) adalah top-3. Yang paling on-site: manufaktur (94% on-site), konstruksi (98%), F&B (89%).',
      },
      { type: 'h2', text: 'Apa yang dikatakan pekerja?' },
      {
        type: 'p',
        text: 'Survei 12.400 pekerja kami menunjukkan: 41% memilih hybrid 2-3 hari sebagai ideal, 38% memilih full remote, 21% full on-site. Penting: ada gap antara apa yang ditawarkan (24% full on-site) dan apa yang diinginkan (21%) — artinya beberapa pekerja "terjebak" di config yang tidak ideal.',
      },
      {
        type: 'quote',
        text: 'Pertanyaan untuk perekrut bukan "remote atau on-site" tapi "apa kombinasi yang menarik kandidat berkualitas tertinggi untuk peran ini". Untuk engineer senior: hybrid 2 hari menang. Untuk junior: hybrid 3-4 hari menang karena mereka butuh mentoring langsung.',
        author: 'Tim Riset SSN',
      },
      { type: 'h2', text: 'Implikasi untuk pekerja' },
      {
        type: 'p',
        text: 'Kalau Anda mencari kerja: full remote semakin langka dan kompetitif. Kalau Anda fleksibel di hybrid 2-3 hari, opsi terbuka 3× lebih banyak. Kalau Anda commit on-site, kompetisi turun signifikan.',
      },
      { type: 'h2', text: 'Implikasi untuk perekrut' },
      {
        type: 'p',
        text: 'Jangan ikut tren begitu saja — pelajari konfigurasi mana yang menghasilkan output terbaik untuk tim Anda. Ada perusahaan yang memilih full remote karena tim mereka senior dan punya skill kerja remote yang matang. Ada yang memilih on-site karena nature pekerjaan (mis. R&D hardware). Both legitimate.',
      },
    ],
  },
  {
    id: '9',
    slug: 'fresh-graduate-2026',
    title: 'Fresh Graduate 2026: 12 Skill yang Membuat Anda Outlier',
    subtitle:
      'Bukan daftar generik. Disusun dari survei 200+ hiring manager — fokus pada yang sebenarnya membedakan kandidat pemula.',
    category: 'tips-karier',
    author: AUTHORS.budi,
    date: '28 April 2026',
    dateIso: '2026-04-28',
    readMin: 9,
    gradient: ['#F59E0B', '#0EA5E9'],
    emoji: '🎓',
    excerpt:
      'Bukan daftar generik. Disusun dari survei 200+ hiring manager — fokus pada yang sebenarnya membedakan kandidat pemula.',
    tags: ['Fresh Grad', 'Skill', 'Career'],
    body: [
      {
        type: 'p',
        text: 'Saya menjadi career counselor untuk 4.000+ fresh graduate dalam 8 tahun terakhir. Setiap tahun saya bertanya ke hiring manager: skill apa yang membedakan kandidat luar biasa dari yang biasa di tahap awal karier?',
      },
      { type: 'h2', text: '12 skill yang konsisten muncul' },
      {
        type: 'list',
        ordered: true,
        items: [
          'Menulis email profesional yang jelas (tanpa "Selamat siang, semoga sehat selalu, perkenalkan saya...")',
          'Membaca dokumen panjang (50+ halaman) dan menyusun ringkasan 1 halaman',
          'Mempresentasi 5-menit dengan pesan tunggal yang jelas',
          'Bertanya yang tajam — bukan "apakah ada pertanyaan?" tapi "asumsi terbesar apa yang kita pegang dan bisa salah?"',
          'Mengelola jadwal dan komitmen sendiri tanpa di-remind',
          'Mengakui tidak tahu tanpa terdengar tidak yakin',
          'Memberi update proaktif sebelum atasan bertanya',
          'Riset latar belakang sebelum meeting penting',
          'Menulis dokumentasi yang berguna untuk diri sendiri kemudian',
          'Memberi feedback halus ke peer/senior dengan rasa hormat',
          'Mengubah kritik menjadi pertanyaan reflektif',
          'Tahu kapan eskalasi, kapan diselesaikan sendiri',
        ],
      },
      {
        type: 'callout',
        title: 'Pola yang muncul',
        tone: 'tip',
        body: 'Perhatikan: tidak satupun adalah "skill teknis". Semuanya adalah skill operasional dan komunikasi. Hiring manager mengasumsikan Anda akan belajar tools — tapi skill operasional ini sulit dilatih cepat.',
      },
      { type: 'h2', text: 'Apa yang TIDAK ada di daftar' },
      {
        type: 'list',
        items: [
          'Kuasai 5 bahasa pemrograman',
          'Punya 10 sertifikasi',
          'Pernah magang di unicorn',
          'IPK 3,8+',
        ],
      },
      {
        type: 'p',
        text: 'Bukan karena tidak penting — tapi karena ini adalah "filter awal", bukan pembeda. CV Anda mungkin masuk karena hal-hal ini. Tapi yang membuat Anda diingat dan dipanggil ulang adalah 12 di atas.',
      },
      { type: 'h2', text: 'Cara melatih' },
      {
        type: 'p',
        text: 'Setiap skill di daftar adalah skill yang bisa dilatih dalam 2-3 bulan dengan praktik konsisten. Pilih 3 yang paling lemah, latih satu per minggu, minta feedback dari mentor atau senior yang Anda hormati.',
      },
    ],
  },
  {
    id: '10',
    slug: 'kursus-yang-worth-it',
    title: 'Kursus Online yang Benar-Benar Worth It (dan yang Bukan)',
    subtitle:
      'Setelah mereview 80+ kursus populer di Indonesia, ini yang menghasilkan ROI nyata — diukur dari outcome alumni.',
    category: 'skills',
    author: AUTHORS.indra,
    date: '26 April 2026',
    dateIso: '2026-04-26',
    readMin: 11,
    gradient: ['#0EA5E9', '#8B5CF6'],
    emoji: '📚',
    excerpt:
      'Setelah mereview 80+ kursus populer di Indonesia, ini yang menghasilkan ROI nyata — diukur dari outcome alumni.',
    tags: ['Kursus', 'E-Learning', 'ROI', 'Skill'],
    body: [
      {
        type: 'p',
        text: 'Selama 18 bulan terakhir, saya dan tim mengevaluasi 80+ kursus online populer untuk audiens Indonesia. Evaluasi bukan dari materi atau produksi — tapi dari outcome alumni: berapa yang berhasil mendapatkan kerja atau promosi setelah selesai.',
      },
      { type: 'h2', text: 'Kursus dengan ROI tertinggi (data 6-12 bulan setelah selesai)' },
      {
        type: 'list',
        ordered: true,
        items: [
          'Bootcamp UX/UI yang terstruktur 3-6 bulan dengan project portfolio — 68% pindah kerja',
          'Kursus data analytics dengan capstone real-data (bukan dataset Kaggle) — 54%',
          'Kursus product management berbasis kasus internal — 47%',
          'Kursus digital marketing dengan budget management nyata — 42%',
        ],
      },
      { type: 'h2', text: 'Kursus dengan ROI rendah (sering)' },
      {
        type: 'list',
        items: [
          'Kursus 20+ jam "menjadi expert" dalam tools tunggal (Excel, Photoshop, dsb.)',
          'Sertifikasi tanpa nama industri yang dikenal',
          'Kursus "soft skill" tanpa praktek peer atau feedback',
        ],
      },
      {
        type: 'callout',
        title: 'Pola yang muncul',
        tone: 'info',
        body: 'Kursus dengan project nyata + feedback peer/instruktur konsisten menghasilkan ROI lebih tinggi daripada kursus video pasif. Kalau Anda tidak mengerjakan project nyata, Anda tidak akan dipekerjakan karena project — Anda hanya tahu teori.',
      },
      { type: 'h2', text: '4 kriteria menentukan kursus' },
      {
        type: 'list',
        ordered: true,
        items: [
          'Apakah ada project nyata dengan dataset/kasus realistic? (Bukan toy problem)',
          'Apakah ada feedback dari instruktur atau peer? (Bukan hanya solution video)',
          'Apakah instruktur masih praktik di industri? (Bukan full-time educator)',
          'Apakah alumni terbukti mendapatkan outcome? (Cari LinkedIn alumni)',
        ],
      },
      { type: 'h2', text: 'Tentang SSN Academy' },
      {
        type: 'p',
        text: 'Saya juga mendesain kurikulum SSN Academy — saya akan menyebutkan ini untuk transparansi. Kami dirancang dengan 4 kriteria di atas. Tapi penting: kursus terbaik untuk Anda adalah yang paling relevan dengan target karir Anda, bukan yang paling banyak followers atau yang gratis.',
      },
    ],
  },
  {
    id: '11',
    slug: 'mengelola-tim-lintas-generasi',
    title: 'Mengelola Tim Lintas Generasi (Gen X, Millennial, Gen Z)',
    subtitle:
      'Bukan stereotipe — penelitian aktual tentang ekspektasi feedback, ritme rapat, dan gaya komunikasi tiap kohort.',
    category: 'kepemimpinan',
    author: AUTHORS.joko,
    date: '22 April 2026',
    dateIso: '2026-04-22',
    readMin: 12,
    gradient: ['#EC4899', '#635BFF'],
    emoji: '👥',
    excerpt:
      'Bukan stereotipe — penelitian aktual tentang ekspektasi feedback, ritme rapat, dan gaya komunikasi tiap kohort.',
    tags: ['Leadership', 'Multi-Generasi', 'Manajemen'],
    body: [
      {
        type: 'p',
        text: 'Sebagian besar tulisan tentang multi-generasi penuh stereotipe — "Gen Z lazy", "Boomer rigid", dsb. Tidak berguna. Kami menjalankan studi dengan 1.800 profesional Indonesia (450 per generasi: Boomer/X/Millennial/Z) untuk melihat data sebenarnya.',
      },
      { type: 'h2', text: 'Perbedaan yang nyata (dan kecil)' },
      {
        type: 'p',
        text: 'Yang menarik: perbedaan antar-generasi sebenarnya jauh lebih kecil daripada perbedaan antar-individu dalam satu generasi. Tapi ada 3 pola konsisten yang muncul:',
      },
      {
        type: 'list',
        ordered: true,
        items: [
          'Frekuensi feedback yang diinginkan: Gen Z (mingguan), Millennial (bulanan), Gen X (kuartalan), Boomer (tahunan)',
          'Media komunikasi preferensi: Gen Z (chat), Millennial (chat/email), Gen X (email), Boomer (email/telepon)',
          'Tolerance untuk meeting tanpa agenda: Boomer/X (lebih tinggi), Millennial/Z (lebih rendah)',
        ],
      },
      {
        type: 'callout',
        title: 'Pelajaran utama',
        tone: 'tip',
        body: 'Daripada mengubah strategi berdasarkan stereotipe, tanya setiap individu di 1-on-1 pertama: "Bagaimana Anda paling produktif menerima feedback?" Variasi individual jauh lebih besar daripada generational.',
      },
      { type: 'h2', text: '3 hal yang sama di semua generasi' },
      {
        type: 'list',
        items: [
          'Ingin manajer yang jujur (98% di setiap generasi)',
          'Ingin pekerjaan dengan dampak terlihat (92-96%)',
          'Ingin kesempatan tumbuh (94-97%)',
        ],
      },
      {
        type: 'quote',
        text: 'Kalau Anda mengeluh tentang Gen Z, lihat: 96% mereka ingin tumbuh, 98% ingin jujur dengan mereka, 94% ingin dampak. Itu standar manusia, bukan generational.',
        author: 'Joko Susilo',
      },
      { type: 'h2', text: 'Praktik untuk manajer multi-generasi' },
      {
        type: 'list',
        ordered: true,
        items: [
          'Jangan kelompokkan berdasarkan generasi — kelompokkan berdasarkan working style',
          'Tanya preferensi feedback di 1-on-1 pertama (frequency, format, channel)',
          'Default ke transparansi — semua generasi menghargai jujur',
          'Eksperimen dengan async-first kalau tim multi-generasi besar — chat + tulisan mengurangi friction',
        ],
      },
    ],
  },
  {
    id: '12',
    slug: 'cerita-pindah-kota',
    title: 'Pindah dari Jakarta ke Yogya: Pelajaran Setelah 2 Tahun',
    subtitle:
      'Bukan cerita romantisasi "slow living". Apa yang benar, apa yang dikorbankan, dan kapan ini tepat untuk Anda.',
    category: 'cerita',
    author: AUTHORS.gilang,
    date: '20 April 2026',
    dateIso: '2026-04-20',
    readMin: 8,
    gradient: ['#8B5CF6', '#0EA5E9'],
    emoji: '🌅',
    excerpt:
      'Bukan cerita romantisasi "slow living". Apa yang benar, apa yang dikorbankan, dan kapan ini tepat untuk Anda.',
    tags: ['Remote', 'Cerita', 'Lifestyle'],
    body: [
      {
        type: 'p',
        text: 'Dua tahun lalu saya pindah dari Jakarta ke Yogyakarta. Saya seorang mobile developer freelance. Ini cerita jujur, bukan versi Instagram yang romantis. Beberapa hal benar — beberapa hal saya menyesal.',
      },
      { type: 'h2', text: 'Yang lebih baik' },
      {
        type: 'list',
        items: [
          'Cost of living turun ~50%. Sewa apartment Rp 12jt/bulan di Jaksel jadi Rp 3,5jt/bulan untuk rumah 2 kamar dengan halaman',
          'Polusi udara — drastis berbeda. Saya tidak sadar betapa berdampaknya sampai berhenti',
          'Komunitas pekerja kreatif yang surprisingly active — co-working space ramai dengan Gilang-Gilang lain',
          'Akses ke alam — gunung, pantai, sawah dalam 30-60 menit',
        ],
      },
      { type: 'h2', text: 'Yang lebih sulit' },
      {
        type: 'list',
        items: [
          'Network profesional. Networking di Yogya berbeda — lebih lambat, lebih kasual. Saya kehilangan koneksi Jakarta yang dulu mudah',
          'Akses jasa premium (dokter spesialis, mall flagship) lebih terbatas. Pernah harus terbang ke Jakarta untuk medical check-up tahunan',
          'Bandara Yogya bagus tapi koneksi internasional lebih ribet. Kalau klien bilang "mampir besok" — lebih kompleks',
          'Internet — fiber tersedia tapi tidak setabil di Jakarta. Saya punya 2 ISP backup untuk klien penting',
        ],
      },
      {
        type: 'callout',
        title: 'Yang paling tidak diduga',
        tone: 'info',
        body: 'Bukan slow living yang saya dapat — saya masih bekerja sama keras. Yang berubah adalah "waktu menganggur lebih bermutu". Saat saya menganggur di Jakarta, saya stuck di kafe. Di Yogya, saya bisa pulang ke rumah dengan halaman dan binatang.',
      },
      { type: 'h2', text: 'Kapan ini cocok untuk Anda?' },
      {
        type: 'list',
        items: [
          'Pekerjaan Anda full-remote atau Anda sudah punya klien terestablish (saya tidak akan rekomendasi kalau masih mencari klien)',
          'Anda dalam stage karier mid+ dengan network yang sudah matang',
          'Anda OK dengan trade-off network vs lifestyle',
          'Anda punya rencana akses ke kota besar minimal 4× setahun',
        ],
      },
      { type: 'h2', text: 'Kapan TIDAK cocok' },
      {
        type: 'list',
        items: [
          'Karier early-stage yang butuh mentoring langsung',
          'Industri yang heavy network (sales B2B enterprise, banking dealmaking)',
          'Single yang ingin dating pool besar — Yogya pool lebih kecil',
          'Punya komitmen keluarga yang butuh akses cepat ke spesialis kesehatan',
        ],
      },
      {
        type: 'quote',
        text: 'Setelah 2 tahun: tidak ada rencana balik ke Jakarta. Tapi saya juga tidak akan rekomendasikan ke semua orang — ini decision yang sangat personal dan situasional.',
      },
    ],
  },
]

export type BlogSort = 'newest' | 'alpha' | 'quick'

const VALID_BLOG_SORTS = new Set<BlogSort>(['newest', 'alpha', 'quick'])

export function sanitizeBlogSort(value: string | undefined): BlogSort {
  return value && VALID_BLOG_SORTS.has(value as BlogSort)
    ? (value as BlogSort)
    : 'newest'
}

export type BlogFilters = {
  /** Category slug (use 'all' or undefined for no filter). */
  category?: string
  /** Free-text query against title, excerpt, author name. */
  q?: string
  /** Sort order. Defaults to newest. */
  sort?: BlogSort
}

/**
 * Filters from REGULAR_ARTICLES (everything except the featured pick) so the
 * hero card never gets hidden by a search.
 */
export function filterArticles(filters: BlogFilters = {}): BlogArticle[] {
  const q = filters.q?.trim().toLowerCase()
  const cat = filters.category && filters.category !== 'all' ? filters.category : undefined
  const sort = sanitizeBlogSort(filters.sort)

  const list = REGULAR_ARTICLES.filter((a) => {
    if (cat && a.category !== cat) return false
    if (q) {
      const haystack = `${a.title} ${a.excerpt} ${a.author.name}`.toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })

  // REGULAR_ARTICLES is already in newest-first order (matches editorial
  // intent), so 'newest' needs no extra sorting. Copy before sorting to avoid
  // mutating the lib array.
  if (sort === 'alpha') {
    return [...list].sort((a, b) => a.title.localeCompare(b.title))
  }
  if (sort === 'quick') {
    return [...list].sort((a, b) => a.readMin - b.readMin)
  }
  return list
}

export const BLOG_PAGE_SIZE = 9

export function findArticle(slug: string): BlogArticle | undefined {
  return BLOG_ARTICLES.find((a) => a.slug === slug)
}

export function relatedArticles(slug: string, n = 3): BlogArticle[] {
  const current = findArticle(slug)
  if (!current) return BLOG_ARTICLES.filter((a) => !a.featured).slice(0, n)
  return BLOG_ARTICLES
    .filter((a) => a.slug !== slug)
    .sort((a, b) => {
      const aScore =
        (a.category === current.category ? 3 : 0) +
        (a.author.name === current.author.name ? 2 : 0)
      const bScore =
        (b.category === current.category ? 3 : 0) +
        (b.author.name === current.author.name ? 2 : 0)
      return bScore - aScore
    })
    .slice(0, n)
}

export const FEATURED_ARTICLE: BlogArticle = BLOG_ARTICLES[0]!
export const REGULAR_ARTICLES: BlogArticle[] = BLOG_ARTICLES.slice(1)
