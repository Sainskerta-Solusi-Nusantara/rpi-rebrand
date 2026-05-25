// TEMPORARY DUMMY DATA — replace with prisma query once review is approved.

export type CourseLevel = 'beginner' | 'intermediate' | 'advanced'

export type CourseLesson = {
  title: string
  durationMin: number
  type: 'video' | 'article' | 'quiz' | 'project'
}

export type CourseModule = {
  title: string
  durationMin: number
  lessons: CourseLesson[]
}

export type DummyCourse = {
  id: string
  slug: string
  title: string
  subtitle: string
  description: string
  longDescription: string
  level: CourseLevel
  durationHours: number
  lessonsCount: number
  studentsCount: number
  rating: number
  reviewsCount: number
  language: string
  certificate: boolean
  priceIdr: number | 'free'
  originalPriceIdr?: number
  gradient: [string, string]
  emoji: string
  category: string
  instructor: {
    name: string
    role: string
    bio: string
    initial: string
    color: string
    coursesCount: number
    studentsCount: string
  }
  whatYouLearn: string[]
  requirements: string[]
  targetAudience: string[]
  modules: CourseModule[]
  tags: string[]
}

const INSTRUCTORS = {
  andi: {
    name: 'Andi Wijaya',
    role: 'Senior Full-Stack Engineer',
    bio: 'Eks-Gojek dengan 10 tahun pengalaman build production systems. Telah mengajar 50.000+ developer melalui workshop dan kursus online.',
    initial: 'AW',
    color: '#635BFF',
    coursesCount: 4,
    studentsCount: '54K',
  },
  citra: {
    name: 'Citra Lestari',
    role: 'Principal Designer',
    bio: 'Sebelumnya memimpin design di Tokopedia. Spesialis design system dan UX research dengan dampak terukur.',
    initial: 'CL',
    color: '#EC4899',
    coursesCount: 3,
    studentsCount: '32K',
  },
  budi: {
    name: 'Budi Santoso',
    role: 'Lead Data Engineer',
    bio: 'Membangun pipeline data terabyte-scale di Bank Mandiri. Lulusan ITB dengan fokus database internals dan distributed systems.',
    initial: 'BS',
    color: '#0EA5E9',
    coursesCount: 5,
    studentsCount: '41K',
  },
  fitri: {
    name: 'Fitri Handayani',
    role: 'Career & Leadership Coach',
    bio: 'Eks-HR Director di startup unicorn. Sertifikasi ICF Professional Coach, telah mendampingi 200+ pemimpin baru.',
    initial: 'FH',
    color: '#10B981',
    coursesCount: 6,
    studentsCount: '78K',
  },
  eko: {
    name: 'Eko Pratama',
    role: 'Cloud Solutions Architect',
    bio: 'AWS Solutions Architect Professional + Kubernetes CKA. Telah mendesain infrastruktur cloud untuk 15+ bank dan grup usaha.',
    initial: 'EP',
    color: '#F59E0B',
    coursesCount: 4,
    studentsCount: '38K',
  },
  indra: {
    name: 'Indra Kusuma',
    role: 'Learning Strategist',
    bio: 'Eks-Head of L&D di Telkom Group. Spesialis instructional design dengan latar belakang psikologi kognitif.',
    initial: 'IK',
    color: '#8B5CF6',
    coursesCount: 3,
    studentsCount: '24K',
  },
  joko: {
    name: 'Joko Susilo',
    role: 'Security Engineer',
    bio: 'OSCP + CISSP. Memimpin red team exercises di BCA dan beberapa BUMN. Praktisi yang menulis blog teknis populer.',
    initial: 'JS',
    color: '#EF4444',
    coursesCount: 2,
    studentsCount: '19K',
  },
  hana: {
    name: 'Hana Putri',
    role: 'Senior Finance Analyst',
    bio: 'CFA Charterholder dengan 8 tahun di investment banking. Sebelumnya di Morgan Stanley dan JP Morgan Jakarta.',
    initial: 'HP',
    color: '#06B6D4',
    coursesCount: 3,
    studentsCount: '27K',
  },
  dewi: {
    name: 'Dewi Anggraini',
    role: 'Digital Marketing Director',
    bio: 'Mantan VP Marketing di marketplace top-3 Indonesia. Spesialis lifecycle marketing dan performance growth.',
    initial: 'DA',
    color: '#0A2540',
    coursesCount: 4,
    studentsCount: '46K',
  },
  gilang: {
    name: 'Gilang Ramadhan',
    role: 'Mobile Engineering Lead',
    bio: 'Memimpin tim mobile di fintech terkemuka. Spesialis Flutter dan native iOS/Android performance.',
    initial: 'GR',
    color: '#003DA5',
    coursesCount: 2,
    studentsCount: '15K',
  },
} as const

export const DUMMY_COURSES: DummyCourse[] = [
  {
    id: '1',
    slug: 'fundamentals-of-javascript',
    title: 'Fundamentals of JavaScript',
    subtitle: 'Dasar JavaScript modern dengan praktik sehari-hari',
    description:
      'Belajar JavaScript dari nol sampai siap kerja — tipe data, kontrol alur, async/await, modul, dan testing.',
    longDescription:
      'Kursus ini dirancang untuk pemula yang ingin masuk ke dunia web development. Anda akan mulai dari sintaks dasar, lalu naik ke konsep modern seperti closure, Promise, async/await, dan ES modules. Setiap modul disertai latihan dan studi kasus yang merefleksikan pekerjaan nyata di tim engineering.',
    level: 'beginner',
    durationHours: 12,
    lessonsCount: 24,
    studentsCount: 4820,
    rating: 4.8,
    reviewsCount: 1240,
    language: 'Bahasa Indonesia',
    certificate: true,
    priceIdr: 'free',
    gradient: ['#F59E0B', '#EF4444'],
    emoji: '📚',
    category: 'Programming',
    instructor: INSTRUCTORS.andi,
    whatYouLearn: [
      'Sintaks dan tipe data JavaScript modern (ES2020+)',
      'Manajemen alur dengan kontrol kondisional dan loop',
      'Fungsi, closure, dan higher-order functions',
      'Bekerja dengan array, object, dan iterators',
      'Async programming: callbacks, Promise, async/await',
      'Modul ES6 dan organisasi kode',
      'Debugging dan testing dasar dengan Jest',
    ],
    requirements: [
      'Komputer dengan editor teks (VS Code direkomendasikan)',
      'Pemahaman dasar HTML/CSS (opsional tapi membantu)',
      'Tidak ada pengalaman programming dibutuhkan',
    ],
    targetAudience: [
      'Pemula yang ingin belajar pemrograman web',
      'Designer atau marketer yang ingin lebih teknis',
      'Mahasiswa IT/CS yang ingin memperkuat dasar',
    ],
    modules: [
      {
        title: 'Pengantar & Setup',
        durationMin: 90,
        lessons: [
          { title: 'Apa itu JavaScript dan kenapa belajar?', durationMin: 12, type: 'video' },
          { title: 'Setup VS Code dan Node.js', durationMin: 18, type: 'video' },
          { title: 'Menjalankan kode pertama Anda', durationMin: 15, type: 'video' },
          { title: 'Kuis: Setup', durationMin: 10, type: 'quiz' },
        ],
      },
      {
        title: 'Tipe Data & Variabel',
        durationMin: 120,
        lessons: [
          { title: 'String, number, boolean', durationMin: 20, type: 'video' },
          { title: 'Array dan objek', durationMin: 25, type: 'video' },
          { title: 'let, const, var', durationMin: 15, type: 'video' },
          { title: 'Latihan: Mengelola data toko', durationMin: 40, type: 'project' },
        ],
      },
      {
        title: 'Fungsi & Scope',
        durationMin: 150,
        lessons: [
          { title: 'Deklarasi fungsi vs ekspresi', durationMin: 18, type: 'video' },
          { title: 'Arrow function', durationMin: 22, type: 'video' },
          { title: 'Closure dan lexical scope', durationMin: 28, type: 'video' },
          { title: 'Latihan: Counter dan timer', durationMin: 35, type: 'project' },
        ],
      },
      {
        title: 'Async & Modul',
        durationMin: 180,
        lessons: [
          { title: 'Callback dan event loop', durationMin: 25, type: 'video' },
          { title: 'Promise dan async/await', durationMin: 30, type: 'video' },
          { title: 'Fetch API dan REST', durationMin: 28, type: 'video' },
          { title: 'Proyek akhir: Cuaca app', durationMin: 60, type: 'project' },
        ],
      },
    ],
    tags: ['JavaScript', 'Web Development', 'Programming', 'Beginner'],
  },
  {
    id: '2',
    slug: 'mastering-react',
    title: 'Mastering React for Production',
    subtitle: 'Build aplikasi React skala produksi dengan pola modern',
    description:
      'Dari komponen dasar hingga arsitektur kompleks: hooks, state management, performance, dan testing.',
    longDescription:
      'Kursus untuk developer yang ingin menguasai React di level produksi. Anda akan membangun aplikasi e-commerce nyata dari nol sambil mempelajari pattern yang dipakai di tim engineering top — context vs zustand, server components, suspense, dan strategi performance.',
    level: 'intermediate',
    durationHours: 24,
    lessonsCount: 48,
    studentsCount: 3120,
    rating: 4.9,
    reviewsCount: 890,
    language: 'Bahasa Indonesia',
    certificate: true,
    priceIdr: 499_000,
    originalPriceIdr: 899_000,
    gradient: ['#635BFF', '#0EA5E9'],
    emoji: '⚛️',
    category: 'Programming',
    instructor: INSTRUCTORS.andi,
    whatYouLearn: [
      'Functional components dan hooks (useState, useEffect, useReducer, useMemo)',
      'Custom hooks dan composition pattern',
      'State management dengan Context API, Zustand, dan TanStack Query',
      'Routing dengan React Router atau Next.js App Router',
      'Form handling dengan React Hook Form dan validation',
      'Performance optimization (memo, virtualization, code splitting)',
      'Testing: unit (Jest), integration (RTL), e2e (Playwright)',
      'Deployment ke Vercel dengan CI/CD',
    ],
    requirements: [
      'Pengalaman JavaScript ES6+ (atau lulusan Fundamentals JS)',
      'Pemahaman dasar HTML/CSS',
      'Familiar dengan Git dan terminal',
    ],
    targetAudience: [
      'Frontend developer yang ingin menguasai React serius',
      'Backend developer yang ingin pindah ke fullstack',
      'Tech lead yang ingin update dengan stack modern',
    ],
    modules: [
      {
        title: 'React Modern: Hooks Deep Dive',
        durationMin: 240,
        lessons: [
          { title: 'useState dan reactive paradigm', durationMin: 28, type: 'video' },
          { title: 'useEffect dan side effects', durationMin: 35, type: 'video' },
          { title: 'useReducer untuk state kompleks', durationMin: 32, type: 'video' },
          { title: 'Custom hooks: ekstrak logika', durationMin: 30, type: 'video' },
          { title: 'Proyek: Hooks builder', durationMin: 60, type: 'project' },
        ],
      },
      {
        title: 'State Management',
        durationMin: 280,
        lessons: [
          { title: 'Context API: kapan pakai', durationMin: 25, type: 'video' },
          { title: 'Zustand untuk global state', durationMin: 35, type: 'video' },
          { title: 'TanStack Query untuk server state', durationMin: 40, type: 'video' },
          { title: 'Proyek: Aplikasi e-commerce state', durationMin: 90, type: 'project' },
        ],
      },
      {
        title: 'Performance & Optimization',
        durationMin: 200,
        lessons: [
          { title: 'React DevTools profiler', durationMin: 25, type: 'video' },
          { title: 'memo, useMemo, useCallback', durationMin: 30, type: 'video' },
          { title: 'Code splitting dan lazy loading', durationMin: 28, type: 'video' },
          { title: 'List virtualization', durationMin: 22, type: 'video' },
          { title: 'Latihan optimization', durationMin: 45, type: 'project' },
        ],
      },
      {
        title: 'Testing & Deployment',
        durationMin: 220,
        lessons: [
          { title: 'Unit testing dengan Jest', durationMin: 30, type: 'video' },
          { title: 'Integration test dengan RTL', durationMin: 35, type: 'video' },
          { title: 'E2E dengan Playwright', durationMin: 32, type: 'video' },
          { title: 'CI/CD dengan GitHub Actions', durationMin: 28, type: 'video' },
          { title: 'Proyek akhir: Deploy ke Vercel', durationMin: 60, type: 'project' },
        ],
      },
    ],
    tags: ['React', 'Frontend', 'JavaScript', 'Production'],
  },
  {
    id: '3',
    slug: 'sql-postgres-deep-dive',
    title: 'SQL & Postgres Deep Dive',
    subtitle: 'Dari query dasar hingga query optimization produksi',
    description:
      'Kuasai SQL dan PostgreSQL — dari SELECT pertama hingga indexing, EXPLAIN, dan tuning performa.',
    longDescription:
      'Kursus mendalam untuk siapa pun yang bekerja dengan database — engineer, analyst, atau data scientist. Anda akan belajar dari sintaks dasar hingga teknik tuning yang dipakai DBA senior, dengan dataset nyata yang merefleksikan beban produksi.',
    level: 'intermediate',
    durationHours: 18,
    lessonsCount: 36,
    studentsCount: 2680,
    rating: 4.8,
    reviewsCount: 620,
    language: 'Bahasa Indonesia',
    certificate: true,
    priceIdr: 399_000,
    originalPriceIdr: 699_000,
    gradient: ['#0EA5E9', '#8B5CF6'],
    emoji: '🗄️',
    category: 'Data & Analytics',
    instructor: INSTRUCTORS.budi,
    whatYouLearn: [
      'SELECT, WHERE, JOIN, GROUP BY, dan agregasi',
      'Window functions: ROW_NUMBER, RANK, LAG, LEAD',
      'CTE dan subquery untuk query kompleks',
      'Indexing: B-tree, hash, GIN, GiST',
      'EXPLAIN dan EXPLAIN ANALYZE untuk tuning',
      'Transaction, isolation level, dan locking',
      'JSON, full-text search, dan PostGIS',
      'Replikasi, backup, dan disaster recovery dasar',
    ],
    requirements: [
      'Pemahaman dasar tentang database (tidak harus SQL)',
      'Komputer dengan PostgreSQL terinstal',
      'Mau ngulik dataset yang besar',
    ],
    targetAudience: [
      'Backend engineer yang ingin query lebih baik',
      'Data analyst yang ingin lebih dari sekadar SELECT *',
      'DevOps yang harus mengelola database produksi',
    ],
    modules: [
      {
        title: 'SQL Foundations',
        durationMin: 200,
        lessons: [
          { title: 'Setup PostgreSQL lokal + psql', durationMin: 25, type: 'video' },
          { title: 'SELECT, WHERE, ORDER BY', durationMin: 30, type: 'video' },
          { title: 'JOIN: INNER, LEFT, FULL', durationMin: 35, type: 'video' },
          { title: 'GROUP BY dan HAVING', durationMin: 25, type: 'video' },
          { title: 'Latihan dengan dataset toko', durationMin: 45, type: 'project' },
        ],
      },
      {
        title: 'Advanced Querying',
        durationMin: 240,
        lessons: [
          { title: 'CTE (WITH ... AS)', durationMin: 30, type: 'video' },
          { title: 'Window functions', durationMin: 40, type: 'video' },
          { title: 'Subquery vs JOIN performance', durationMin: 28, type: 'video' },
          { title: 'JSON dan jsonb operations', durationMin: 32, type: 'video' },
          { title: 'Proyek: Analytics dashboard query', durationMin: 60, type: 'project' },
        ],
      },
      {
        title: 'Indexing & Performance',
        durationMin: 280,
        lessons: [
          { title: 'Cara index bekerja: B-tree', durationMin: 35, type: 'video' },
          { title: 'Special indexes: GIN, GiST, BRIN', durationMin: 30, type: 'video' },
          { title: 'EXPLAIN ANALYZE membaca query plan', durationMin: 40, type: 'video' },
          { title: 'Common anti-patterns dan fix-nya', durationMin: 30, type: 'video' },
          { title: 'Latihan optimization 5 query lambat', durationMin: 70, type: 'project' },
        ],
      },
      {
        title: 'Production Concerns',
        durationMin: 200,
        lessons: [
          { title: 'Transaction & isolation levels', durationMin: 30, type: 'video' },
          { title: 'Locking dan deadlock', durationMin: 25, type: 'video' },
          { title: 'Backup dan PITR', durationMin: 25, type: 'video' },
          { title: 'Replikasi streaming', durationMin: 28, type: 'video' },
          { title: 'Quiz: Production scenarios', durationMin: 30, type: 'quiz' },
        ],
      },
    ],
    tags: ['SQL', 'PostgreSQL', 'Database', 'Backend'],
  },
  {
    id: '4',
    slug: 'resume-interview-bootcamp',
    title: 'Resume & Interview Bootcamp',
    subtitle: 'Dari CV yang dilirik hingga negosiasi gaji yang sukses',
    description:
      'Panduan praktis untuk semua tahap pencarian kerja — CV, portfolio, interview, dan negosiasi gaji.',
    longDescription:
      'Kursus singkat dan praktis berbasis hasil. Anda akan mengaudit CV Anda, simulasi interview perilaku dan teknis, dan belajar framework negosiasi gaji yang sudah membuat alumni naik 20–50% dari penawaran awal.',
    level: 'beginner',
    durationHours: 6,
    lessonsCount: 14,
    studentsCount: 8950,
    rating: 4.9,
    reviewsCount: 2340,
    language: 'Bahasa Indonesia',
    certificate: true,
    priceIdr: 'free',
    gradient: ['#10B981', '#0EA5E9'],
    emoji: '🎯',
    category: 'Karier',
    instructor: INSTRUCTORS.fitri,
    whatYouLearn: [
      'Audit CV: apa yang dilirik recruiter dalam 7 detik',
      'Menulis bullet point berbasis dampak, bukan tugas',
      'LinkedIn profile yang muncul di hasil pencarian',
      'Interview perilaku: STAR vs framework yang lebih modern',
      'Interview teknis untuk role non-engineer',
      'Negosiasi gaji: angka, timing, dan bahasa yang dipakai',
      'Menerima/menolak offer dengan elegan',
    ],
    requirements: [
      'Sedang atau berencana mencari kerja',
      'CV dalam kondisi apapun (akan diperbaiki)',
      'Akses LinkedIn (gratis sudah cukup)',
    ],
    targetAudience: [
      'Pencari kerja pertama kali (fresh grad)',
      'Profesional yang ingin pindah karier',
      'Career switcher dari industri lain',
    ],
    modules: [
      {
        title: 'CV & Portfolio',
        durationMin: 120,
        lessons: [
          { title: 'Apa yang dilihat recruiter (eye-tracking study)', durationMin: 18, type: 'video' },
          { title: 'Format CV yang aman untuk ATS', durationMin: 22, type: 'video' },
          { title: 'Menulis bullet point berbasis dampak', durationMin: 28, type: 'video' },
          { title: 'Workshop: Audit CV Anda', durationMin: 45, type: 'project' },
        ],
      },
      {
        title: 'Interview Mastery',
        durationMin: 150,
        lessons: [
          { title: 'Persiapan: research dan storytelling', durationMin: 25, type: 'video' },
          { title: 'Interview perilaku: framework modern', durationMin: 35, type: 'video' },
          { title: 'Interview teknis untuk non-engineer', durationMin: 30, type: 'video' },
          { title: 'Simulasi interview', durationMin: 60, type: 'project' },
        ],
      },
      {
        title: 'Offer & Negosiasi',
        durationMin: 90,
        lessons: [
          { title: 'Membaca offer letter', durationMin: 22, type: 'video' },
          { title: 'Negosiasi gaji: angka, timing, bahasa', durationMin: 30, type: 'video' },
          { title: 'Skrip negosiasi sambil tetap profesional', durationMin: 18, type: 'video' },
          { title: 'Latihan: Role-play negosiasi', durationMin: 30, type: 'project' },
        ],
      },
    ],
    tags: ['Karier', 'CV', 'Interview', 'Negosiasi'],
  },
  {
    id: '5',
    slug: '5g-network-fundamentals',
    title: '5G Network Fundamentals',
    subtitle: 'Arsitektur dan operasional jaringan 5G untuk telco engineer',
    description:
      'Dari RAN hingga core network — pahami arsitektur 5G lengkap dengan use case industri Indonesia.',
    longDescription:
      'Kursus untuk telco engineer yang ingin transisi dari 4G LTE ke 5G. Materi mencakup arsitektur Radio Access Network, 5G Core (5GC), network slicing, dan use case real-world dari operator nasional.',
    level: 'intermediate',
    durationHours: 20,
    lessonsCount: 32,
    studentsCount: 1240,
    rating: 4.7,
    reviewsCount: 320,
    language: 'Bahasa Indonesia',
    certificate: true,
    priceIdr: 599_000,
    originalPriceIdr: 999_000,
    gradient: ['#0EA5E9', '#635BFF'],
    emoji: '📡',
    category: 'Telecommunications',
    instructor: INSTRUCTORS.eko,
    whatYouLearn: [
      'Arsitektur jaringan 5G end-to-end (RAN + Core)',
      '5G NR (New Radio): NR-RAN, frequency bands, beam-forming',
      '5G Core: AMF, SMF, UPF, dan service-based architecture',
      'Network slicing untuk industri vertikal',
      'MEC (Multi-access Edge Computing)',
      'Migrasi dari 4G LTE ke 5G Standalone',
      'Use case industri: smart manufacturing, fixed wireless',
    ],
    requirements: [
      'Pemahaman dasar 4G LTE atau jaringan seluler',
      'Background teknik telekomunikasi atau IT',
      'Familiar dengan IP networking',
    ],
    targetAudience: [
      'Telco engineer di operator (Telkomsel, XL, Indosat)',
      'Network engineer yang ingin spesialisasi 5G',
      'Mahasiswa tingkat akhir teknik telekomunikasi',
    ],
    modules: [
      {
        title: 'Pengantar 5G',
        durationMin: 200,
        lessons: [
          { title: 'Evolusi dari 1G ke 5G', durationMin: 22, type: 'video' },
          { title: 'Spektrum frekuensi 5G', durationMin: 28, type: 'video' },
          { title: 'Use case dan industri vertikal', durationMin: 25, type: 'video' },
          { title: 'Kuis: Konsep dasar', durationMin: 20, type: 'quiz' },
        ],
      },
      {
        title: '5G Radio Access',
        durationMin: 350,
        lessons: [
          { title: 'NR-RAN architecture', durationMin: 40, type: 'video' },
          { title: 'Beamforming dan Massive MIMO', durationMin: 45, type: 'video' },
          { title: 'mmWave dan deployment challenges', durationMin: 35, type: 'video' },
          { title: 'RAN sharing dan Open RAN', durationMin: 30, type: 'video' },
        ],
      },
      {
        title: '5G Core (5GC)',
        durationMin: 320,
        lessons: [
          { title: 'Service-Based Architecture', durationMin: 35, type: 'video' },
          { title: 'AMF, SMF, UPF: peran masing-masing', durationMin: 45, type: 'video' },
          { title: 'Network slicing implementation', durationMin: 40, type: 'video' },
          { title: 'Lab: Setup 5GC dengan free5GC', durationMin: 60, type: 'project' },
        ],
      },
      {
        title: 'Use Cases & Migration',
        durationMin: 280,
        lessons: [
          { title: 'Smart manufacturing dengan 5G', durationMin: 32, type: 'video' },
          { title: 'Fixed Wireless Access (FWA)', durationMin: 28, type: 'video' },
          { title: 'MEC dan latency-sensitive apps', durationMin: 35, type: 'video' },
          { title: 'Studi kasus: deployment Telkomsel', durationMin: 40, type: 'article' },
        ],
      },
    ],
    tags: ['5G', 'Telecom', 'Network', 'Engineering'],
  },
  {
    id: '6',
    slug: 'cloud-native-architecture',
    title: 'Cloud Native Architecture',
    subtitle: 'Kubernetes, microservices, dan observability untuk produksi',
    description:
      'Bangun aplikasi cloud-native skala besar dengan Kubernetes, service mesh, dan observability modern.',
    longDescription:
      'Kursus tingkat lanjut untuk engineer yang ingin menguasai cloud-native architecture. Anda akan men-deploy aplikasi microservices nyata ke Kubernetes production-grade, dengan service mesh (Istio), observability (Prometheus + Grafana + Jaeger), dan GitOps (ArgoCD).',
    level: 'advanced',
    durationHours: 30,
    lessonsCount: 52,
    studentsCount: 890,
    rating: 4.9,
    reviewsCount: 240,
    language: 'Bahasa Indonesia',
    certificate: true,
    priceIdr: 1_499_000,
    originalPriceIdr: 2_499_000,
    gradient: ['#635BFF', '#EC4899'],
    emoji: '☁️',
    category: 'Cloud & DevOps',
    instructor: INSTRUCTORS.eko,
    whatYouLearn: [
      'Container fundamentals: Docker, OCI, layered filesystem',
      'Kubernetes: pods, deployments, services, ingress',
      'Helm chart untuk packaging aplikasi',
      'Service mesh dengan Istio: traffic management, mTLS, observability',
      'Observability stack: Prometheus, Grafana, Loki, Jaeger',
      'GitOps dengan ArgoCD',
      'Security: NetworkPolicy, PodSecurityPolicy, OPA',
      'CKA certification preparation',
    ],
    requirements: [
      'Pengalaman backend development 2+ tahun',
      'Pemahaman dasar Linux dan networking',
      'Pengalaman dengan satu cloud provider (AWS/GCP/Azure)',
    ],
    targetAudience: [
      'Senior engineer transisi ke platform engineering',
      'DevOps engineer yang ingin level-up ke SRE',
      'Solution architect yang mendesain cloud-native systems',
    ],
    modules: [
      {
        title: 'Container & Kubernetes Basics',
        durationMin: 380,
        lessons: [
          { title: 'Docker deep dive', durationMin: 45, type: 'video' },
          { title: 'Kubernetes architecture', durationMin: 50, type: 'video' },
          { title: 'Pods, deployments, services', durationMin: 60, type: 'video' },
          { title: 'Networking: CNI, Service, Ingress', durationMin: 55, type: 'video' },
          { title: 'Lab: Deploy aplikasi pertama', durationMin: 75, type: 'project' },
        ],
      },
      {
        title: 'Service Mesh & Networking',
        durationMin: 420,
        lessons: [
          { title: 'Service mesh: kapan dan kenapa', durationMin: 30, type: 'video' },
          { title: 'Istio: install dan setup', durationMin: 50, type: 'video' },
          { title: 'Traffic management dengan VirtualService', durationMin: 55, type: 'video' },
          { title: 'mTLS dan zero-trust', durationMin: 45, type: 'video' },
          { title: 'Lab: Canary deployment dengan Istio', durationMin: 90, type: 'project' },
        ],
      },
      {
        title: 'Observability Stack',
        durationMin: 360,
        lessons: [
          { title: 'Three pillars: logs, metrics, traces', durationMin: 30, type: 'video' },
          { title: 'Prometheus + Grafana', durationMin: 60, type: 'video' },
          { title: 'Distributed tracing dengan Jaeger', durationMin: 50, type: 'video' },
          { title: 'Loki untuk log aggregation', durationMin: 40, type: 'video' },
          { title: 'Lab: Bangun observability stack', durationMin: 90, type: 'project' },
        ],
      },
      {
        title: 'GitOps & Production',
        durationMin: 380,
        lessons: [
          { title: 'GitOps philosophy', durationMin: 28, type: 'video' },
          { title: 'ArgoCD: setup dan workflow', durationMin: 55, type: 'video' },
          { title: 'Security best practices', durationMin: 50, type: 'video' },
          { title: 'CKA exam preparation', durationMin: 45, type: 'video' },
          { title: 'Capstone: Production-ready cluster', durationMin: 120, type: 'project' },
        ],
      },
    ],
    tags: ['Kubernetes', 'Cloud Native', 'DevOps', 'Microservices'],
  },
  {
    id: '7',
    slug: 'cybersecurity-essentials',
    title: 'Cybersecurity Essentials',
    subtitle: 'Fondasi keamanan siber untuk profesional IT',
    description:
      'Konsep keamanan siber yang harus dipahami semua engineer — OWASP, threat modeling, dan incident response dasar.',
    longDescription:
      'Kursus pemula yang berfokus pada konsep keamanan praktis untuk engineer dan IT professional. Tidak terbatas pada teori — Anda akan melakukan hands-on dengan tools modern dan menganalisis insiden nyata yang pernah terjadi di Indonesia.',
    level: 'beginner',
    durationHours: 14,
    lessonsCount: 28,
    studentsCount: 2150,
    rating: 4.8,
    reviewsCount: 520,
    language: 'Bahasa Indonesia',
    certificate: true,
    priceIdr: 'free',
    gradient: ['#EF4444', '#F59E0B'],
    emoji: '🔒',
    category: 'Security',
    instructor: INSTRUCTORS.joko,
    whatYouLearn: [
      'CIA triad dan threat modeling dasar',
      'OWASP Top 10 dengan contoh kode rentan dan fix',
      'Authentication, MFA, session management',
      'Network security: firewall, VPN, segmentasi',
      'Secure coding practices untuk web dan API',
      'Incident response dasar: deteksi, eskalasi, post-mortem',
      'Compliance Indonesia: UU PDP, OJK, BSSN',
    ],
    requirements: [
      'Pemahaman dasar IT atau development (1+ tahun)',
      'Familiar dengan terminal dan basic Linux',
      'Tidak ada pengalaman security wajib',
    ],
    targetAudience: [
      'Developer yang ingin menulis kode lebih aman',
      'IT professional yang masuk ke security',
      'Tech lead yang harus mengelola risiko',
    ],
    modules: [
      {
        title: 'Fondasi Keamanan',
        durationMin: 180,
        lessons: [
          { title: 'CIA triad dan AAA', durationMin: 22, type: 'video' },
          { title: 'Threat modeling dengan STRIDE', durationMin: 30, type: 'video' },
          { title: 'Risk assessment dasar', durationMin: 25, type: 'video' },
          { title: 'Latihan: Threat model sederhana', durationMin: 45, type: 'project' },
        ],
      },
      {
        title: 'Web & API Security',
        durationMin: 280,
        lessons: [
          { title: 'OWASP Top 10 walkthrough', durationMin: 60, type: 'video' },
          { title: 'SQL Injection dan prepared statement', durationMin: 35, type: 'video' },
          { title: 'XSS dan CSRF mitigation', durationMin: 35, type: 'video' },
          { title: 'API security: authentication & rate limit', durationMin: 35, type: 'video' },
          { title: 'Lab: Exploit vulnerable app', durationMin: 60, type: 'project' },
        ],
      },
      {
        title: 'Identity & Access',
        durationMin: 200,
        lessons: [
          { title: 'Authentication vs authorization', durationMin: 25, type: 'video' },
          { title: 'MFA: TOTP, hardware key', durationMin: 30, type: 'video' },
          { title: 'Session management aman', durationMin: 28, type: 'video' },
          { title: 'OAuth 2.0 dan OpenID Connect', durationMin: 35, type: 'video' },
        ],
      },
      {
        title: 'Incident & Compliance',
        durationMin: 180,
        lessons: [
          { title: 'IR lifecycle: PICERL', durationMin: 28, type: 'video' },
          { title: 'Studi kasus insiden Indonesia', durationMin: 35, type: 'video' },
          { title: 'UU PDP dan implementasi', durationMin: 30, type: 'video' },
          { title: 'Post-mortem yang berguna', durationMin: 25, type: 'video' },
        ],
      },
    ],
    tags: ['Security', 'OWASP', 'Cybersecurity', 'Compliance'],
  },
  {
    id: '8',
    slug: 'telco-customer-excellence',
    title: 'Telco Customer Excellence',
    subtitle: 'Service excellence untuk customer-facing di industri telco',
    description:
      'Skill komunikasi, problem-solving, dan empati untuk staf customer service di industri telekomunikasi.',
    longDescription:
      'Kursus khusus untuk customer-facing staff di operator telekomunikasi. Anda akan belajar handling kasus kompleks (billing dispute, technical complaint, churn risk) dengan framework yang sudah teruji di customer care top-rated.',
    level: 'beginner',
    durationHours: 8,
    lessonsCount: 16,
    studentsCount: 1680,
    rating: 4.6,
    reviewsCount: 410,
    language: 'Bahasa Indonesia',
    certificate: true,
    priceIdr: 'free',
    gradient: ['#10B981', '#06B6D4'],
    emoji: '🎧',
    category: 'Customer Service',
    instructor: INSTRUCTORS.indra,
    whatYouLearn: [
      'Active listening dan empati profesional',
      'Framework HEARD untuk handling komplain',
      'Negosiasi billing dan dispute resolution',
      'Mengenali churn risk dan retention strategy',
      'Komunikasi tertulis: email, chat, ticket',
      'Self-care: mengelola emosi setelah kasus berat',
    ],
    requirements: [
      'Sedang atau berencana bekerja di customer service',
      'Komunikasi dasar Bahasa Indonesia',
      'Mau berkomitmen latihan role-play',
    ],
    targetAudience: [
      'Customer care representative di telco/ISP',
      'Tim support yang baru bergabung',
      'Supervisor yang melatih tim baru',
    ],
    modules: [
      {
        title: 'Fondasi Service',
        durationMin: 120,
        lessons: [
          { title: 'Mindset service excellence', durationMin: 22, type: 'video' },
          { title: 'Active listening teknik', durationMin: 28, type: 'video' },
          { title: 'Empati profesional', durationMin: 25, type: 'video' },
          { title: 'Latihan listening', durationMin: 30, type: 'project' },
        ],
      },
      {
        title: 'Handling Komplain',
        durationMin: 160,
        lessons: [
          { title: 'Framework HEARD', durationMin: 35, type: 'video' },
          { title: 'Billing dispute: skrip dan negosiasi', durationMin: 30, type: 'video' },
          { title: 'Technical complaint: eskalasi tepat', durationMin: 28, type: 'video' },
          { title: 'Role-play: 3 kasus sulit', durationMin: 45, type: 'project' },
        ],
      },
      {
        title: 'Retention & Self-Care',
        durationMin: 130,
        lessons: [
          { title: 'Mengenali churn risk', durationMin: 25, type: 'video' },
          { title: 'Retention offer: timing dan negosiasi', durationMin: 30, type: 'video' },
          { title: 'Self-care setelah call berat', durationMin: 28, type: 'video' },
          { title: 'Quiz: Skenario customer', durationMin: 25, type: 'quiz' },
        ],
      },
    ],
    tags: ['Customer Service', 'Telco', 'Communication', 'Soft Skill'],
  },
  {
    id: '9',
    slug: 'python-for-data-science',
    title: 'Python for Data Science',
    subtitle: 'Dari Python dasar hingga analisis data dengan pandas dan visualisasi',
    description:
      'Belajar Python dengan fokus data science — pandas, numpy, matplotlib, dan basic ML dengan scikit-learn.',
    longDescription:
      'Kursus terstruktur untuk analyst, marketer, atau finance yang ingin pindah ke data analyst. Materi praktis dengan dataset Indonesia (e-commerce, finance, telco) dan capstone analisis nyata.',
    level: 'intermediate',
    durationHours: 22,
    lessonsCount: 40,
    studentsCount: 2480,
    rating: 4.8,
    reviewsCount: 580,
    language: 'Bahasa Indonesia',
    certificate: true,
    priceIdr: 599_000,
    originalPriceIdr: 999_000,
    gradient: ['#0EA5E9', '#10B981'],
    emoji: '🐍',
    category: 'Data & Analytics',
    instructor: INSTRUCTORS.budi,
    whatYouLearn: [
      'Python syntax untuk data science',
      'NumPy: array, broadcasting, vectorization',
      'pandas: DataFrame, groupby, merge, pivot',
      'Visualization: matplotlib, seaborn, plotly',
      'Statistics: descriptive, inferential, hypothesis testing',
      'Machine learning dasar dengan scikit-learn',
      'Capstone: Analisis dataset e-commerce Indonesia',
    ],
    requirements: [
      'Pengalaman dengan Excel (minimal pivot table)',
      'Pemahaman dasar statistik (mean, median, std)',
      'Tidak ada pengalaman Python wajib',
    ],
    targetAudience: [
      'Business analyst transisi ke data analyst',
      'Marketer dan finance yang ingin lebih teknis',
      'Mahasiswa yang ingin mempersiapkan karier di data',
    ],
    modules: [
      {
        title: 'Python Foundation',
        durationMin: 280,
        lessons: [
          { title: 'Setup Jupyter Notebook', durationMin: 22, type: 'video' },
          { title: 'Variabel, kontrol alur, fungsi', durationMin: 40, type: 'video' },
          { title: 'List, dict, tuple, set', durationMin: 35, type: 'video' },
          { title: 'List comprehension', durationMin: 28, type: 'video' },
          { title: 'Latihan: Data toko sederhana', durationMin: 60, type: 'project' },
        ],
      },
      {
        title: 'NumPy & pandas',
        durationMin: 340,
        lessons: [
          { title: 'NumPy: array dan operasi', durationMin: 40, type: 'video' },
          { title: 'pandas: DataFrame essentials', durationMin: 50, type: 'video' },
          { title: 'groupby dan aggregasi', durationMin: 40, type: 'video' },
          { title: 'merge, join, dan pivot', durationMin: 35, type: 'video' },
          { title: 'Latihan: Dataset finance', durationMin: 75, type: 'project' },
        ],
      },
      {
        title: 'Visualization & Stats',
        durationMin: 300,
        lessons: [
          { title: 'matplotlib basics', durationMin: 35, type: 'video' },
          { title: 'seaborn untuk explorasi cepat', durationMin: 30, type: 'video' },
          { title: 'plotly untuk dashboard interaktif', durationMin: 35, type: 'video' },
          { title: 'Statistical testing', durationMin: 40, type: 'video' },
          { title: 'A/B testing dengan Python', durationMin: 60, type: 'project' },
        ],
      },
      {
        title: 'ML Intro & Capstone',
        durationMin: 320,
        lessons: [
          { title: 'Supervised vs unsupervised', durationMin: 28, type: 'video' },
          { title: 'scikit-learn: linear regression', durationMin: 40, type: 'video' },
          { title: 'Classification dasar', durationMin: 35, type: 'video' },
          { title: 'Capstone: E-commerce analysis', durationMin: 120, type: 'project' },
        ],
      },
    ],
    tags: ['Python', 'pandas', 'Data Science', 'Analytics'],
  },
  {
    id: '10',
    slug: 'ui-ux-design-essentials',
    title: 'UI/UX Design Essentials',
    subtitle: 'Fondasi UX research, IxD, dan visual design untuk produk digital',
    description:
      'Belajar UX dari research hingga prototype — dengan Figma sebagai tool utama dan praktik di kasus nyata.',
    longDescription:
      'Kursus untuk siapa pun yang ingin masuk ke product design. Bukan kursus Figma-only — Anda akan belajar UX research, information architecture, interaction design, dan visual design dengan studi kasus dari produk Indonesia.',
    level: 'beginner',
    durationHours: 16,
    lessonsCount: 30,
    studentsCount: 3540,
    rating: 4.7,
    reviewsCount: 780,
    language: 'Bahasa Indonesia',
    certificate: true,
    priceIdr: 'free',
    gradient: ['#EC4899', '#8B5CF6'],
    emoji: '🎨',
    category: 'Design',
    instructor: INSTRUCTORS.citra,
    whatYouLearn: [
      'UX research: user interview, survey, usability test',
      'Information architecture: card sorting, sitemap',
      'Wireframing dan prototyping di Figma',
      'Visual design: tipografi, warna, layout',
      'Design system fundamentals',
      'Handoff ke engineer: developer mode di Figma',
      'Portfolio yang menarik untuk recruiter',
    ],
    requirements: [
      'Komputer dengan Figma (versi gratis sudah cukup)',
      'Tidak ada background design wajib',
      'Mau belajar dengan mengkritik karya orang lain',
    ],
    targetAudience: [
      'Pemula yang ingin masuk product design',
      'Frontend developer yang ingin menguasai UX',
      'PM yang ingin lebih ngerti design rationale',
    ],
    modules: [
      {
        title: 'UX Research',
        durationMin: 260,
        lessons: [
          { title: 'Apa itu UX research', durationMin: 25, type: 'video' },
          { title: 'User interview teknik', durationMin: 35, type: 'video' },
          { title: 'Survey design yang berguna', durationMin: 30, type: 'video' },
          { title: 'Usability test setup', durationMin: 35, type: 'video' },
          { title: 'Latihan: Research sederhana', durationMin: 75, type: 'project' },
        ],
      },
      {
        title: 'IA & Wireframe',
        durationMin: 220,
        lessons: [
          { title: 'Information architecture', durationMin: 28, type: 'video' },
          { title: 'Card sorting', durationMin: 25, type: 'video' },
          { title: 'Sketch & wireframe', durationMin: 30, type: 'video' },
          { title: 'Latihan: IA e-commerce', durationMin: 75, type: 'project' },
        ],
      },
      {
        title: 'Figma Mastery',
        durationMin: 280,
        lessons: [
          { title: 'Figma essentials', durationMin: 35, type: 'video' },
          { title: 'Auto-layout dan responsive', durationMin: 40, type: 'video' },
          { title: 'Components dan variants', durationMin: 45, type: 'video' },
          { title: 'Prototyping interaksi', durationMin: 35, type: 'video' },
          { title: 'Latihan: Mobile app prototype', durationMin: 90, type: 'project' },
        ],
      },
      {
        title: 'Visual & Portfolio',
        durationMin: 220,
        lessons: [
          { title: 'Tipografi yang functional', durationMin: 28, type: 'video' },
          { title: 'Color theory praktis', durationMin: 25, type: 'video' },
          { title: 'Design system intro', durationMin: 32, type: 'video' },
          { title: 'Portfolio yang menarik', durationMin: 30, type: 'video' },
          { title: 'Capstone: Redesign halaman publik', durationMin: 90, type: 'project' },
        ],
      },
    ],
    tags: ['UX', 'UI', 'Figma', 'Design'],
  },
  {
    id: '11',
    slug: 'machine-learning-foundations',
    title: 'Machine Learning Foundations',
    subtitle: 'Algoritma dan intuisi ML untuk engineer produktif',
    description:
      'Dari linear regression hingga gradient boosting — pahami algoritma ML dengan implementasi dari nol.',
    longDescription:
      'Kursus tingkat lanjut untuk developer yang ingin masuk ML serius. Anda akan mengimplementasi algoritma dari nol (tanpa library blackbox) lalu memakai scikit-learn dan XGBoost untuk problem nyata.',
    level: 'advanced',
    durationHours: 28,
    lessonsCount: 46,
    studentsCount: 1320,
    rating: 4.9,
    reviewsCount: 290,
    language: 'Bahasa Indonesia',
    certificate: true,
    priceIdr: 1_299_000,
    originalPriceIdr: 1_999_000,
    gradient: ['#635BFF', '#8B5CF6'],
    emoji: '🤖',
    category: 'Data & Analytics',
    instructor: INSTRUCTORS.andi,
    whatYouLearn: [
      'Matematika ML: linear algebra, calculus, probability',
      'Supervised learning: regression, classification',
      'Unsupervised: clustering, dimensionality reduction',
      'Model evaluation: cross-validation, metrics',
      'Feature engineering dan selection',
      'Ensemble methods: random forest, gradient boosting',
      'Deep learning intro dengan PyTorch',
      'Deployment: model serving dengan FastAPI',
    ],
    requirements: [
      'Python untuk data science (atau lulusan kursus PY-DS)',
      'Kalkulus dasar dan aljabar linear',
      'Probabilitas dan statistik dasar',
    ],
    targetAudience: [
      'Data analyst yang ingin transisi ke ML',
      'Software engineer yang ingin masuk AI',
      'Mahasiswa S2 yang ingin penguatan praktis',
    ],
    modules: [
      {
        title: 'Math Foundations',
        durationMin: 320,
        lessons: [
          { title: 'Linear algebra refresher', durationMin: 50, type: 'video' },
          { title: 'Calculus untuk ML', durationMin: 45, type: 'video' },
          { title: 'Probability dan statistics', durationMin: 50, type: 'video' },
          { title: 'Gradient descent intuition', durationMin: 40, type: 'video' },
        ],
      },
      {
        title: 'Supervised Learning',
        durationMin: 420,
        lessons: [
          { title: 'Linear regression dari nol', durationMin: 55, type: 'video' },
          { title: 'Logistic regression', durationMin: 45, type: 'video' },
          { title: 'Decision tree dan random forest', durationMin: 60, type: 'video' },
          { title: 'XGBoost: kapan dan kenapa', durationMin: 50, type: 'video' },
          { title: 'Proyek: Predict housing prices', durationMin: 90, type: 'project' },
        ],
      },
      {
        title: 'Unsupervised & Eval',
        durationMin: 320,
        lessons: [
          { title: 'K-means dan hierarchical', durationMin: 40, type: 'video' },
          { title: 'PCA dan dimensionality reduction', durationMin: 45, type: 'video' },
          { title: 'Cross-validation strategy', durationMin: 35, type: 'video' },
          { title: 'Metrics: F1, ROC-AUC, log loss', durationMin: 40, type: 'video' },
          { title: 'Feature engineering workshop', durationMin: 60, type: 'project' },
        ],
      },
      {
        title: 'Deep Learning & Deploy',
        durationMin: 380,
        lessons: [
          { title: 'Neural network basics', durationMin: 50, type: 'video' },
          { title: 'PyTorch essentials', durationMin: 60, type: 'video' },
          { title: 'Model deployment dengan FastAPI', durationMin: 55, type: 'video' },
          { title: 'Capstone: End-to-end project', durationMin: 150, type: 'project' },
        ],
      },
    ],
    tags: ['Machine Learning', 'AI', 'Python', 'Deep Learning'],
  },
  {
    id: '12',
    slug: 'devops-with-kubernetes',
    title: 'DevOps with Kubernetes',
    subtitle: 'CI/CD, IaC, dan operations untuk modern infrastructure',
    description:
      'Kelola infrastruktur sebagai code dengan Terraform, Kubernetes, dan GitOps untuk produksi.',
    longDescription:
      'Kursus DevOps yang fokus pada Kubernetes sebagai foundation. Anda akan membangun pipeline CI/CD lengkap dari kode ke produksi, dengan IaC, observability, dan incident response yang siap pakai.',
    level: 'advanced',
    durationHours: 26,
    lessonsCount: 44,
    studentsCount: 1080,
    rating: 4.8,
    reviewsCount: 240,
    language: 'Bahasa Indonesia',
    certificate: true,
    priceIdr: 1_199_000,
    originalPriceIdr: 1_899_000,
    gradient: ['#F59E0B', '#EF4444'],
    emoji: '⚙️',
    category: 'Cloud & DevOps',
    instructor: INSTRUCTORS.eko,
    whatYouLearn: [
      'CI/CD dengan GitHub Actions dan GitLab CI',
      'Infrastructure as Code dengan Terraform',
      'Kubernetes operations day-2',
      'Helm chart untuk packaging',
      'Secret management: Vault, External Secrets',
      'Backup dan disaster recovery',
      'Cost optimization untuk K8s',
      'Incident management dan SLO',
    ],
    requirements: [
      'Pengalaman command line dan Linux',
      'Pengalaman dengan satu cloud provider',
      'Familiar dengan Docker dan Kubernetes basics',
    ],
    targetAudience: [
      'DevOps engineer yang ingin mature praktiknya',
      'SRE yang ingin scaling tim',
      'Platform engineer di growing startup',
    ],
    modules: [
      {
        title: 'CI/CD Pipelines',
        durationMin: 380,
        lessons: [
          { title: 'CI/CD philosophy', durationMin: 25, type: 'video' },
          { title: 'GitHub Actions deep dive', durationMin: 60, type: 'video' },
          { title: 'GitLab CI walkthrough', durationMin: 50, type: 'video' },
          { title: 'Multi-stage build optimization', durationMin: 45, type: 'video' },
          { title: 'Lab: Build pipeline dari nol', durationMin: 100, type: 'project' },
        ],
      },
      {
        title: 'Infrastructure as Code',
        durationMin: 320,
        lessons: [
          { title: 'Terraform fundamentals', durationMin: 50, type: 'video' },
          { title: 'State management dan workspaces', durationMin: 40, type: 'video' },
          { title: 'Modules dan composition', durationMin: 45, type: 'video' },
          { title: 'Lab: Provision K8s cluster dengan Terraform', durationMin: 90, type: 'project' },
        ],
      },
      {
        title: 'K8s Operations',
        durationMin: 340,
        lessons: [
          { title: 'Helm chart authoring', durationMin: 50, type: 'video' },
          { title: 'Secret management', durationMin: 40, type: 'video' },
          { title: 'Backup dengan Velero', durationMin: 35, type: 'video' },
          { title: 'Cost optimization', durationMin: 45, type: 'video' },
          { title: 'Lab: Production-ready Helm chart', durationMin: 80, type: 'project' },
        ],
      },
      {
        title: 'Incident & SLO',
        durationMin: 320,
        lessons: [
          { title: 'SLI/SLO/error budget', durationMin: 35, type: 'video' },
          { title: 'On-call best practices', durationMin: 40, type: 'video' },
          { title: 'Post-mortem writing', durationMin: 30, type: 'video' },
          { title: 'Capstone: Production environment', durationMin: 120, type: 'project' },
        ],
      },
    ],
    tags: ['DevOps', 'Kubernetes', 'Terraform', 'CI/CD'],
  },
  {
    id: '13',
    slug: 'digital-marketing-strategy',
    title: 'Digital Marketing Strategy',
    subtitle: 'Strategi marketing performance untuk produk digital Indonesia',
    description:
      'SEO, paid ads, lifecycle, dan content marketing dalam satu kursus terstruktur dengan dampak terukur.',
    longDescription:
      'Kursus untuk marketer atau founder yang ingin memimpin growth produk digital. Materi disertai studi kasus lokal — startup B2C dan B2B Indonesia — dan template yang bisa langsung dipakai.',
    level: 'intermediate',
    durationHours: 15,
    lessonsCount: 28,
    studentsCount: 2240,
    rating: 4.7,
    reviewsCount: 510,
    language: 'Bahasa Indonesia',
    certificate: true,
    priceIdr: 499_000,
    originalPriceIdr: 899_000,
    gradient: ['#F59E0B', '#0EA5E9'],
    emoji: '📢',
    category: 'Marketing',
    instructor: INSTRUCTORS.dewi,
    whatYouLearn: [
      'Marketing funnel: TOFU, MOFU, BOFU',
      'SEO modern: technical, on-page, content',
      'Paid acquisition: Meta Ads, Google Ads, TikTok',
      'Lifecycle marketing dengan retention',
      'Content marketing yang konversi',
      'Marketing analytics dan attribution',
      'Budget allocation dan ROI tracking',
    ],
    requirements: [
      'Pengalaman dasar marketing 1+ tahun',
      'Familiar dengan satu platform ads (Meta/Google)',
      'Akses Google Analytics atau setara',
    ],
    targetAudience: [
      'Marketer yang ingin level up ke strategist',
      'Founder yang mengelola marketing sendiri',
      'Tech professional yang ingin masuk growth',
    ],
    modules: [
      {
        title: 'Strategy & Funnel',
        durationMin: 240,
        lessons: [
          { title: 'Marketing funnel modern', durationMin: 30, type: 'video' },
          { title: 'ICP dan persona', durationMin: 28, type: 'video' },
          { title: 'Positioning dan messaging', durationMin: 35, type: 'video' },
          { title: 'Workshop: Marketing plan template', durationMin: 75, type: 'project' },
        ],
      },
      {
        title: 'SEO & Content',
        durationMin: 220,
        lessons: [
          { title: 'Technical SEO essentials', durationMin: 35, type: 'video' },
          { title: 'Keyword research modern', durationMin: 30, type: 'video' },
          { title: 'Content strategy yang konversi', durationMin: 32, type: 'video' },
          { title: 'Latihan: Content calendar 3 bulan', durationMin: 60, type: 'project' },
        ],
      },
      {
        title: 'Paid Acquisition',
        durationMin: 240,
        lessons: [
          { title: 'Meta Ads: setup dan optimasi', durationMin: 40, type: 'video' },
          { title: 'Google Ads structure', durationMin: 35, type: 'video' },
          { title: 'TikTok Ads untuk brand baru', durationMin: 30, type: 'video' },
          { title: 'Lab: Campaign Rp 5jt budget', durationMin: 70, type: 'project' },
        ],
      },
      {
        title: 'Lifecycle & Analytics',
        durationMin: 200,
        lessons: [
          { title: 'Email & push lifecycle', durationMin: 32, type: 'video' },
          { title: 'Retention campaign design', durationMin: 28, type: 'video' },
          { title: 'Analytics dan attribution', durationMin: 30, type: 'video' },
          { title: 'Capstone: Growth plan 1 produk', durationMin: 75, type: 'project' },
        ],
      },
    ],
    tags: ['Marketing', 'Growth', 'SEO', 'Paid Ads'],
  },
  {
    id: '14',
    slug: 'leadership-essentials',
    title: 'Leadership Essentials',
    subtitle: 'Fondasi kepemimpinan untuk manajer baru di tim modern',
    description:
      'Dari kontributor individu menjadi pemimpin — feedback, 1-on-1, hiring, dan kepemimpinan situasional.',
    longDescription:
      'Kursus untuk manajer baru atau yang akan jadi manajer. Materi praktis tanpa jargon, dengan template 1-on-1, feedback, dan performance review yang sudah teruji di banyak organisasi Indonesia.',
    level: 'intermediate',
    durationHours: 10,
    lessonsCount: 20,
    studentsCount: 1980,
    rating: 4.8,
    reviewsCount: 450,
    language: 'Bahasa Indonesia',
    certificate: true,
    priceIdr: 'free',
    gradient: ['#10B981', '#F59E0B'],
    emoji: '🧭',
    category: 'Leadership',
    instructor: INSTRUCTORS.fitri,
    whatYouLearn: [
      'Mindset shift: kontributor ke pemimpin',
      'Effective 1-on-1: agenda dan template',
      'Memberikan feedback yang berguna',
      'Hiring: interview dan keputusan',
      'Onboarding karyawan baru 30-60-90',
      'Performance review tanpa drama',
      'Conflict resolution dalam tim',
    ],
    requirements: [
      'Sedang atau akan menjadi manajer dalam 6 bulan',
      'Mau berlatih dengan role-play',
      'Akses ke tim atau peer untuk latihan',
    ],
    targetAudience: [
      'Manajer baru (0-1 tahun)',
      'Tech lead yang transisi ke engineering manager',
      'Founder yang baru membangun tim pertama',
    ],
    modules: [
      {
        title: 'Mindset & Foundation',
        durationMin: 140,
        lessons: [
          { title: 'Apa yang berubah saat jadi manajer', durationMin: 30, type: 'video' },
          { title: 'Trust building dengan tim', durationMin: 35, type: 'video' },
          { title: 'Leadership style situasional', durationMin: 30, type: 'video' },
          { title: 'Refleksi diri', durationMin: 25, type: 'project' },
        ],
      },
      {
        title: '1-on-1 & Feedback',
        durationMin: 170,
        lessons: [
          { title: '1-on-1 yang berguna', durationMin: 35, type: 'video' },
          { title: 'Template agenda 1-on-1', durationMin: 25, type: 'video' },
          { title: 'Feedback: framework SBI', durationMin: 35, type: 'video' },
          { title: 'Latihan: 1-on-1 simulasi', durationMin: 45, type: 'project' },
        ],
      },
      {
        title: 'Performance & Conflict',
        durationMin: 180,
        lessons: [
          { title: 'Goal setting & OKR', durationMin: 30, type: 'video' },
          { title: 'Performance review tanpa drama', durationMin: 35, type: 'video' },
          { title: 'Hiring dan team building', durationMin: 30, type: 'video' },
          { title: 'Conflict resolution skenario', durationMin: 60, type: 'project' },
        ],
      },
    ],
    tags: ['Leadership', 'Management', 'Soft Skill', 'Career'],
  },
  {
    id: '15',
    slug: 'financial-modeling',
    title: 'Financial Modeling & Valuation',
    subtitle: 'Model finansial dan valuasi untuk analyst dan founder',
    description:
      '3-statement model, DCF, dan comparable analysis — siap untuk M&A, fundraising, atau decision support.',
    longDescription:
      'Kursus tingkat lanjut untuk analyst di perbankan, investment, atau corporate finance. Anda akan membangun model dari nol dengan dataset perusahaan publik Indonesia.',
    level: 'advanced',
    durationHours: 24,
    lessonsCount: 38,
    studentsCount: 1450,
    rating: 4.9,
    reviewsCount: 320,
    language: 'Bahasa Indonesia',
    certificate: true,
    priceIdr: 1_499_000,
    originalPriceIdr: 2_499_000,
    gradient: ['#0EA5E9', '#10B981'],
    emoji: '💼',
    category: 'Finance',
    instructor: INSTRUCTORS.hana,
    whatYouLearn: [
      'Excel mastery untuk finance professional',
      '3-statement model (P&L, BS, CF) integrated',
      'Working capital dan capex modeling',
      'DCF: WACC, terminal value, sensitivity',
      'Comparable company analysis (CCA)',
      'Precedent transactions (PCA)',
      'LBO modeling fundamentals',
      'Presenting valuation to executives',
    ],
    requirements: [
      'Background finance atau accounting (S1 atau pengalaman)',
      'Excel intermediate (familiar dengan VLOOKUP, INDEX-MATCH)',
      'Pemahaman dasar laporan keuangan',
    ],
    targetAudience: [
      'Investment banking analyst',
      'Corporate finance professional',
      'Founder yang sedang fundraising',
    ],
    modules: [
      {
        title: 'Excel Mastery',
        durationMin: 300,
        lessons: [
          { title: 'Excel shortcut yang penting', durationMin: 35, type: 'video' },
          { title: 'INDEX-MATCH dan XLOOKUP', durationMin: 40, type: 'video' },
          { title: 'Pivot table untuk analyst', durationMin: 35, type: 'video' },
          { title: 'Financial functions deep dive', durationMin: 40, type: 'video' },
          { title: 'Best practices struktur model', durationMin: 60, type: 'project' },
        ],
      },
      {
        title: '3-Statement Model',
        durationMin: 380,
        lessons: [
          { title: 'P&L dari historical', durationMin: 50, type: 'video' },
          { title: 'Balance Sheet integration', durationMin: 55, type: 'video' },
          { title: 'Cash Flow Statement', durationMin: 45, type: 'video' },
          { title: 'Working capital modeling', durationMin: 40, type: 'video' },
          { title: 'Build: Telkom 5-year model', durationMin: 90, type: 'project' },
        ],
      },
      {
        title: 'DCF Valuation',
        durationMin: 340,
        lessons: [
          { title: 'WACC: cost of equity dan debt', durationMin: 45, type: 'video' },
          { title: 'Free Cash Flow projection', durationMin: 50, type: 'video' },
          { title: 'Terminal value dan exit multiple', durationMin: 40, type: 'video' },
          { title: 'Sensitivity analysis', durationMin: 35, type: 'video' },
          { title: 'DCF: BCA case study', durationMin: 90, type: 'project' },
        ],
      },
      {
        title: 'CCA, PCA & Presenting',
        durationMin: 320,
        lessons: [
          { title: 'Comparable selection', durationMin: 40, type: 'video' },
          { title: 'Multiple analysis', durationMin: 35, type: 'video' },
          { title: 'Football field chart', durationMin: 30, type: 'video' },
          { title: 'Capstone: Full valuation', durationMin: 120, type: 'project' },
        ],
      },
    ],
    tags: ['Finance', 'Valuation', 'Excel', 'Investment Banking'],
  },
  {
    id: '16',
    slug: 'mobile-app-development-flutter',
    title: 'Mobile App Development with Flutter',
    subtitle: 'Build aplikasi mobile iOS & Android dengan satu codebase',
    description:
      'Dari Dart dasar hingga produksi — state management, native integration, dan deployment ke kedua app store.',
    longDescription:
      'Kursus end-to-end untuk membangun aplikasi Flutter siap rilis. Anda akan membangun aplikasi nyata (e-wallet sederhana) dengan state management modern, integrasi API, dan publikasi ke App Store + Play Store.',
    level: 'intermediate',
    durationHours: 20,
    lessonsCount: 36,
    studentsCount: 1840,
    rating: 4.8,
    reviewsCount: 410,
    language: 'Bahasa Indonesia',
    certificate: true,
    priceIdr: 699_000,
    originalPriceIdr: 1_199_000,
    gradient: ['#003DA5', '#0EA5E9'],
    emoji: '📱',
    category: 'Programming',
    instructor: INSTRUCTORS.gilang,
    whatYouLearn: [
      'Dart language fundamentals',
      'Widget tree dan rendering Flutter',
      'State management dengan Riverpod',
      'Navigation 2.0 dan deep linking',
      'API integration dengan dio + retrofit',
      'Native integration (platform channels)',
      'Performance optimization',
      'Publishing ke App Store & Play Store',
    ],
    requirements: [
      'Pengalaman programming 1+ tahun (bahasa apapun)',
      'Komputer dengan macOS (untuk iOS build) atau Windows/Linux',
      'Familiar dengan Git',
    ],
    targetAudience: [
      'Web developer yang ingin pindah ke mobile',
      'Native developer yang ingin coverage cross-platform',
      'Founder yang ingin build MVP mobile sendiri',
    ],
    modules: [
      {
        title: 'Dart & Flutter Basics',
        durationMin: 280,
        lessons: [
          { title: 'Setup Flutter SDK', durationMin: 30, type: 'video' },
          { title: 'Dart essentials', durationMin: 45, type: 'video' },
          { title: 'Widget tree dan rendering', durationMin: 50, type: 'video' },
          { title: 'Layout widgets: Row, Column, Stack', durationMin: 40, type: 'video' },
          { title: 'Latihan: To-do app', durationMin: 60, type: 'project' },
        ],
      },
      {
        title: 'State & Navigation',
        durationMin: 320,
        lessons: [
          { title: 'Stateful vs stateless', durationMin: 35, type: 'video' },
          { title: 'Riverpod: providers', durationMin: 50, type: 'video' },
          { title: 'Navigation 2.0', durationMin: 45, type: 'video' },
          { title: 'Forms dan validation', durationMin: 40, type: 'video' },
          { title: 'Build: Auth flow lengkap', durationMin: 75, type: 'project' },
        ],
      },
      {
        title: 'API & Native',
        durationMin: 300,
        lessons: [
          { title: 'HTTP dengan dio', durationMin: 40, type: 'video' },
          { title: 'Retrofit pattern di Flutter', durationMin: 35, type: 'video' },
          { title: 'Local storage: Hive', durationMin: 35, type: 'video' },
          { title: 'Platform channels intro', durationMin: 40, type: 'video' },
          { title: 'Build: E-wallet API integration', durationMin: 90, type: 'project' },
        ],
      },
      {
        title: 'Publish & Performance',
        durationMin: 300,
        lessons: [
          { title: 'Performance profiling', durationMin: 40, type: 'video' },
          { title: 'Build size optimization', durationMin: 35, type: 'video' },
          { title: 'iOS signing dan App Store', durationMin: 45, type: 'video' },
          { title: 'Android signing dan Play Store', durationMin: 40, type: 'video' },
          { title: 'Capstone: Publish ke kedua store', durationMin: 90, type: 'project' },
        ],
      },
    ],
    tags: ['Flutter', 'Dart', 'Mobile', 'iOS', 'Android'],
  },
  {
    id: '17',
    slug: 'sales-fundamentals',
    title: 'Sales Fundamentals',
    subtitle: 'Skill prospecting, discovery, dan closing untuk B2B sales',
    description:
      'Framework B2B sales yang terbukti — dari riset prospek hingga negosiasi closing dengan dampak bisnis.',
    longDescription:
      'Kursus pemula untuk yang baru masuk B2B sales atau ingin mature praktiknya. Materi praktis dengan template email, skrip discovery, dan playbook negosiasi yang sudah teruji.',
    level: 'beginner',
    durationHours: 8,
    lessonsCount: 18,
    studentsCount: 1620,
    rating: 4.6,
    reviewsCount: 380,
    language: 'Bahasa Indonesia',
    certificate: true,
    priceIdr: 'free',
    gradient: ['#10B981', '#F59E0B'],
    emoji: '💼',
    category: 'Sales',
    instructor: INSTRUCTORS.indra,
    whatYouLearn: [
      'B2B sales funnel modern',
      'Prospecting: tools, kanal, kuantitas',
      'Email outreach yang berhasil',
      'Discovery call framework MEDDIC',
      'Demo yang fokus pada outcome',
      'Negosiasi dan handling objection',
      'CRM hygiene untuk pipeline yang akurat',
    ],
    requirements: [
      'Mau berlatih dengan role-play',
      'LinkedIn account (gratis sudah cukup)',
      'Akses ke CRM apapun (HubSpot Free direkomendasikan)',
    ],
    targetAudience: [
      'Fresh grad atau career switcher ke sales',
      'BDR/SDR yang ingin level up ke AE',
      'Founder yang harus selling sendiri',
    ],
    modules: [
      {
        title: 'Prospecting',
        durationMin: 140,
        lessons: [
          { title: 'ICP dan target list', durationMin: 25, type: 'video' },
          { title: 'LinkedIn untuk prospecting', durationMin: 28, type: 'video' },
          { title: 'Email outreach yang dibalas', durationMin: 30, type: 'video' },
          { title: 'Latihan: 20 email outreach', durationMin: 45, type: 'project' },
        ],
      },
      {
        title: 'Discovery & Demo',
        durationMin: 160,
        lessons: [
          { title: 'MEDDIC framework', durationMin: 35, type: 'video' },
          { title: 'Discovery call agenda', durationMin: 30, type: 'video' },
          { title: 'Demo focus on outcome', durationMin: 30, type: 'video' },
          { title: 'Role-play: Discovery call', durationMin: 50, type: 'project' },
        ],
      },
      {
        title: 'Negotiation & Close',
        durationMin: 140,
        lessons: [
          { title: 'Handling objection', durationMin: 30, type: 'video' },
          { title: 'Negotiation framework', durationMin: 32, type: 'video' },
          { title: 'Closing the deal', durationMin: 28, type: 'video' },
          { title: 'CRM hygiene', durationMin: 30, type: 'video' },
        ],
      },
    ],
    tags: ['Sales', 'B2B', 'Negotiation', 'CRM'],
  },
  {
    id: '18',
    slug: 'public-speaking',
    title: 'Public Speaking & Komunikasi',
    subtitle: 'Bicara di depan tim, klien, dan publik dengan percaya diri',
    description:
      'Dari menyiapkan materi hingga delivery — framework yang dipakai speaker top untuk pitch dan presentation.',
    longDescription:
      'Kursus singkat untuk siapa pun yang sering presentation tapi belum pernah belajar serius. Materi praktis dengan rekaman analyzer dan feedback yang bisa diterapkan langsung.',
    level: 'beginner',
    durationHours: 6,
    lessonsCount: 12,
    studentsCount: 2890,
    rating: 4.7,
    reviewsCount: 670,
    language: 'Bahasa Indonesia',
    certificate: true,
    priceIdr: 'free',
    gradient: ['#EC4899', '#0EA5E9'],
    emoji: '🎤',
    category: 'Soft Skill',
    instructor: INSTRUCTORS.dewi,
    whatYouLearn: [
      'Storytelling untuk presentation',
      'Struktur narasi: hook, body, close',
      'Slide design yang mendukung (bukan distract)',
      'Body language dan voice modulation',
      'Mengelola grogi dengan teknik nyata',
      'Q&A handling yang elegan',
      'Pitch deck untuk fundraising/proposal',
    ],
    requirements: [
      'Punya presentation upcoming dalam 1-3 bulan',
      'Akses kamera atau HP untuk merekam',
      'Mau menonton ulang rekaman sendiri',
    ],
    targetAudience: [
      'Profesional yang sering present internal',
      'Founder yang harus pitch ke investor',
      'Manajer yang harus present ke tim atau eksternal',
    ],
    modules: [
      {
        title: 'Persiapan',
        durationMin: 110,
        lessons: [
          { title: 'Storytelling fundamentals', durationMin: 28, type: 'video' },
          { title: 'Struktur narasi', durationMin: 25, type: 'video' },
          { title: 'Slide design 101', durationMin: 28, type: 'video' },
          { title: 'Latihan: Outline presentation', durationMin: 30, type: 'project' },
        ],
      },
      {
        title: 'Delivery',
        durationMin: 130,
        lessons: [
          { title: 'Body language', durationMin: 28, type: 'video' },
          { title: 'Voice dan intonation', durationMin: 25, type: 'video' },
          { title: 'Mengelola grogi', durationMin: 22, type: 'video' },
          { title: 'Latihan: Rekam diri sendiri', durationMin: 55, type: 'project' },
        ],
      },
      {
        title: 'Q&A & Pitch',
        durationMin: 110,
        lessons: [
          { title: 'Q&A handling', durationMin: 25, type: 'video' },
          { title: 'Pitch deck structure', durationMin: 30, type: 'video' },
          { title: 'Demo day style pitch', durationMin: 25, type: 'video' },
          { title: 'Mock presentation', durationMin: 30, type: 'project' },
        ],
      },
    ],
    tags: ['Public Speaking', 'Communication', 'Soft Skill', 'Pitch'],
  },
]

export function findCourse(slug: string): DummyCourse | undefined {
  return DUMMY_COURSES.find((c) => c.slug === slug)
}

export function relatedCourses(slug: string, n = 3): DummyCourse[] {
  const current = findCourse(slug)
  if (!current) return DUMMY_COURSES.slice(0, n)
  return DUMMY_COURSES
    .filter((c) => c.slug !== slug)
    .sort((a, b) => {
      const aScore =
        (a.category === current.category ? 3 : 0) +
        (a.instructor.name === current.instructor.name ? 2 : 0) +
        (a.level === current.level ? 1 : 0)
      const bScore =
        (b.category === current.category ? 3 : 0) +
        (b.instructor.name === current.instructor.name ? 2 : 0) +
        (b.level === current.level ? 1 : 0)
      return bScore - aScore
    })
    .slice(0, n)
}

export const LEVEL_LABEL: Record<CourseLevel, string> = {
  beginner: 'Pemula',
  intermediate: 'Menengah',
  advanced: 'Lanjutan',
}

export const LEVEL_COLOR: Record<CourseLevel, string> = {
  beginner: '#10B981',
  intermediate: '#F59E0B',
  advanced: '#EF4444',
}

export const LESSON_TYPE_LABEL: Record<CourseLesson['type'], string> = {
  video: 'Video',
  article: 'Artikel',
  quiz: 'Kuis',
  project: 'Proyek',
}
