// TEMPORARY DUMMY DATA — replace with prisma query / CMS once review is approved.

export type PressCategory =
  | 'Pendanaan'
  | 'Produk'
  | 'Kemitraan'
  | 'Riset'
  | 'Penghargaan'

export const PRESS_CATEGORY_COLOR: Record<PressCategory, string> = {
  Pendanaan: '#10B981',
  Produk: '#635BFF',
  Kemitraan: '#0EA5E9',
  Riset: '#F59E0B',
  Penghargaan: '#EC4899',
}

export type PressSection =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'list'; items: string[]; ordered?: boolean }
  | { type: 'quote'; text: string; author: string; role: string }
  | { type: 'stat'; items: { value: string; label: string }[] }

export type PressRelease = {
  slug: string
  category: PressCategory
  date: string
  dateIso: string
  dateline: string
  title: string
  subtitle: string
  excerpt: string
  body: PressSection[]
  contact: {
    name: string
    role: string
    email: string
    phone: string
  }
  downloads: { label: string; format: string; href: string }[]
  tags: string[]
}

const DEFAULT_CONTACT = {
  name: 'Maya Pratiwi',
  role: 'VP Communications, RPI',
  email: 'press@rumahpekerja.id',
  phone: '+62 21 5000 1020',
}

const BOILERPLATE_DOWNLOAD = {
  label: 'Boilerplate & Logo Pack',
  format: 'ZIP · 12 MB',
  href: '/press-kit/RPI-Press-Kit-Full.zip',
}

export const PRESS_RELEASES: PressRelease[] = [
  {
    slug: 'seri-c-2026',
    category: 'Pendanaan',
    date: '15 Mei 2026',
    dateIso: '2026-05-15',
    dateline: 'Jakarta, 15 Mei 2026',
    title: 'RPI Tutup Pendanaan Seri C Senilai USD 85 Juta untuk Skalakan Platform Multi-Tenant',
    subtitle:
      'Dipimpin oleh East Ventures dan Sequoia SEA, dengan partisipasi MDI dan BRI Ventures. Dana akan digunakan untuk ekspansi ke 5 kota baru dan investasi AI.',
    excerpt:
      'Dipimpin oleh East Ventures dan Sequoia SEA, dengan partisipasi MDI dan BRI Ventures. Dana akan digunakan untuk ekspansi ke 5 kota baru dan investasi AI.',
    tags: ['Pendanaan', 'Seri C', 'Ekspansi', 'AI'],
    body: [
      {
        type: 'p',
        text: 'Rumah Pekerja Indonesia (RPI) hari ini mengumumkan penutupan pendanaan Seri C senilai USD 85 juta. Putaran ini dipimpin oleh East Ventures dan Sequoia SEA, dengan partisipasi dari MDI Ventures, BRI Ventures, dan investor strategis lainnya. Dana baru ini akan digunakan untuk ekspansi geografis, akselerasi investasi AI, dan memperkuat tim engineering.',
      },
      { type: 'h2', text: 'Skala saat ini' },
      {
        type: 'p',
        text: 'Sejak didirikan di 2021, RPI telah berkembang menjadi platform multi-tenant terbesar di Indonesia untuk perekrutan dan pelatihan. Pengguna platform telah tumbuh 3,4× dalam 12 bulan terakhir.',
      },
      {
        type: 'stat',
        items: [
          { value: '2.4M+', label: 'Pekerja terdaftar' },
          { value: '12K+', label: 'Mitra perekrut' },
          { value: '34', label: 'Provinsi terjangkau' },
          { value: 'USD 85M', label: 'Total Seri C' },
        ],
      },
      { type: 'h2', text: 'Penggunaan dana' },
      {
        type: 'p',
        text: 'Dana baru akan dialokasikan untuk tiga prioritas utama: ekspansi operasional ke 5 kota baru di Indonesia Timur (Manado, Ambon, Jayapura, Kupang, Makassar), akselerasi investasi AI untuk matching algoritma dan deteksi penipuan, dan menambah 60 anggota tim engineering selama 12 bulan ke depan.',
      },
      {
        type: 'list',
        items: [
          'Ekspansi geografis: USD 32M (38%) — investasi tim lokal, operasi, dan partnership di 5 kota baru',
          'AI & Engineering: USD 28M (33%) — platform AI, talent matching, fraud detection',
          'Talent acquisition: USD 15M (18%) — hiring engineer, designer, dan product manager',
          'Working capital & buffer: USD 10M (11%) — cadangan operasional 24 bulan',
        ],
      },
      {
        type: 'quote',
        text: 'Investasi ini bukan tentang membuat platform yang lebih besar — tetapi tentang membuat akses ke pekerjaan layak lebih merata di seluruh Indonesia. Kami baru memulai 35% dari potensi pasar nasional.',
        author: 'Arif Wibowo',
        role: 'Co-Founder & CEO, RPI',
      },
      { type: 'h2', text: 'Komentar investor' },
      {
        type: 'quote',
        text: 'RPI adalah salah satu dari sedikit founder team yang membangun infrastructure-grade product dengan kecepatan startup. Ratenya pada metrik unit economics — gross margin di atas 78%, retention 12-bulan di angka 91% — sangat jarang di pasar talent tech.',
        author: 'Willson Cuaca',
        role: 'Managing Partner, East Ventures',
      },
      { type: 'h2', text: 'Tentang RPI' },
      {
        type: 'p',
        text: 'Didirikan di 2021, Rumah Pekerja Indonesia (RPI) adalah platform multi-tenant terdepan di Indonesia untuk perekrutan dan pelatihan. Platform melayani 2,4 juta+ pekerja, 12.000+ mitra perekrut, dan beroperasi di 34 provinsi. RPI telah menyalurkan lebih dari 180.000 penempatan kerja sejak didirikan.',
      },
    ],
    contact: DEFAULT_CONTACT,
    downloads: [
      { label: 'Siaran Pers (PDF)', format: 'PDF · 480 KB', href: '/press-kit/seri-c-2026.pdf' },
      { label: 'Foto Eksekutif', format: 'ZIP · 18 MB', href: '/press-kit/exec-photos.zip' },
      { label: 'Deck Investor (highlights)', format: 'PDF · 6 MB', href: '/press-kit/seri-c-deck-highlights.pdf' },
      BOILERPLATE_DOWNLOAD,
    ],
  },
  {
    slug: 'rpi-academy-launch',
    category: 'Produk',
    date: '28 April 2026',
    dateIso: '2026-04-28',
    dateline: 'Jakarta, 28 April 2026',
    title: 'Peluncuran RPI Academy — Platform Pembelajaran Terverifikasi Industri',
    subtitle:
      'Kursus mikro 4–12 jam dengan sertifikasi diakui 200+ perekrut. Tersedia gratis untuk semua pengguna terdaftar.',
    excerpt:
      'Kursus mikro 4–12 jam dengan sertifikasi diakui 200+ perekrut. Tersedia gratis untuk semua pengguna terdaftar.',
    tags: ['RPI Academy', 'Pembelajaran', 'Sertifikasi'],
    body: [
      {
        type: 'p',
        text: 'Rumah Pekerja Indonesia hari ini meluncurkan RPI Academy, platform pembelajaran online dengan sertifikasi yang sudah diakui oleh 200+ mitra perekrut RPI. Berbeda dari platform belajar lain, RPI Academy mengintegrasikan langsung outcome belajar dengan akses ke lowongan kerja terverifikasi.',
      },
      { type: 'h2', text: 'Fitur utama' },
      {
        type: 'list',
        items: [
          'Kursus mikro 4-12 jam yang dirancang untuk diselesaikan dalam 1-2 minggu',
          'Sertifikasi yang divalidasi 200+ mitra perekrut — bukan kertas dekoratif',
          'Capstone project berbasis kasus nyata, dengan feedback dari instruktur industri',
          'Akses gratis untuk semua pengguna terdaftar — selamanya',
          'Tersedia dalam Bahasa Indonesia dan Inggris',
        ],
      },
      {
        type: 'stat',
        items: [
          { value: '60+', label: 'Kursus tersedia saat launch' },
          { value: '12', label: 'Jalur karier terstruktur' },
          { value: '200+', label: 'Mitra mengakui sertifikat' },
          { value: 'Gratis', label: 'Untuk pencari kerja' },
        ],
      },
      {
        type: 'quote',
        text: 'Banyak kursus online memberi sertifikat, tetapi tidak ada perekrut yang benar-benar menggunakannya. Kami membangun Academy dengan pendekatan berbeda — sertifikat yang dapat dipakai untuk membuktikan skill, dengan jalur langsung ke lowongan kerja yang relevan.',
        author: 'Indra Kusuma',
        role: 'Head of Academy, RPI',
      },
      { type: 'h2', text: 'Konten dari praktisi industri' },
      {
        type: 'p',
        text: 'Kurikulum RPI Academy dikembangkan bersama 40+ praktisi senior dari perusahaan seperti Telkom, Tokopedia, BCA, dan Gojek. Setiap kursus didesain untuk menghasilkan outcome yang terukur — bukan jam belajar, tetapi project portfolio yang dapat ditunjukkan ke perekrut.',
      },
      { type: 'h2', text: 'Untuk perekrut' },
      {
        type: 'p',
        text: 'Mitra perekrut RPI dapat melihat kandidat yang telah lulus kursus tertentu langsung di dashboard ATS mereka. Ini mempercepat skrining awal untuk role dengan skill spesifik yang sulit dievaluasi dari CV.',
      },
      { type: 'h2', text: 'Tentang RPI' },
      {
        type: 'p',
        text: 'Didirikan di 2021, Rumah Pekerja Indonesia (RPI) adalah platform multi-tenant terdepan di Indonesia untuk perekrutan dan pelatihan. Platform melayani 2,4 juta+ pekerja dan 12.000+ mitra perekrut di seluruh Indonesia.',
      },
    ],
    contact: DEFAULT_CONTACT,
    downloads: [
      { label: 'Siaran Pers (PDF)', format: 'PDF · 320 KB', href: '/press-kit/rpi-academy-launch.pdf' },
      { label: 'Screenshot Academy', format: 'ZIP · 24 MB', href: '/press-kit/academy-screenshots.zip' },
      { label: 'Daftar Mitra Pengaku Sertifikat', format: 'PDF · 180 KB', href: '/press-kit/academy-partners.pdf' },
      BOILERPLATE_DOWNLOAD,
    ],
  },
  {
    slug: 'kemnaker-partnership',
    category: 'Kemitraan',
    date: '12 April 2026',
    dateIso: '2026-04-12',
    dateline: 'Jakarta, 12 April 2026',
    title: 'RPI Bermitra dengan Kementerian Ketenagakerjaan untuk Program Re-skilling Nasional',
    subtitle:
      'Inisiatif 3 tahun menargetkan 500.000 pekerja transisi dari industri tradisional ke ekonomi digital, dengan biaya pelatihan ditanggung pemerintah.',
    excerpt:
      'Inisiatif 3 tahun menargetkan 500.000 pekerja transisi dari industri tradisional ke ekonomi digital, dengan biaya pelatihan ditanggung pemerintah.',
    tags: ['Pemerintah', 'Re-skilling', 'Kemnaker'],
    body: [
      {
        type: 'p',
        text: 'Rumah Pekerja Indonesia (RPI) hari ini menandatangani Memorandum of Understanding (MoU) dengan Kementerian Ketenagakerjaan untuk program re-skilling nasional bernama "Indonesia Skilled 2029". Program 3 tahun ini menargetkan 500.000 pekerja yang sedang transisi dari industri tradisional ke ekonomi digital.',
      },
      { type: 'h2', text: 'Skala dan target' },
      {
        type: 'stat',
        items: [
          { value: '500K', label: 'Target pekerja' },
          { value: '34', label: 'Provinsi' },
          { value: '3 tahun', label: 'Durasi program' },
          { value: '100%', label: 'Biaya pemerintah' },
        ],
      },
      { type: 'h2', text: 'Cakupan program' },
      {
        type: 'list',
        ordered: true,
        items: [
          'Tahap 1 (2026-2027): Pilot di 8 provinsi dengan 80.000 peserta — fokus pada pekerja industri tekstil, perikanan, dan pertanian',
          'Tahap 2 (2027-2028): Ekspansi ke 20 provinsi dengan 200.000 peserta tambahan',
          'Tahap 3 (2028-2029): Cakupan nasional 34 provinsi dengan total 500.000 peserta',
        ],
      },
      {
        type: 'p',
        text: 'Peserta program akan mendapatkan akses gratis ke kursus RPI Academy, sertifikasi terverifikasi, dan jalur langsung ke mitra perekrut di sektor target (e-commerce, fintech, logistik digital, agritech).',
      },
      {
        type: 'quote',
        text: 'Indonesia membutuhkan jembatan dari ekonomi tradisional ke ekonomi digital — bukan dengan menghilangkan pekerjaan lama, tetapi dengan mempersiapkan pekerja untuk peluang baru. Kemitraan ini adalah eksekusi konkret dari visi tersebut.',
        author: 'Ir. Ida Fauziyah',
        role: 'Menteri Ketenagakerjaan RI',
      },
      {
        type: 'quote',
        text: 'Ini bukan program "training kemudian harapan". Kami menjamin setiap peserta yang lulus akan mendapat minimum 3 interview dengan mitra perekrut RPI dalam 60 hari pasca-kelulusan. Akuntabilitas outcome adalah inti dari kemitraan ini.',
        author: 'Arif Wibowo',
        role: 'Co-Founder & CEO, RPI',
      },
      { type: 'h2', text: 'Cara mendaftar' },
      {
        type: 'p',
        text: 'Pendaftaran tahap pilot dibuka mulai 1 Juni 2026 di portal kemnaker.go.id/skilled2029. Prioritas diberikan untuk pekerja yang terdampak transisi industri di 8 provinsi pilot. Informasi lengkap tersedia di portal Kemnaker dan rumahpekerja.id/skilled2029.',
      },
      { type: 'h2', text: 'Tentang RPI' },
      {
        type: 'p',
        text: 'Didirikan di 2021, Rumah Pekerja Indonesia (RPI) adalah platform multi-tenant terdepan di Indonesia untuk perekrutan dan pelatihan. Platform melayani 2,4 juta+ pekerja dan 12.000+ mitra perekrut di seluruh Indonesia.',
      },
    ],
    contact: DEFAULT_CONTACT,
    downloads: [
      { label: 'Siaran Pers (PDF)', format: 'PDF · 420 KB', href: '/press-kit/kemnaker-mou.pdf' },
      { label: 'Foto Penandatanganan', format: 'ZIP · 32 MB', href: '/press-kit/mou-photos.zip' },
      { label: 'Detail Program Skilled 2029', format: 'PDF · 1.2 MB', href: '/press-kit/skilled-2029-detail.pdf' },
      BOILERPLATE_DOWNLOAD,
    ],
  },
  {
    slug: 'state-of-work-2026',
    category: 'Riset',
    date: '20 Maret 2026',
    dateIso: '2026-03-20',
    dateline: 'Jakarta, 20 Maret 2026',
    title: 'Laporan State of Work Indonesia 2026 Diluncurkan',
    subtitle:
      'Studi terbesar pasar tenaga kerja Indonesia: 12.400 pekerja dan 480 perekrut disurvei. Mengungkap pergeseran besar pasca-era hybrid.',
    excerpt:
      'Studi terbesar pasar tenaga kerja Indonesia: 12.400 pekerja dan 480 perekrut disurvei. Mengungkap pergeseran besar pasca-era hybrid.',
    tags: ['Riset', 'State of Work', '2026'],
    body: [
      {
        type: 'p',
        text: 'Rumah Pekerja Indonesia (RPI) merilis laporan "State of Work Indonesia 2026" — studi tahunan terbesar tentang pasar tenaga kerja Indonesia. Tahun ini, tim riset RPI menyurvei 12.400 pekerja aktif dan 480 perekrut dari 12 industri di seluruh provinsi.',
      },
      { type: 'h2', text: 'Tiga temuan utama' },
      {
        type: 'list',
        ordered: true,
        items: [
          'Remote-first tidak lagi menjadi pemenang otomatis — preferensi hybrid 2-3 hari naik dari 22% (2024) ke 41% (2026)',
          'Ekspektasi gaji junior naik 23% YoY — junior software engineer median Rp 11,5jt (dari Rp 9,3jt)',
          'Benefit non-tunai jadi pembeda utama — anggaran belajar, mental health, dan PTO berbasis trust mengalahkan bonus tunai',
        ],
      },
      {
        type: 'stat',
        items: [
          { value: '12.400', label: 'Pekerja disurvei' },
          { value: '480', label: 'Perekrut' },
          { value: '12', label: 'Industri' },
          { value: '34', label: 'Provinsi' },
        ],
      },
      {
        type: 'quote',
        text: 'Yang paling menarik dari riset tahun ini bukan apa yang sudah berubah — tetapi seberapa cepat preferensi berubah. Jika tim TA Anda masih bekerja dengan asumsi 2024, Anda kehilangan kandidat berkualitas tinggi tanpa sadar.',
        author: 'Tim Riset RPI',
        role: 'Insight Editorial',
      },
      { type: 'h2', text: 'Akses laporan' },
      {
        type: 'p',
        text: 'Laporan lengkap (84 halaman) tersedia gratis untuk semua mitra RPI di dashboard mereka. Untuk publik umum, ringkasan eksekutif (24 halaman) dapat diunduh di rumahpekerja.id/state-of-work-2026. Versi data mentah (dengan opt-in anonymized data) tersedia untuk peneliti akademik atas permintaan.',
      },
      { type: 'h2', text: 'Tentang RPI' },
      {
        type: 'p',
        text: 'Didirikan di 2021, Rumah Pekerja Indonesia (RPI) adalah platform multi-tenant terdepan di Indonesia untuk perekrutan dan pelatihan. Platform melayani 2,4 juta+ pekerja dan 12.000+ mitra perekrut di seluruh Indonesia.',
      },
    ],
    contact: DEFAULT_CONTACT,
    downloads: [
      { label: 'Ringkasan Eksekutif (24 hal)', format: 'PDF · 4.8 MB', href: '/press-kit/sow-2026-exec.pdf' },
      { label: 'Laporan Lengkap (84 hal)', format: 'PDF · 18 MB', href: '/press-kit/sow-2026-full.pdf' },
      { label: 'Charts & Data Tables', format: 'ZIP · 2.4 MB', href: '/press-kit/sow-2026-charts.zip' },
      BOILERPLATE_DOWNLOAD,
    ],
  },
  {
    slug: 'talent-matching-ai',
    category: 'Produk',
    date: '8 Maret 2026',
    dateIso: '2026-03-08',
    dateline: 'Jakarta, 8 Maret 2026',
    title: 'RPI Luncurkan Talent Matching AI dengan Bias-Audit Pihak Ketiga',
    subtitle:
      'Sistem rekomendasi kandidat baru yang diaudit independen untuk meminimalkan bias gender, usia, dan asal sekolah — pertama di Indonesia.',
    excerpt:
      'Sistem rekomendasi kandidat baru yang diaudit independen untuk meminimalkan bias gender, usia, dan asal sekolah — pertama di Indonesia.',
    tags: ['AI', 'Talent Matching', 'Bias Audit', 'Etika'],
    body: [
      {
        type: 'p',
        text: 'Rumah Pekerja Indonesia (RPI) hari ini meluncurkan Talent Matching AI generasi baru — sistem rekomendasi kandidat yang telah menjalani audit bias independen oleh pihak ketiga. Ini menjadi platform talent pertama di Indonesia yang menerbitkan laporan bias-audit publik.',
      },
      { type: 'h2', text: 'Mengapa audit bias penting' },
      {
        type: 'p',
        text: 'Sistem AI matching dapat secara tidak sengaja memperkuat bias yang ada dalam data historis — preferensi gender tertentu, usia, atau asal universitas. RPI memutuskan untuk men-audit sistem secara independen sebelum scale, agar bias dapat dideteksi dan dikoreksi sebelum berdampak pada keputusan rekrutmen jutaan pengguna.',
      },
      { type: 'h2', text: 'Metodologi audit' },
      {
        type: 'list',
        items: [
          'Audit dilakukan oleh Tim AI Ethics Universitas Indonesia, di luar struktur RPI',
          'Sample 50.000 keputusan matching dari produksi (anonimisasi penuh)',
          'Pengujian 14 dimensi bias: gender, usia, asal sekolah, lokasi, suku, agama, status disabilitas, dll.',
          'Disclosure lengkap di laporan publik 38 halaman',
        ],
      },
      { type: 'h2', text: 'Hasil audit awal' },
      {
        type: 'p',
        text: 'Audit pertama menemukan 3 area bias signifikan: preferensi asal universitas (PTN top), bias usia di role senior, dan bias gender di role technical leadership. RPI telah menerapkan tindakan perbaikan dan akan menjalankan audit ulang setiap 6 bulan.',
      },
      {
        type: 'stat',
        items: [
          { value: '14', label: 'Dimensi bias diuji' },
          { value: '50K', label: 'Keputusan diaudit' },
          { value: '6 bulan', label: 'Siklus re-audit' },
          { value: 'Publik', label: 'Disclosure laporan' },
        ],
      },
      {
        type: 'quote',
        text: 'Kami tidak akan mengklaim "AI tanpa bias" — itu tidak realistis. Yang kami janjikan adalah transparansi: setiap 6 bulan, laporan audit akan dipublikasikan. Anda bisa melihat di mana kami berhasil dan di mana kami masih perlu memperbaiki.',
        author: 'Siti Nurhasanah',
        role: 'Co-Founder & CTO, RPI',
      },
      { type: 'h2', text: 'Akses laporan audit' },
      {
        type: 'p',
        text: 'Laporan audit lengkap dapat diakses di rumahpekerja.id/transparency. Tim AI Ethics UI dapat dihubungi langsung untuk pertanyaan metodologi.',
      },
      { type: 'h2', text: 'Tentang RPI' },
      {
        type: 'p',
        text: 'Didirikan di 2021, Rumah Pekerja Indonesia (RPI) adalah platform multi-tenant terdepan di Indonesia untuk perekrutan dan pelatihan. Platform melayani 2,4 juta+ pekerja dan 12.000+ mitra perekrut di seluruh Indonesia.',
      },
    ],
    contact: DEFAULT_CONTACT,
    downloads: [
      { label: 'Siaran Pers (PDF)', format: 'PDF · 380 KB', href: '/press-kit/talent-matching-ai.pdf' },
      { label: 'Laporan Audit Bias (38 hal)', format: 'PDF · 6.2 MB', href: '/press-kit/bias-audit-2026.pdf' },
      { label: 'Ringkasan Metodologi', format: 'PDF · 1.4 MB', href: '/press-kit/bias-methodology.pdf' },
      BOILERPLATE_DOWNLOAD,
    ],
  },
  {
    slug: 'linkedin-top-startup',
    category: 'Penghargaan',
    date: '14 Februari 2026',
    dateIso: '2026-02-14',
    dateline: 'Jakarta, 14 Februari 2026',
    title: 'RPI Dinobatkan sebagai LinkedIn Top Startup Indonesia 2026',
    subtitle:
      'Pertama kalinya platform talent Indonesia masuk daftar — diukur dari pertumbuhan karyawan, engagement, dan retensi talenta.',
    excerpt:
      'Pertama kalinya platform talent Indonesia masuk daftar — diukur dari pertumbuhan karyawan, engagement, dan retensi talenta.',
    tags: ['Penghargaan', 'LinkedIn', 'Top Startup'],
    body: [
      {
        type: 'p',
        text: 'Rumah Pekerja Indonesia (RPI) hari ini dinobatkan sebagai LinkedIn Top Startup Indonesia 2026, menjadi platform talent pertama yang masuk daftar bergengsi tersebut. Penghargaan tahunan ini diberikan kepada startup dengan pertumbuhan, engagement, dan retensi talenta tertinggi di pasar Indonesia.',
      },
      { type: 'h2', text: 'Kriteria evaluasi' },
      {
        type: 'p',
        text: 'LinkedIn Top Startup dievaluasi berdasarkan empat dimensi utama: pertumbuhan karyawan, engagement (interaksi dengan brand di platform), retensi talenta (turnover di bawah benchmark industri), dan job interest (jumlah pencarian aktif untuk peran di perusahaan).',
      },
      {
        type: 'stat',
        items: [
          { value: '2,4×', label: 'Pertumbuhan karyawan YoY' },
          { value: '94%', label: 'Retensi 12-bulan' },
          { value: '6,8×', label: 'Engagement di atas median' },
          { value: '#1', label: 'di kategori HR Tech' },
        ],
      },
      {
        type: 'quote',
        text: 'Penghargaan ini lebih dari sekadar pengakuan — ini adalah validasi bahwa membangun tempat kerja yang serius tentang kualitas dapat menjadi keunggulan kompetitif. Kami merekrut pelan dengan standar tinggi, dan ini hasilnya.',
        author: 'Siti Nurhasanah',
        role: 'Co-Founder & CTO, RPI',
      },
      { type: 'h2', text: 'Apa artinya untuk RPI' },
      {
        type: 'p',
        text: 'Penghargaan ini akan dipakai untuk meningkatkan kesadaran tentang lowongan internal RPI, terutama di tim engineering, design, dan product yang sedang scaling. RPI akan membuka 60+ posisi baru selama 12 bulan ke depan.',
      },
      { type: 'h2', text: 'Tentang RPI' },
      {
        type: 'p',
        text: 'Didirikan di 2021, Rumah Pekerja Indonesia (RPI) adalah platform multi-tenant terdepan di Indonesia untuk perekrutan dan pelatihan. Platform melayani 2,4 juta+ pekerja dan 12.000+ mitra perekrut di seluruh Indonesia.',
      },
    ],
    contact: DEFAULT_CONTACT,
    downloads: [
      { label: 'Siaran Pers (PDF)', format: 'PDF · 280 KB', href: '/press-kit/linkedin-top-startup.pdf' },
      { label: 'Foto Tim RPI', format: 'ZIP · 28 MB', href: '/press-kit/team-photos-2026.zip' },
      BOILERPLATE_DOWNLOAD,
    ],
  },
  {
    slug: 'telkom-partnership',
    category: 'Kemitraan',
    date: '5 Januari 2026',
    dateIso: '2026-01-05',
    dateline: 'Jakarta, 5 Januari 2026',
    title: 'Telkom Indonesia Pilih RPI sebagai Platform Resmi Karier Telkom Group',
    subtitle:
      '12 anak perusahaan Telkom akan menggunakan RPI sebagai sistem ATS terkonsolidasi mereka — kontrak 5 tahun senilai USD 14 juta.',
    excerpt:
      '12 anak perusahaan Telkom akan menggunakan RPI sebagai sistem ATS terkonsolidasi mereka — kontrak 5 tahun senilai USD 14 juta.',
    tags: ['Kemitraan', 'Telkom', 'Enterprise', 'ATS'],
    body: [
      {
        type: 'p',
        text: 'PT Telkom Indonesia (TLKM) hari ini mengumumkan pemilihan Rumah Pekerja Indonesia (RPI) sebagai platform resmi perekrutan untuk Telkom Group. Kontrak 5 tahun bernilai USD 14 juta mencakup 12 anak perusahaan termasuk Telkomsel, Telkomsigma, dan Mitratel.',
      },
      { type: 'h2', text: 'Cakupan implementasi' },
      {
        type: 'list',
        items: [
          '12 anak perusahaan Telkom Group dalam satu kontrak induk',
          'Multi-tenant ATS dengan branding terpisah per entitas',
          'Konsolidasi 6 sistem rekrutmen lama menjadi 1 platform',
          'Migrasi data historis 4 tahun (1,2 juta kandidat) dalam 90 hari',
          'Integrasi dengan HRIS internal dan SAP SuccessFactors',
        ],
      },
      {
        type: 'stat',
        items: [
          { value: '12', label: 'Anak perusahaan' },
          { value: 'USD 14M', label: 'Total kontrak 5 tahun' },
          { value: '1,2M', label: 'Kandidat dimigrasi' },
          { value: '90 hari', label: 'Implementasi' },
        ],
      },
      {
        type: 'quote',
        text: 'Telkom Group telah lama mencari platform yang dapat mendukung kompleksitas organisasi kami — multi-entitas, multi-industri, dan ketat compliance. RPI memberi kami arsitektur yang tepat dan tim implementasi yang memahami konteks lokal kami.',
        author: 'Rina Adriani',
        role: 'Group Head of Talent Acquisition, Telkom',
      },
      {
        type: 'quote',
        text: 'Ini adalah deal terbesar di sejarah RPI dan validasi penting bahwa platform multi-tenant kami siap untuk grup usaha berskala besar. Implementasi Telkom akan menjadi template untuk konglomerat lain.',
        author: 'Arif Wibowo',
        role: 'Co-Founder & CEO, RPI',
      },
      { type: 'h2', text: 'Tentang RPI' },
      {
        type: 'p',
        text: 'Didirikan di 2021, Rumah Pekerja Indonesia (RPI) adalah platform multi-tenant terdepan di Indonesia untuk perekrutan dan pelatihan. Platform melayani 2,4 juta+ pekerja dan 12.000+ mitra perekrut di seluruh Indonesia.',
      },
    ],
    contact: DEFAULT_CONTACT,
    downloads: [
      { label: 'Siaran Pers (PDF)', format: 'PDF · 420 KB', href: '/press-kit/telkom-partnership.pdf' },
      { label: 'Logo Telkom Group', format: 'ZIP · 8 MB', href: '/press-kit/telkom-logos.zip' },
      BOILERPLATE_DOWNLOAD,
    ],
  },
  {
    slug: 'mobile-app-launch',
    category: 'Produk',
    date: '12 Desember 2025',
    dateIso: '2025-12-12',
    dateline: 'Jakarta, 12 Desember 2025',
    title: 'RPI Meluncurkan Aplikasi Mobile untuk Pekerja Lapangan',
    subtitle:
      'Versi mobile-first untuk industri konstruksi, logistik, dan F&B. Bisa digunakan tanpa koneksi internet stabil dan tersedia di 4 bahasa daerah.',
    excerpt:
      'Versi mobile-first untuk industri konstruksi, logistik, dan F&B. Bisa digunakan tanpa koneksi internet stabil dan tersedia di 4 bahasa daerah.',
    tags: ['Mobile', 'Aplikasi', 'Pekerja Lapangan'],
    body: [
      {
        type: 'p',
        text: 'Rumah Pekerja Indonesia (RPI) hari ini meluncurkan aplikasi mobile yang dirancang khusus untuk pekerja lapangan — termasuk industri konstruksi, logistik, F&B, dan pertanian. Aplikasi dirancang offline-first dengan UX yang dapat dipakai di perangkat low-end yang umum di Indonesia.',
      },
      { type: 'h2', text: 'Fitur utama' },
      {
        type: 'list',
        items: [
          'Lamar pekerjaan tanpa koneksi internet — submit otomatis saat online',
          'Bahasa Indonesia, Inggris, Jawa, Sunda, Minang, dan Bugis',
          'UI yang berfungsi di koneksi 3G dengan latency 2G',
          'Ukuran aplikasi 8 MB — cocok untuk perangkat dengan storage terbatas',
          'Notifikasi SMS fallback untuk perangkat tanpa data internet',
        ],
      },
      {
        type: 'quote',
        text: 'Aplikasi platform global tidak dirancang untuk realitas konektivitas Indonesia. Kami membangun ulang dari nol dengan asumsi 3G dan perangkat low-end sebagai default — bukan exception.',
        author: 'Gilang Ramadhan',
        role: 'Mobile Engineering Lead, RPI',
      },
      { type: 'h2', text: 'Cakupan rilis' },
      {
        type: 'p',
        text: 'Aplikasi tersedia di Google Play Store dan App Store mulai hari ini. Target pengguna adalah pekerja di industri non-tech yang sebelumnya kesulitan menggunakan platform job board berbasis desktop.',
      },
      {
        type: 'stat',
        items: [
          { value: '8 MB', label: 'Ukuran aplikasi' },
          { value: '6', label: 'Bahasa didukung' },
          { value: 'Offline', label: 'First architecture' },
          { value: 'iOS + Android', label: 'Tersedia di kedua store' },
        ],
      },
      { type: 'h2', text: 'Tentang RPI' },
      {
        type: 'p',
        text: 'Didirikan di 2021, Rumah Pekerja Indonesia (RPI) adalah platform multi-tenant terdepan di Indonesia untuk perekrutan dan pelatihan. Platform melayani 2,4 juta+ pekerja dan 12.000+ mitra perekrut di seluruh Indonesia.',
      },
    ],
    contact: DEFAULT_CONTACT,
    downloads: [
      { label: 'Siaran Pers (PDF)', format: 'PDF · 360 KB', href: '/press-kit/mobile-app-launch.pdf' },
      { label: 'Screenshot Aplikasi', format: 'ZIP · 32 MB', href: '/press-kit/mobile-screenshots.zip' },
      { label: 'App Store Badge Pack', format: 'ZIP · 4 MB', href: '/press-kit/app-store-badges.zip' },
      BOILERPLATE_DOWNLOAD,
    ],
  },
]

export type PressFilters = {
  /** Category. Use 'Semua' or undefined for no filter. */
  category?: PressCategory | 'Semua'
  /** Free-text query against title, excerpt, dateline, tags. */
  q?: string
}

export function filterReleases(filters: PressFilters = {}): PressRelease[] {
  const q = filters.q?.trim().toLowerCase()
  const cat =
    filters.category && filters.category !== 'Semua' ? filters.category : undefined
  return PRESS_RELEASES.filter((r) => {
    if (cat && r.category !== cat) return false
    if (q) {
      const haystack =
        `${r.title} ${r.excerpt} ${r.dateline} ${r.tags.join(' ')}`.toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })
}

export function findRelease(slug: string): PressRelease | undefined {
  return PRESS_RELEASES.find((r) => r.slug === slug)
}

export function relatedReleases(slug: string, n = 3): PressRelease[] {
  const current = findRelease(slug)
  if (!current) return PRESS_RELEASES.slice(0, n)
  return PRESS_RELEASES
    .filter((r) => r.slug !== slug)
    .sort((a, b) => {
      const aScore = a.category === current.category ? 2 : 0
      const bScore = b.category === current.category ? 2 : 0
      return bScore - aScore
    })
    .slice(0, n)
}

export const PRESS_CATEGORIES: (PressCategory | 'Semua')[] = [
  'Semua',
  'Pendanaan',
  'Produk',
  'Kemitraan',
  'Riset',
  'Penghargaan',
]
