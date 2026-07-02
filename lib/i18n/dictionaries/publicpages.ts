// Public pages namespace — pricing, tentang, contact, jobs listing, etc.
// Owned by Agent 4 (public zone).
//
// Mounted at `dictionary[locale].public.*` (see lib/i18n/dictionary.ts).
// All keys are mirrored across `id` and `en`.

export const publicpages = {
  id: {
    // ---------------------------------------------------------------------
    // Shared navigation / layout strings used across the public marketing
    // surface — pulled in by navbar-public, footer-public, etc.
    // ---------------------------------------------------------------------
    nav: {
      home: 'Beranda',
      menu: 'Menu',
      openMenu: 'Buka menu',
      closeMenu: 'Tutup menu',
      search: 'Pencarian',
    },
    footer: {
      newsletterEyebrow: 'Newsletter',
      newsletterTitle: '5 lowongan premium setiap Senin.',
      newsletterSubtitle:
        'Kurasi editor SSN dikirim langsung ke email-mu. Tanpa spam.',
      newsletterFormLabel: 'Form berlangganan newsletter',
      emailLabel: 'Alamat email',
      emailPlaceholder: 'nama@email.com',
      subscribe: 'Berlangganan',
      forWorkers: 'Untuk Pekerja',
      forCompanies: 'Untuk Perusahaan',
      aboutCompany: 'Tentang SSN',
      tagline:
        'Infrastruktur karier untuk Indonesia — pekerja, perusahaan, dan instansi nasional.',
      workerLinks: {
        findJob: 'Cari Kerja',
        coursesTraining: 'Kursus & Pelatihan',
        buildCV: 'Bangun CV',
        community: 'Komunitas',
      },
      companyLinks: {
        postJob: 'Posting Lowongan',
        talentSearch: 'Cari Talenta',
        pricing: 'Harga',
        enterprise: 'Solusi Enterprise',
      },
      aboutLinks: {
        about: 'Tentang Kami',
        careers: 'Karier di SSN',
        partners: 'Mitra',
        contact: 'Kontak',
      },
      legalLinks: {
        privacy: 'Privasi',
        terms: 'Ketentuan',
        cookie: 'Kebijakan Cookie',
        status: 'Status',
      },
      allRightsReserved: 'Hak cipta dilindungi undang-undang.',
    },

    // ---------------------------------------------------------------------
    // Cookie consent banner + privacy center
    // ---------------------------------------------------------------------
    cookieConsent: {
      dialogLabel: 'Pengaturan cookie',
      heading: 'Cookie & Privasi',
      body: 'Kami menggunakan cookie untuk meningkatkan pengalaman Anda. Lihat',
      privacyPolicyLink: 'Kebijakan Privasi',
      orVia: 'atau atur lewat',
      privacyCenterLink: 'Pusat Privasi',
      rejectAll: 'Tolak semua',
      acceptAll: 'Terima semua',
      managePreferences: 'Atur preferensi',
      saving: 'Menyimpan…',
      savePreferences: 'Simpan preferensi',
      example: 'Contoh:',
      required: 'Wajib',
      active: 'Aktif',
      inactive: 'Nonaktif',
      enableCategory: 'Aktifkan kategori',
    },

    // ---------------------------------------------------------------------
    // Pricing
    // ---------------------------------------------------------------------
    pricing: {
      metaTitle: 'Harga & Paket',
      metaDescription:
        'Pilih paket SSN Pekerja yang sesuai skala perekrutan Anda — mulai dari gratis hingga enterprise dengan SSO, SLA, dan dedicated success manager.',
      hero: {
        eyebrow: 'Harga',
        title: 'Harga sederhana, tumbuh bersama tim Anda',
        body: 'Mulai gratis untuk memvalidasi alur perekrutan, lalu naik ke paket berbayar saat tim membutuhkan otomasi, SSO, atau dukungan prioritas.',
        ctaPrimary: 'Coba gratis sekarang',
        ctaSecondary: 'Bicara dengan tim',
      },
      billingToggle: {
        monthly: 'Bulanan',
        yearly: 'Tahunan',
        savingsLabel: 'Hemat 2 bulan',
      },
      plans: {
        starter: {
          name: 'Starter',
          tagline: 'Untuk tim kecil yang baru mulai merekrut.',
          price: 'Gratis',
          period: '/selamanya',
          ctaLabel: 'Mulai gratis',
          features: [
            'Hingga 3 lowongan aktif',
            'Pipeline kandidat dasar',
            'Profil perusahaan publik',
            'Dukungan komunitas',
          ],
        },
        growth: {
          name: 'Growth',
          tagline: 'Untuk tim HR yang menyeleksi puluhan kandidat per minggu.',
          price: 'Rp 1.490.000',
          period: '/bulan',
          ctaLabel: 'Pilih paket Growth',
          features: [
            'Lowongan aktif tak terbatas',
            'Kanban & tim recruiter kolaboratif',
            'Bank pertanyaan + skor otomatis',
            'Email + WhatsApp blast ke kandidat',
            'Laporan funnel & SLA respons',
          ],
        },
        scale: {
          name: 'Scale',
          tagline: 'Untuk perusahaan multi-cabang & multi-divisi.',
          price: 'Rp 3.990.000',
          period: '/bulan',
          ctaLabel: 'Pilih paket Scale',
          features: [
            'Semua fitur Growth',
            'Multi-departemen + role granular',
            'Pipeline custom + automation rules',
            'Integrasi ATS + webhook',
            'Dedicated CSM',
          ],
        },
        enterprise: {
          name: 'Enterprise',
          tagline: 'Untuk korporasi & instansi pemerintah dengan kebutuhan khusus.',
          price: 'Custom',
          period: '',
          ctaLabel: 'Hubungi sales',
          features: [
            'SSO (SAML/OIDC) + audit log',
            'SLA 99,9% + uptime kontraktual',
            'Hosting di-region & data residency',
            'Procurement + kontrak korporat',
            'Dedicated success manager',
          ],
        },
      },
      popularBadge: 'Paling populer',
      compare: {
        title: 'Perbandingan fitur',
        subtitle: 'Lihat fitur lengkap per paket.',
      },
      addons: {
        title: 'Add-on',
        subtitle: 'Tambah kapasitas atau modul khusus tanpa naik paket.',
      },
      faq: {
        title: 'Pertanyaan umum tentang harga',
        items: [
          {
            q: 'Apakah ada uji coba gratis?',
            a: 'Paket Starter gratis selamanya. Paket berbayar dapat diuji selama 14 hari penuh tanpa kartu kredit.',
          },
          {
            q: 'Apa metode pembayaran yang didukung?',
            a: 'Transfer bank, virtual account, kartu kredit (Visa/Mastercard), serta procurement (PO) untuk Enterprise.',
          },
          {
            q: 'Bisakah saya pindah paket kapan saja?',
            a: 'Ya. Upgrade berlaku langsung; downgrade berlaku di periode tagihan berikutnya.',
          },
          {
            q: 'Apakah harga sudah termasuk pajak?',
            a: 'Harga belum termasuk PPN 11%. Invoice akan menampilkan rincian pajak.',
          },
        ],
      },
    },

    // ---------------------------------------------------------------------
    // About / Tentang
    // ---------------------------------------------------------------------
    about: {
      metaTitle: 'Tentang Kami',
      metaDescription:
        'SSN Pekerja adalah platform SaaS multi-tenant yang menghubungkan pekerja, mitra perekrut, dan pelatihan keterampilan di seluruh Indonesia.',
      hero: {
        eyebrow: 'Tentang SSN',
        title: 'Karier Indonesia, dibangun bersama.',
        body: 'SSN Pekerja adalah platform multi-tenant yang menghubungkan jutaan pencari kerja, ribuan perusahaan, dan ratusan instansi pelatihan dalam satu rumah digital.',
      },
      mission: {
        eyebrow: 'Misi',
        title: 'Membuka akses pekerjaan layak untuk setiap orang Indonesia',
        body: 'Kami percaya bahwa kerja yang baik harus dapat dijangkau — bukan hanya bagi lulusan kampus elit di kota besar, tetapi setiap warga negara, di mana pun berada.',
      },
      values: {
        eyebrow: 'Nilai Kami',
        title: 'Empat prinsip yang menuntun setiap keputusan',
        items: [
          {
            title: 'Akses tanpa batas',
            body: 'Platform yang ringan, hemat data, dan dapat dipakai di Android entry-level di pelosok desa.',
          },
          {
            title: 'Transparansi gaji',
            body: 'Setiap lowongan menampilkan rentang gaji; kandidat tahu apa yang ditawarkan sebelum melamar.',
          },
          {
            title: 'Komunitas dulu',
            body: 'Kami mendukung pelatihan vokasi, BLK, dan komunitas lokal — bukan hanya kelas online berbayar.',
          },
          {
            title: 'Privasi by default',
            body: 'Profil hanya dibagikan ke perusahaan yang Anda izinkan. Tidak ada penjualan data.',
          },
        ],
      },
      journey: {
        eyebrow: 'Perjalanan',
        title: 'Dari ide hingga 240.000+ pekerja',
      },
      impact: {
        eyebrow: 'Dampak',
        title: 'Angka per Mei 2026',
        labels: {
          jobs: 'lowongan aktif',
          users: 'pekerja terdaftar',
          tenants: 'mitra perusahaan',
          courses: 'kursus terverifikasi',
        },
      },
      team: {
        eyebrow: 'Tim',
        title: 'Dipimpin oleh mantan praktisi HR & teknologi',
      },
    },

    // ---------------------------------------------------------------------
    // Contact
    // ---------------------------------------------------------------------
    contact: {
      metaTitle: 'Hubungi Kami',
      metaDescription:
        'Tim SSN Pekerja siap membantu pencari kerja, mitra perekrut, dan media. Hubungi kami lewat email, telepon, WhatsApp, atau kunjungi kantor di Jakarta.',
      hero: {
        eyebrow: 'Kontak',
        title: 'Senang sekali Anda menghubungi kami',
        body: 'Tim SSN menjawab setiap pesan dalam 1×24 jam kerja. Pilih kanal favorit Anda atau isi formulir di bawah.',
      },
      channels: {
        eyebrow: 'Kanal Kontak',
        emailLabel: 'Email',
        phoneLabel: 'Telepon',
        whatsappLabel: 'WhatsApp',
        officeLabel: 'Kantor',
        officeAddress: 'Menara Sentral, Lantai 18, Jl. Jenderal Sudirman Kav. 52-53, Jakarta Selatan 12190',
      },
      form: {
        eyebrow: 'Kirim Pesan',
        title: 'Punya pertanyaan? Tulis di sini',
        nameLabel: 'Nama lengkap',
        emailLabel: 'Alamat email',
        companyLabel: 'Perusahaan (opsional)',
        topicLabel: 'Topik',
        topicPlaceholder: 'Pilih topik',
        topics: {
          sales: 'Pertanyaan sales',
          support: 'Dukungan teknis',
          partnership: 'Kemitraan',
          press: 'Pers / media',
          careers: 'Karier di SSN',
          other: 'Lainnya',
        },
        messageLabel: 'Pesan',
        messagePlaceholder: 'Ceritakan apa yang bisa kami bantu…',
        submitting: 'Mengirim…',
        submit: 'Kirim pesan',
        success: 'Pesan terkirim. Tim kami akan membalas dalam 1×24 jam.',
        failure: 'Gagal mengirim pesan. Coba lagi atau hubungi support@pekerja.sainskerta.net.',
      },
      audience: {
        seekers: { title: 'Pencari kerja', cta: 'Bantuan pencari kerja' },
        employers: { title: 'Perusahaan & HR', cta: 'Hubungi tim sales' },
        partners: { title: 'Mitra pelatihan', cta: 'Diskusi kerja sama' },
        press: { title: 'Pers & media', cta: 'Kit pers' },
      },
      faqEyebrow: 'Pertanyaan Umum',
      faqTitle: 'Mungkin sudah ada jawabannya',
      faqSubtitle: 'Cek pertanyaan yang paling sering kami terima sebelum mengirim pesan.',
    },

    // ---------------------------------------------------------------------
    // Careers (SSN internal jobs)
    // ---------------------------------------------------------------------
    careers: {
      metaTitle: 'Karier di SSN',
      metaDescription:
        'Bergabung dengan tim SSN Pekerja. Bangun produk yang mempertemukan jutaan pencari kerja dengan perusahaan terverifikasi di seluruh Indonesia.',
      hero: {
        eyebrow: 'Karier di SSN',
        title: 'Bangun masa depan kerja Indonesia bersama kami',
        body: 'Kami sedang mencari engineer, desainer, recruiter, dan operator yang ingin produknya menyentuh jutaan pekerja.',
        ctaPrimary: 'Lihat lowongan',
        ctaSecondary: 'Pelajari tim kami',
      },
      sortLabels: {
        newest: 'Terbaru',
        'salary-high': 'Gaji ↓',
        'salary-low': 'Gaji ↑',
        alpha: 'A–Z',
      },
      filters: {
        team: 'Tim',
        type: 'Jenis kontrak',
        level: 'Tingkat',
        location: 'Lokasi',
        sort: 'Urutkan',
        clearAll: 'Bersihkan semua filter',
      },
      openings: {
        title: 'Lowongan terbuka',
        empty: 'Belum ada lowongan terbuka untuk filter ini.',
        applyButton: 'Lamar posisi',
      },
      process: {
        title: 'Proses rekrutmen kami',
      },
      life: {
        title: 'Kehidupan di SSN',
      },
      detail: {
        backToList: 'Kembali ke semua lowongan',
        responsibilities: 'Tanggung jawab',
        requirements: 'Kualifikasi',
        niceToHave: 'Nilai tambah',
        benefits: 'Benefit',
        applyNow: 'Lamar sekarang',
        shareJob: 'Bagikan',
      },
      team: {
        backToCareers: 'Kembali ke karier',
        openings: 'Lowongan tim',
      },
      location: {
        backToCareers: 'Kembali ke karier',
        openings: 'Lowongan di lokasi ini',
      },
    },

    // ---------------------------------------------------------------------
    // Jobs (public listing + detail)
    // ---------------------------------------------------------------------
    jobs: {
      metaTitle: 'Cari Lowongan Pekerjaan',
      metaDescription:
        'Telusuri ribuan lowongan kerja terverifikasi di seluruh Indonesia. Saring berdasarkan kategori, lokasi, jenis pekerjaan, dan rentang gaji.',
      title: 'Lowongan Pekerjaan',
      counter: {
        jobs: 'lowongan tersedia',
        page: 'halaman',
        of: 'dari',
        forQuery: 'untuk',
      },
      searchPlaceholder: 'Cari judul, deskripsi, atau perusahaan…',
      searchAria: 'Cari lowongan',
      searchCta: 'Cari',
      clear: 'Bersihkan',
      clearAll: 'Bersihkan semua',
      clearFilters: 'Bersihkan filter',
      filtersLabel: 'Filter',
      filters: {
        category: 'Kategori',
        employmentType: 'Jenis Pekerjaan',
        location: 'Lokasi',
        experienceLevel: 'Tingkat Pengalaman',
        salaryRange: 'Rentang Gaji (IDR/bulan)',
        customSalary: 'Atau kustom (IDR)',
        minPlaceholder: 'Min',
        maxPlaceholder: 'Max',
        minAria: 'Gaji minimum',
        maxAria: 'Gaji maksimum',
        apply: 'Terapkan',
        noCategories: 'Belum ada kategori.',
      },
      employmentLabels: {
        FULL_TIME: 'Penuh Waktu',
        PART_TIME: 'Paruh Waktu',
        CONTRACT: 'Kontrak',
        INTERNSHIP: 'Magang',
        FREELANCE: 'Lepas',
      },
      locationLabels: {
        ONSITE: 'Di Tempat',
        HYBRID: 'Hibrida',
        REMOTE: 'Jarak Jauh',
      },
      levelLabels: {
        ENTRY: 'Pemula',
        JUNIOR: 'Junior',
        MID: 'Menengah',
        SENIOR: 'Senior',
        LEAD: 'Lead',
        EXECUTIVE: 'Eksekutif',
      },
      sortLabel: 'Urutkan',
      sortOptions: {
        relevance: 'Relevansi',
        newest: 'Terbaru',
        'salary-high': 'Gaji ↓',
        'salary-low': 'Gaji ↑',
        'least-applicants': 'Sedikit pelamar',
      },
      empty: {
        title: 'Tidak ada lowongan',
        withFilter: 'Belum ada lowongan yang cocok dengan filter saat ini.',
        none: 'Belum ada lowongan terdaftar.',
      },
      listAria: 'Daftar lowongan',
      pagination: {
        previous: 'Sebelumnya',
        next: 'Berikutnya',
        previousAria: 'Halaman sebelumnya',
        nextAria: 'Halaman berikutnya',
        pageAria: 'Halaman',
        pageOf: 'Halaman {page} dari {total}',
      },
    },

    // ---------------------------------------------------------------------
    // Job detail
    // ---------------------------------------------------------------------
    jobDetail: {
      notFoundTitle: 'Lowongan Tidak Ditemukan',
      backToList: 'Kembali ke semua lowongan',
      perMonth: '/bulan',
      postedPrefix: 'Diposting',
      applicantsLabel: 'pelamar',
      viewsLabel: 'dilihat',
      sections: {
        aboutCompany: 'Tentang',
        description: 'Deskripsi pekerjaan',
        responsibilities: 'Tanggung jawab',
        requirements: 'Kualifikasi',
        niceToHave: 'Nilai tambah (tidak wajib)',
        benefits: 'Tunjangan & benefit',
        skills: 'Skill & keyword',
        howToApply: 'Cara melamar',
      },
      howToApply: {
        body: 'Klik tombol <strong>Lamar Sekarang</strong> dan unggah CV terbaru Anda. Aplikasi membutuhkan ~5 menit. Tim rekrutmen akan menghubungi Anda kembali dalam 5-7 hari kerja jika profil Anda cocok.',
        note: 'Lowongan ini dipublikasikan di SSN Pekerja. Pastikan profil Anda lengkap untuk meningkatkan peluang dilirik.',
      },
      sidebar: {
        applyTitle: 'Lamar lowongan ini',
        applyNote: 'Aplikasi membutuhkan ~5 menit. Profil lengkap akan dilirik lebih cepat.',
        applyButton: 'Lamar Sekarang',
        saveButton: 'Simpan Lowongan',
        viewMyApplication: 'Lihat lamaran saya',
        alreadyApplied: 'Anda sudah melamar (status:',
        company: 'Perusahaan',
        industry: 'Industri',
        location: 'Lokasi',
        type: 'Tipe',
        level: 'Level',
        salaryPerMonth: 'Gaji /bulan',
        shareJob: 'Bagikan',
        shareOptions: {
          linkedin: 'LinkedIn',
          twitter: 'Twitter',
          whatsapp: 'WhatsApp',
          copyLink: 'Salin link',
        },
        activity: 'Aktivitas',
        competitionLow: 'Kompetisi rendah — lamar segera',
        competitionMid: 'Kompetisi sedang',
        competitionHigh: 'Kompetisi tinggi — pastikan CV menonjol',
      },
      applicationStatus: {
        APPLIED: 'Dilamar',
        REVIEWED: 'Ditinjau',
        SHORTLISTED: 'Shortlist',
        INTERVIEW: 'Wawancara',
        OFFERED: 'Penawaran',
        REJECTED: 'Ditolak',
        WITHDRAWN: 'Ditarik',
        HIRED: 'Diterima',
      },
      cta: {
        title: 'Tertarik dengan posisi ini?',
        body: 'Klik lamar dan biarkan tim rekrutmen melihat profil Anda. Tidak perlu cover letter formal — profil SSN Anda sudah cukup.',
        applyNow: 'Lamar Sekarang',
        viewMyApplication: 'Lihat lamaran saya',
        viewOtherJobs: 'Lihat lowongan lain',
      },
      related: {
        eyebrow: 'Lowongan Terkait',
        title: 'Mungkin juga cocok untuk Anda',
        viewAll: 'Lihat semua',
      },
    },

    // ---------------------------------------------------------------------
    // Courses
    // ---------------------------------------------------------------------
    courses: {
      metaTitle: 'Kursus & Pelatihan',
      metaDescription:
        'Tingkatkan keterampilan dengan kursus terstruktur, sertifikat, dan jalur karier yang dirancang untuk pekerja Indonesia.',
      title: 'Kursus & Pelatihan',
      counter: {
        courses: 'kursus tersedia',
      },
      searchPlaceholder: 'Cari kursus, topik, atau instruktur…',
      searchAria: 'Cari kursus',
      searchCta: 'Cari',
      clear: 'Bersihkan',
      levelLabels: {
        beginner: 'Pemula',
        intermediate: 'Menengah',
        advanced: 'Lanjutan',
      },
      sortLabels: {
        relevance: 'Relevansi',
        newest: 'Terbaru',
        popular: 'Terpopuler',
        alpha: 'A–Z',
      },
      filters: {
        level: 'Tingkat',
        duration: 'Durasi',
        tenant: 'Penyelenggara',
        instructor: 'Instruktur',
      },
      empty: {
        title: 'Tidak ada kursus',
        withFilter: 'Belum ada kursus yang cocok dengan filter saat ini.',
        none: 'Belum ada kursus terdaftar.',
        clear: 'Bersihkan filter',
      },
      detail: {
        enroll: 'Daftar kursus',
        free: 'Gratis',
        durationHours: 'jam',
        lessons: 'pelajaran',
        instructor: 'Instruktur',
        relatedTitle: 'Kursus terkait',
      },
      topic: {
        backToCourses: 'Kembali ke semua kursus',
      },
    },

    // ---------------------------------------------------------------------
    // Blog
    // ---------------------------------------------------------------------
    home: {
      latestArticlesEyebrow: 'Artikel terbaru',
      latestArticlesTitle: 'Cerita dan panduan dari tim SSN',
      viewAllArticles: 'Lihat semua artikel',
    },
    blog: {
      metaTitle: 'Blog & Insight',
      metaDescription:
        'Cerita, riset, dan panduan praktis dari dunia kerja Indonesia — untuk pencari kerja, perekrut, dan pemimpin SDM.',
      eyebrow: 'Blog & Insight',
      heroTitle: 'Wawasan praktis untuk pekerja, perekrut, dan pemimpin SDM',
      heroBody:
        'Tulisan dari tim SSN dan kontributor — riset pasar kerja, panduan karier, dan pelajaran dari ribuan pencari kerja Indonesia.',
      searchPlaceholder: 'Cari artikel',
      searchCta: 'Cari',
      rss: 'Berlangganan RSS',
      articlesCount: 'artikel',
      matchingFilter: 'sesuai filter saat ini',
      empty: {
        title: 'Belum ada artikel',
        withFilter:
          'Tidak ada artikel yang cocok dengan filter ini. Coba kata kunci lain atau hapus filter.',
        none: 'Tulisan-tulisan baru akan muncul di sini segera. Pantau terus halaman ini.',
        clearAll: 'Hapus semua filter',
      },
      pagination: {
        previous: 'Sebelumnya',
        next: 'Selanjutnya',
        pageOf: 'Halaman {page} dari {total}',
      },
      detail: {
        readTime: 'menit baca',
        publishedOn: 'Dipublikasikan',
        author: 'Penulis',
        shareTitle: 'Bagikan artikel',
        related: 'Artikel terkait',
      },
      tag: {
        backToBlog: 'Kembali ke blog',
        empty: 'Belum ada artikel dengan tag ini.',
      },
      author: {
        backToBlog: 'Kembali ke blog',
        articlesBy: 'Artikel oleh',
      },
      archive: {
        title: 'Arsip',
        empty: 'Belum ada artikel di tahun ini.',
      },
      topic: {
        backToBlog: 'Kembali ke blog',
      },
    },

    // ---------------------------------------------------------------------
    // Press
    // ---------------------------------------------------------------------
    press: {
      metaTitle: 'Press & Media',
      metaDescription:
        'Siaran pers, peliputan media, dan press kit SSN Pekerja. Materi resmi untuk jurnalis, peneliti, dan mitra media.',
      title: 'Press & Media',
      sortLabels: {
        newest: 'Terbaru',
        oldest: 'Terlama',
        alpha: 'A–Z',
      },
      filters: {
        all: 'Semua',
        category: 'Kategori',
        tag: 'Tag',
      },
      sections: {
        releases: 'Siaran pers',
        coverage: 'Peliputan media',
        kit: 'Press kit',
        awards: 'Penghargaan',
        leadership: 'Kepemimpinan',
        contact: 'Kontak pers',
      },
      kit: {
        title: 'Unduh press kit',
        body: 'Logo, foto kantor, screenshot produk, dan factsheet resmi SSN.',
        downloadButton: 'Unduh press kit (ZIP)',
      },
      detail: {
        backToList: 'Kembali ke press',
        download: 'Unduh siaran pers (PDF)',
      },
      archive: {
        title: 'Arsip press',
      },
    },

    // ---------------------------------------------------------------------
    // Mitra / Partners
    // ---------------------------------------------------------------------
    mitra: {
      metaTitle: 'Mitra Perekrut',
      metaDescription:
        'Bergabung dengan ratusan mitra perekrut terverifikasi yang memanfaatkan platform SSN Pekerja.',
      title: 'Mitra Perekrut',
      counter: {
        partners: 'mitra terverifikasi',
      },
      searchPlaceholder: 'Cari mitra, industri, atau lokasi…',
      searchCta: 'Cari',
      filters: {
        industry: 'Industri',
        plan: 'Paket',
      },
      sortLabels: {
        newest: 'Terbaru',
        alpha: 'A–Z',
        'jobs-high': 'Lowongan ↓',
        'jobs-low': 'Lowongan ↑',
      },
      planLabels: {
        FREE: 'Gratis',
        STARTER: 'Starter',
        PRO: 'Pro',
        ENTERPRISE: 'Enterprise',
      },
      empty: {
        title: 'Tidak ada mitra',
        withFilter: 'Belum ada mitra yang cocok dengan filter saat ini.',
        none: 'Belum ada mitra terdaftar.',
      },
      detail: {
        backToList: 'Kembali ke daftar mitra',
        openJobs: 'Lowongan aktif',
        about: 'Tentang perusahaan',
        industry: 'Industri',
        size: 'Ukuran',
        location: 'Lokasi',
        website: 'Situs',
        viewAllJobs: 'Lihat semua lowongan',
      },
    },

    // ---------------------------------------------------------------------
    // Partner layout shared chrome
    // ---------------------------------------------------------------------
    partnerLayout: {
      activeTenant: 'Tenant aktif',
      activeJobs: 'Lowongan aktif',
      candidates: 'Kandidat',
      postJob: 'Pasang lowongan',
    },

    // ---------------------------------------------------------------------
    // Profile (public)
    // ---------------------------------------------------------------------
    profile: {
      backToHome: 'Kembali ke beranda',
      about: 'Tentang',
      experience: 'Pengalaman',
      education: 'Pendidikan',
      skills: 'Keahlian',
      languages: 'Bahasa',
      portfolio: 'Portfolio',
      certificates: 'Sertifikat',
      contactCta: 'Hubungi',
      shareProfile: 'Bagikan profil',
    },

    // ---------------------------------------------------------------------
    // Certificate
    // ---------------------------------------------------------------------
    certificate: {
      metaTitle: 'Sertifikat',
      title: 'Sertifikat Kelulusan',
      verified: 'Terverifikasi',
      issuedOn: 'Diterbitkan',
      verifyAt: 'Verifikasi di',
      issuedTo: 'Diberikan kepada',
      forCompleting: 'atas penyelesaian',
      downloadPdf: 'Unduh sertifikat (PDF)',
      shareLinkedIn: 'Tambahkan ke LinkedIn',
      notFound: 'Sertifikat tidak ditemukan',
    },

    // ---------------------------------------------------------------------
    // Saved search unsubscribe
    // ---------------------------------------------------------------------
    savedSearchUnsubscribe: {
      title: 'Berhenti berlangganan pencarian tersimpan',
      body: 'Anda akan berhenti menerima notifikasi email untuk pencarian tersimpan ini.',
      confirm: 'Ya, berhenti berlangganan',
      cancel: 'Batal',
      success: 'Anda telah berhenti berlangganan.',
      successBody: 'Anda tidak akan lagi menerima email untuk pencarian ini. Anda tetap dapat mengelola pencarian tersimpan lain di dashboard.',
      backToHome: 'Kembali ke beranda',
      invalidToken: 'Tautan tidak valid atau sudah kedaluwarsa.',
    },

    // ---------------------------------------------------------------------
    // Feed info (jobs feed XML documentation page)
    // ---------------------------------------------------------------------
    feedInfo: {
      metaTitle: 'Feed XML lowongan — Sindikasi',
      metaDescription:
        'Feed XML publik SSN untuk LinkedIn Jobs, Indeed, dan generic Atom — siap dikonsumsi mitra ATS dan agregator lowongan.',
      backToJobs: 'Kembali ke daftar lowongan',
      title: 'Feed XML lowongan',
      intro:
        'SSN menyediakan feed XML publik berisi lowongan terbaru sehingga aplikasi ATS, agregator, dan mitra distribusi seperti LinkedIn dan Indeed dapat menarik data tanpa scraping. Feed di-cache 10 menit di edge — cocok untuk dipoll setiap 15–30 menit.',
      publicFeeds: {
        title: 'Feed publik',
        body: 'Setiap URL di bawah ini mengembalikan paling banyak 500 lowongan terbaru berstatus PUBLISHED, diurutkan menurun berdasarkan tanggal publikasi.',
      },
      formats: {
        atom: {
          label: 'Generic Atom 1.0',
          description:
            'Format RSS / Atom standar (RFC 4287). Bisa dibaca aplikasi feed reader, agregator umum, atau pipeline scraping ringan.',
        },
        linkedin: {
          label: 'LinkedIn Jobs XML',
          description:
            'Format khusus LinkedIn Talent Hub (XML feed). Cocok untuk integrasi Limited Listings / mitra LinkedIn yang menarik lowongan secara terjadwal.',
        },
        indeed: {
          label: 'Indeed XML',
          description:
            'Format XML standar Indeed (lihat docs.indeed.com). Mendukung field salary, jobtype, dan referencenumber per lowongan.',
        },
      },
      tenantFeed: {
        title: 'Feed per tenant',
        body: 'Mitra ATS yang hanya menarik lowongan dari satu tenant tertentu dapat menambahkan parameter',
        bodyTail: 'ke URL feed. Contoh:',
        replaceHint: 'Ganti tenant-anda dengan slug tenant Anda.',
        notFound: 'Bila tenant tidak ditemukan atau belum memiliki lowongan PUBLISHED, server akan merespons 404 dengan body XML yang menjelaskan alasannya.',
      },
      forAts: {
        title: 'Untuk mitra ATS',
        body: 'Berikut contoh perintah curl untuk masing-masing format. Semua response menggunakan',
        bodyMid: 'dan header',
      },
      refreshSchedule: {
        title: 'Jadwal refresh',
        items: [
          'Feed dibangun ulang on-demand dan di-cache <strong>10 menit</strong> di edge.',
          'Selama jendela <strong>30 menit stale-while-revalidate</strong>, CDN menyajikan versi cache lama sementara me-refresh di latar belakang.',
          'Rekomendasi polling untuk mitra ATS: setiap <strong>15–30 menit</strong>. Polling lebih sering tidak menghasilkan data lebih baru dan hanya menambah biaya bandwidth.',
          'Maksimum <strong>500 lowongan</strong> per feed, diurutkan menurun menurut <code>publishedAt</code>.',
        ],
      },
      help: {
        title: 'Butuh bantuan integrasi?',
        body: 'Hubungi tim partnership kami untuk diskusi format khusus, frekuensi push, atau perjanjian distribusi formal.',
      },
    },

    // ---------------------------------------------------------------------
    // Status page
    // ---------------------------------------------------------------------
    status: {
      metaTitle: 'Status sistem — SSN',
      metaDescription:
        'Status real-time layanan SSN Pekerja, insiden aktif, dan jadwal pemeliharaan.',
      eyebrow: 'Status sistem',
      title: 'Status layanan SSN Pekerja',
      updatedEvery: 'Diperbarui setiap 30 detik',
      overallStatus: {
        operational: 'Semua sistem normal',
        degraded: 'Sebagian terdegradasi',
        major_outage: 'Gangguan mayor',
        maintenance: 'Sedang pemeliharaan',
      },
      maintenanceStatus: {
        planned: 'Direncanakan',
        in_progress: 'Sedang berjalan',
        completed: 'Selesai',
        cancelled: 'Dibatalkan',
      },
      sections: {
        ongoingMaintenanceLabel: 'Pemeliharaan berjalan',
        ongoingMaintenanceTitle: 'Pemeliharaan sedang berjalan',
        completesAt: 'selesai pada',
        components: 'Komponen sistem',
        activeIncidents: 'Insiden aktif',
        noActiveIncidents: 'Tidak ada insiden aktif. Semua layanan berjalan normal.',
        upcomingMaintenance: 'Pemeliharaan mendatang',
        noUpcomingMaintenance: 'Belum ada pemeliharaan terjadwal.',
        affectedServices: 'Layanan terdampak:',
        history: 'Riwayat 30 hari',
        noHistory: 'Tidak ada insiden yang tercatat dalam 30 hari terakhir.',
        viewResolved: 'Lihat {count} insiden terselesaikan',
      },
      subscribe: 'Subscribe via JSON feed',
      subscribeNote: 'Untuk integrasi pemantauan eksternal.',
      incidentDetail: {
        backToStatus: 'Kembali ke status',
        startedAt: 'Mulai',
        resolvedAt: 'Selesai',
        affected: 'Komponen terdampak',
        updates: 'Pembaruan',
        notFound: 'Insiden tidak ditemukan.',
      },
      maintenanceDetail: {
        backToStatus: 'Kembali ke status',
        scheduledStart: 'Mulai dijadwalkan',
        scheduledEnd: 'Selesai dijadwalkan',
        affected: 'Komponen terdampak',
        updates: 'Pembaruan',
        notFound: 'Pemeliharaan tidak ditemukan.',
      },
    },

    // ---------------------------------------------------------------------
    // Privacy center
    // ---------------------------------------------------------------------
    privacyCenter: {
      metaTitle: 'Pusat Privasi',
      metaDescription: 'Atur preferensi cookie, lihat riwayat persetujuan, dan kelola data Anda.',
      eyebrow: 'Cookie & Privasi',
      title: 'Pusat Privasi',
      intro: 'Atur preferensi cookie Anda dan kelola data pribadi sesuai',
      privacyPolicyLink: 'Kebijakan Privasi',
      settings: {
        title: 'Pengaturan Privasi',
        body: 'Aktifkan atau nonaktifkan kategori cookie. Kategori "Diperlukan" tidak dapat dimatikan karena dibutuhkan untuk login dan keamanan.',
      },
      history: {
        title: 'Riwayat persetujuan',
        inAccount: 'di akun ini',
        inSession: 'untuk sesi ini',
        body: 'Catatan perubahan persetujuan cookie Anda',
        empty: 'Belum ada catatan persetujuan.',
        version: 'versi',
      },
      categories: {
        necessary: 'Diperlukan',
        analytics: 'Analitik',
        marketing: 'Pemasaran',
        functional: 'Fungsional',
        on: 'On',
        off: 'Off',
      },
      dataRequests: {
        title: 'Permintaan data',
        body: 'Hak akses dan penghapusan data sesuai UU Pelindungan Data Pribadi.',
        downloadMyData: 'Unduh data saya',
        deleteMyAccount: 'Hapus akun saya',
        guestPrefix: 'Untuk meminta ekspor atau penghapusan data,',
        signIn: 'masuk',
        guestMid: 'ke akun Anda atau',
        contactSupport: 'hubungi support',
      },
      footer: {
        prefix: 'Lihat',
        suffix: 'untuk detail bagaimana data Anda diproses.',
      },
      saved: 'Preferensi tersimpan.',
      saveFailed: 'Gagal menyimpan. Coba lagi.',
      saveError: 'Gagal menyimpan.',
      example: 'Contoh:',
      required: 'Wajib',
      active: 'Aktif',
      inactive: 'Nonaktif',
      enableCategory: 'Aktifkan kategori',
      acceptAll: 'Terima semua',
      rejectAll: 'Tolak semua',
      savePreferences: 'Simpan preferensi',
      saving: 'Menyimpan…',
    },

    // ---------------------------------------------------------------------
    // Privacy policy / Terms / Cookie policy (section headers only)
    // ---------------------------------------------------------------------
    privacyPolicy: {
      title: 'Kebijakan Privasi',
      sections: {
        overview: 'Ringkasan',
        dataCollected: 'Data yang kami kumpulkan',
        howWeUse: 'Bagaimana kami menggunakan data',
        sharing: 'Berbagi data',
        retention: 'Penyimpanan',
        rights: 'Hak Anda',
        security: 'Keamanan',
        contact: 'Kontak',
        updates: 'Pembaruan kebijakan',
      },
    },
    terms: {
      title: 'Ketentuan Layanan',
      sections: {
        acceptance: 'Penerimaan ketentuan',
        eligibility: 'Kelayakan',
        accounts: 'Akun pengguna',
        contentRules: 'Aturan konten',
        prohibited: 'Hal yang dilarang',
        payment: 'Pembayaran',
        termination: 'Penghentian',
        disclaimers: 'Penafian',
        liability: 'Pembatasan tanggung jawab',
        law: 'Hukum yang berlaku',
        contact: 'Kontak',
      },
    },
    cookiePolicy: {
      title: 'Kebijakan Cookie',
      sections: {
        whatAreCookies: 'Apa itu cookie',
        howWeUse: 'Bagaimana kami menggunakan cookie',
        categories: 'Kategori cookie',
        thirdParty: 'Cookie pihak ketiga',
        howToControl: 'Cara mengontrol cookie',
        updates: 'Pembaruan kebijakan',
      },
    },
  },

  // =====================================================================
  // English mirror
  // =====================================================================
  en: {
    nav: {
      home: 'Home',
      menu: 'Menu',
      openMenu: 'Open menu',
      closeMenu: 'Close menu',
      search: 'Search',
    },
    footer: {
      newsletterEyebrow: 'Newsletter',
      newsletterTitle: '5 premium jobs every Monday.',
      newsletterSubtitle:
        'Curated picks from the SSN editors, straight to your inbox. No spam.',
      newsletterFormLabel: 'Newsletter signup form',
      emailLabel: 'Email address',
      emailPlaceholder: 'name@email.com',
      subscribe: 'Subscribe',
      forWorkers: 'For Workers',
      forCompanies: 'For Companies',
      aboutCompany: 'About SSN',
      tagline:
        'Career infrastructure for Indonesia — for workers, companies, and national institutions.',
      workerLinks: {
        findJob: 'Find a Job',
        coursesTraining: 'Courses & Training',
        buildCV: 'Build a CV',
        community: 'Community',
      },
      companyLinks: {
        postJob: 'Post a Job',
        talentSearch: 'Search Talent',
        pricing: 'Pricing',
        enterprise: 'Enterprise',
      },
      aboutLinks: {
        about: 'About Us',
        careers: 'Careers at SSN',
        partners: 'Partners',
        contact: 'Contact',
      },
      legalLinks: {
        privacy: 'Privacy',
        terms: 'Terms',
        cookie: 'Cookie Policy',
        status: 'Status',
      },
      allRightsReserved: 'All rights reserved.',
    },

    cookieConsent: {
      dialogLabel: 'Cookie settings',
      heading: 'Cookies & Privacy',
      body: 'We use cookies to improve your experience. See our',
      privacyPolicyLink: 'Privacy Policy',
      orVia: 'or manage them in the',
      privacyCenterLink: 'Privacy Center',
      rejectAll: 'Reject all',
      acceptAll: 'Accept all',
      managePreferences: 'Manage preferences',
      saving: 'Saving…',
      savePreferences: 'Save preferences',
      example: 'Example:',
      required: 'Required',
      active: 'On',
      inactive: 'Off',
      enableCategory: 'Enable category',
    },

    pricing: {
      metaTitle: 'Pricing & Plans',
      metaDescription:
        'Pick the SSN Pekerja plan that matches your hiring scale — from free to enterprise with SSO, SLA, and a dedicated success manager.',
      hero: {
        eyebrow: 'Pricing',
        title: 'Simple pricing that grows with your team',
        body: 'Start free to validate your hiring funnel, then move to a paid plan when your team needs automation, SSO, or priority support.',
        ctaPrimary: 'Start free',
        ctaSecondary: 'Talk to sales',
      },
      billingToggle: {
        monthly: 'Monthly',
        yearly: 'Yearly',
        savingsLabel: 'Save 2 months',
      },
      plans: {
        starter: {
          name: 'Starter',
          tagline: 'For small teams just starting to hire.',
          price: 'Free',
          period: 'forever',
          ctaLabel: 'Start free',
          features: [
            'Up to 3 active jobs',
            'Basic candidate pipeline',
            'Public company profile',
            'Community support',
          ],
        },
        growth: {
          name: 'Growth',
          tagline: 'For HR teams screening dozens of candidates a week.',
          price: 'Rp 1,490,000',
          period: '/month',
          ctaLabel: 'Choose Growth',
          features: [
            'Unlimited active jobs',
            'Kanban + collaborative recruiter team',
            'Question bank + automatic scoring',
            'Email + WhatsApp blast to candidates',
            'Funnel reports & response SLA',
          ],
        },
        scale: {
          name: 'Scale',
          tagline: 'For multi-branch, multi-division companies.',
          price: 'Rp 3,990,000',
          period: '/month',
          ctaLabel: 'Choose Scale',
          features: [
            'Everything in Growth',
            'Multi-department + granular roles',
            'Custom pipeline + automation rules',
            'ATS + webhook integrations',
            'Dedicated CSM',
          ],
        },
        enterprise: {
          name: 'Enterprise',
          tagline: 'For corporates and government agencies with special needs.',
          price: 'Custom',
          period: '',
          ctaLabel: 'Contact sales',
          features: [
            'SSO (SAML/OIDC) + audit log',
            '99.9% SLA + contractual uptime',
            'In-region hosting & data residency',
            'Procurement + corporate contracts',
            'Dedicated success manager',
          ],
        },
      },
      popularBadge: 'Most popular',
      compare: {
        title: 'Feature comparison',
        subtitle: 'See the full feature list per plan.',
      },
      addons: {
        title: 'Add-ons',
        subtitle: 'Add capacity or specialised modules without changing plan.',
      },
      faq: {
        title: 'Pricing FAQ',
        items: [
          {
            q: 'Is there a free trial?',
            a: 'The Starter plan is free forever. Paid plans come with a 14-day full-feature trial — no credit card required.',
          },
          {
            q: 'Which payment methods do you accept?',
            a: 'Bank transfer, virtual accounts, credit cards (Visa/Mastercard), and procurement (PO) for Enterprise.',
          },
          {
            q: 'Can I switch plans at any time?',
            a: 'Yes. Upgrades take effect immediately; downgrades take effect on your next billing cycle.',
          },
          {
            q: 'Are prices inclusive of tax?',
            a: 'Prices exclude the 11% VAT. Invoices show a detailed tax breakdown.',
          },
        ],
      },
    },

    about: {
      metaTitle: 'About Us',
      metaDescription:
        'SSN Pekerja is a multi-tenant SaaS platform connecting workers, recruiting partners, and skills training across Indonesia.',
      hero: {
        eyebrow: 'About SSN',
        title: "Indonesia's careers, built together.",
        body: "SSN Pekerja is a multi-tenant platform connecting millions of job seekers, thousands of companies, and hundreds of training institutions under one digital roof.",
      },
      mission: {
        eyebrow: 'Mission',
        title: 'Open access to decent work for every Indonesian',
        body: "We believe good work should be reachable — not just for graduates of elite campuses in big cities, but for every citizen, wherever they live.",
      },
      values: {
        eyebrow: 'Our Values',
        title: 'Four principles that guide every decision',
        items: [
          {
            title: 'Access without barriers',
            body: 'A light, data-frugal product that runs on entry-level Android phones across rural Indonesia.',
          },
          {
            title: 'Salary transparency',
            body: 'Every listing shows a salary range; candidates know the offer before applying.',
          },
          {
            title: 'Community first',
            body: 'We support vocational schools, BLKs, and local communities — not just paid online courses.',
          },
          {
            title: 'Privacy by default',
            body: 'Profiles are only shared with companies you authorise. No data selling.',
          },
        ],
      },
      journey: {
        eyebrow: 'Journey',
        title: 'From an idea to 240,000+ workers',
      },
      impact: {
        eyebrow: 'Impact',
        title: 'Numbers as of May 2026',
        labels: {
          jobs: 'active jobs',
          users: 'registered workers',
          tenants: 'partner companies',
          courses: 'verified courses',
        },
      },
      team: {
        eyebrow: 'Team',
        title: 'Led by former HR and tech operators',
      },
    },

    contact: {
      metaTitle: 'Contact Us',
      metaDescription:
        'The SSN Pekerja team is ready to help job seekers, recruiting partners, and the press. Reach out by email, phone, WhatsApp, or visit our Jakarta office.',
      hero: {
        eyebrow: 'Contact',
        title: 'Great to hear from you',
        body: 'The SSN team replies to every message within one business day. Pick your favourite channel or fill in the form below.',
      },
      channels: {
        eyebrow: 'Contact Channels',
        emailLabel: 'Email',
        phoneLabel: 'Phone',
        whatsappLabel: 'WhatsApp',
        officeLabel: 'Office',
        officeAddress: 'Menara Sentral, Floor 18, Jl. Jenderal Sudirman Kav. 52-53, South Jakarta 12190',
      },
      form: {
        eyebrow: 'Send a Message',
        title: 'Got a question? Write to us',
        nameLabel: 'Full name',
        emailLabel: 'Email address',
        companyLabel: 'Company (optional)',
        topicLabel: 'Topic',
        topicPlaceholder: 'Choose a topic',
        topics: {
          sales: 'Sales enquiry',
          support: 'Technical support',
          partnership: 'Partnership',
          press: 'Press / media',
          careers: 'Careers at SSN',
          other: 'Other',
        },
        messageLabel: 'Message',
        messagePlaceholder: 'Tell us how we can help…',
        submitting: 'Sending…',
        submit: 'Send message',
        success: 'Message sent. Our team will reply within one business day.',
        failure: 'Failed to send. Try again or email support@pekerja.sainskerta.net.',
      },
      audience: {
        seekers: { title: 'Job seekers', cta: 'Job seeker help' },
        employers: { title: 'Companies & HR', cta: 'Contact sales' },
        partners: { title: 'Training partners', cta: 'Discuss a partnership' },
        press: { title: 'Press & media', cta: 'Press kit' },
      },
      faqEyebrow: 'FAQ',
      faqTitle: 'You might find your answer here',
      faqSubtitle: 'Check the questions we hear most often before sending a message.',
    },

    careers: {
      metaTitle: 'Careers at SSN',
      metaDescription:
        'Join the SSN Pekerja team. Build a product that connects millions of job seekers to verified companies across Indonesia.',
      hero: {
        eyebrow: 'Careers at SSN',
        title: "Help build the future of work in Indonesia",
        body: 'We are looking for engineers, designers, recruiters, and operators who want their work to reach millions of workers.',
        ctaPrimary: 'See open roles',
        ctaSecondary: 'Meet the team',
      },
      sortLabels: {
        newest: 'Newest',
        'salary-high': 'Salary ↓',
        'salary-low': 'Salary ↑',
        alpha: 'A–Z',
      },
      filters: {
        team: 'Team',
        type: 'Contract type',
        level: 'Level',
        location: 'Location',
        sort: 'Sort by',
        clearAll: 'Clear all filters',
      },
      openings: {
        title: 'Open roles',
        empty: 'No open roles match this filter yet.',
        applyButton: 'Apply for this role',
      },
      process: {
        title: 'Our hiring process',
      },
      life: {
        title: 'Life at SSN',
      },
      detail: {
        backToList: 'Back to all roles',
        responsibilities: 'Responsibilities',
        requirements: 'Requirements',
        niceToHave: 'Nice to have',
        benefits: 'Benefits',
        applyNow: 'Apply now',
        shareJob: 'Share',
      },
      team: {
        backToCareers: 'Back to careers',
        openings: 'Roles in this team',
      },
      location: {
        backToCareers: 'Back to careers',
        openings: 'Roles in this location',
      },
    },

    jobs: {
      metaTitle: 'Find Jobs',
      metaDescription:
        'Browse thousands of verified job openings across Indonesia. Filter by category, location, employment type, and salary range.',
      title: 'Job Openings',
      counter: {
        jobs: 'jobs available',
        page: 'page',
        of: 'of',
        forQuery: 'for',
      },
      searchPlaceholder: 'Search title, description, or company…',
      searchAria: 'Search jobs',
      searchCta: 'Search',
      clear: 'Clear',
      clearAll: 'Clear all',
      clearFilters: 'Clear filters',
      filtersLabel: 'Filters',
      filters: {
        category: 'Category',
        employmentType: 'Employment Type',
        location: 'Location',
        experienceLevel: 'Experience Level',
        salaryRange: 'Salary Range (IDR/month)',
        customSalary: 'Or custom (IDR)',
        minPlaceholder: 'Min',
        maxPlaceholder: 'Max',
        minAria: 'Minimum salary',
        maxAria: 'Maximum salary',
        apply: 'Apply',
        noCategories: 'No categories yet.',
      },
      employmentLabels: {
        FULL_TIME: 'Full-time',
        PART_TIME: 'Part-time',
        CONTRACT: 'Contract',
        INTERNSHIP: 'Internship',
        FREELANCE: 'Freelance',
      },
      locationLabels: {
        ONSITE: 'Onsite',
        HYBRID: 'Hybrid',
        REMOTE: 'Remote',
      },
      levelLabels: {
        ENTRY: 'Entry',
        JUNIOR: 'Junior',
        MID: 'Mid',
        SENIOR: 'Senior',
        LEAD: 'Lead',
        EXECUTIVE: 'Executive',
      },
      sortLabel: 'Sort by',
      sortOptions: {
        relevance: 'Relevance',
        newest: 'Newest',
        'salary-high': 'Salary ↓',
        'salary-low': 'Salary ↑',
        'least-applicants': 'Fewest applicants',
      },
      empty: {
        title: 'No jobs found',
        withFilter: 'No jobs match the current filter.',
        none: 'No jobs listed yet.',
      },
      listAria: 'Job list',
      pagination: {
        previous: 'Previous',
        next: 'Next',
        previousAria: 'Previous page',
        nextAria: 'Next page',
        pageAria: 'Page',
        pageOf: 'Page {page} of {total}',
      },
    },

    jobDetail: {
      notFoundTitle: 'Job Not Found',
      backToList: 'Back to all jobs',
      perMonth: '/month',
      postedPrefix: 'Posted',
      applicantsLabel: 'applicants',
      viewsLabel: 'views',
      sections: {
        aboutCompany: 'About',
        description: 'Job description',
        responsibilities: 'Responsibilities',
        requirements: 'Requirements',
        niceToHave: 'Nice to have (optional)',
        benefits: 'Perks & benefits',
        skills: 'Skills & keywords',
        howToApply: 'How to apply',
      },
      howToApply: {
        body: 'Click <strong>Apply Now</strong> and upload your latest CV. The application takes about 5 minutes. The recruiting team will get back to you within 5–7 business days if your profile is a fit.',
        note: 'This job is published on SSN Pekerja. Make sure your profile is complete to increase your chances of being noticed.',
      },
      sidebar: {
        applyTitle: 'Apply for this job',
        applyNote: 'The application takes about 5 minutes. Complete profiles get noticed sooner.',
        applyButton: 'Apply Now',
        saveButton: 'Save Job',
        viewMyApplication: 'View my application',
        alreadyApplied: 'You already applied (status:',
        company: 'Company',
        industry: 'Industry',
        location: 'Location',
        type: 'Type',
        level: 'Level',
        salaryPerMonth: 'Salary /month',
        shareJob: 'Share',
        shareOptions: {
          linkedin: 'LinkedIn',
          twitter: 'Twitter',
          whatsapp: 'WhatsApp',
          copyLink: 'Copy link',
        },
        activity: 'Activity',
        competitionLow: 'Low competition — apply soon',
        competitionMid: 'Average competition',
        competitionHigh: 'High competition — make your CV stand out',
      },
      applicationStatus: {
        APPLIED: 'Applied',
        REVIEWED: 'Reviewed',
        SHORTLISTED: 'Shortlisted',
        INTERVIEW: 'Interview',
        OFFERED: 'Offered',
        REJECTED: 'Rejected',
        WITHDRAWN: 'Withdrawn',
        HIRED: 'Hired',
      },
      cta: {
        title: 'Interested in this role?',
        body: 'Hit apply and let the hiring team see your profile. No formal cover letter needed — your SSN profile is enough.',
        applyNow: 'Apply Now',
        viewMyApplication: 'View my application',
        viewOtherJobs: 'See other jobs',
      },
      related: {
        eyebrow: 'Related Jobs',
        title: 'These might fit you too',
        viewAll: 'View all',
      },
    },

    courses: {
      metaTitle: 'Courses & Training',
      metaDescription:
        'Level up with structured courses, certificates, and career paths designed for Indonesian workers.',
      title: 'Courses & Training',
      counter: {
        courses: 'courses available',
      },
      searchPlaceholder: 'Search course, topic, or instructor…',
      searchAria: 'Search courses',
      searchCta: 'Search',
      clear: 'Clear',
      levelLabels: {
        beginner: 'Beginner',
        intermediate: 'Intermediate',
        advanced: 'Advanced',
      },
      sortLabels: {
        relevance: 'Relevance',
        newest: 'Newest',
        popular: 'Most popular',
        alpha: 'A–Z',
      },
      filters: {
        level: 'Level',
        duration: 'Duration',
        tenant: 'Provider',
        instructor: 'Instructor',
      },
      empty: {
        title: 'No courses found',
        withFilter: 'No courses match the current filter.',
        none: 'No courses listed yet.',
        clear: 'Clear filters',
      },
      detail: {
        enroll: 'Enroll',
        free: 'Free',
        durationHours: 'hours',
        lessons: 'lessons',
        instructor: 'Instructor',
        relatedTitle: 'Related courses',
      },
      topic: {
        backToCourses: 'Back to all courses',
      },
    },

    home: {
      latestArticlesEyebrow: 'Latest articles',
      latestArticlesTitle: 'Stories and guides from the SSN team',
      viewAllArticles: 'See all articles',
    },
    blog: {
      metaTitle: 'Blog & Insights',
      metaDescription:
        'Stories, research, and practical guides from the Indonesian world of work — for job seekers, recruiters, and HR leaders.',
      eyebrow: 'Blog & Insights',
      heroTitle: 'Practical insights for workers, recruiters, and HR leaders',
      heroBody:
        'Writing from the SSN team and contributors — labour market research, career guides, and lessons from thousands of Indonesian job seekers.',
      searchPlaceholder: 'Search articles',
      searchCta: 'Search',
      rss: 'Subscribe via RSS',
      articlesCount: 'articles',
      matchingFilter: 'matching the current filter',
      empty: {
        title: 'No articles yet',
        withFilter:
          'No articles match this filter. Try another keyword or clear the filter.',
        none: 'New writing will appear here soon. Keep an eye on this page.',
        clearAll: 'Clear all filters',
      },
      pagination: {
        previous: 'Previous',
        next: 'Next',
        pageOf: 'Page {page} of {total}',
      },
      detail: {
        readTime: 'min read',
        publishedOn: 'Published',
        author: 'Author',
        shareTitle: 'Share article',
        related: 'Related articles',
      },
      tag: {
        backToBlog: 'Back to blog',
        empty: 'No articles with this tag yet.',
      },
      author: {
        backToBlog: 'Back to blog',
        articlesBy: 'Articles by',
      },
      archive: {
        title: 'Archive',
        empty: 'No articles for this year yet.',
      },
      topic: {
        backToBlog: 'Back to blog',
      },
    },

    press: {
      metaTitle: 'Press & Media',
      metaDescription:
        'Press releases, media coverage, and the official SSN Pekerja press kit — for journalists, researchers, and media partners.',
      title: 'Press & Media',
      sortLabels: {
        newest: 'Newest',
        oldest: 'Oldest',
        alpha: 'A–Z',
      },
      filters: {
        all: 'All',
        category: 'Category',
        tag: 'Tag',
      },
      sections: {
        releases: 'Press releases',
        coverage: 'Media coverage',
        kit: 'Press kit',
        awards: 'Awards',
        leadership: 'Leadership',
        contact: 'Press contact',
      },
      kit: {
        title: 'Download our press kit',
        body: 'Logos, office photos, product screenshots, and the official SSN factsheet.',
        downloadButton: 'Download press kit (ZIP)',
      },
      detail: {
        backToList: 'Back to press',
        download: 'Download press release (PDF)',
      },
      archive: {
        title: 'Press archive',
      },
    },

    mitra: {
      metaTitle: 'Recruiting Partners',
      metaDescription:
        'Join hundreds of verified recruiting partners that use the SSN Pekerja platform.',
      title: 'Recruiting Partners',
      counter: {
        partners: 'verified partners',
      },
      searchPlaceholder: 'Search partner, industry, or location…',
      searchCta: 'Search',
      filters: {
        industry: 'Industry',
        plan: 'Plan',
      },
      sortLabels: {
        newest: 'Newest',
        alpha: 'A–Z',
        'jobs-high': 'Jobs ↓',
        'jobs-low': 'Jobs ↑',
      },
      planLabels: {
        FREE: 'Free',
        STARTER: 'Starter',
        PRO: 'Pro',
        ENTERPRISE: 'Enterprise',
      },
      empty: {
        title: 'No partners found',
        withFilter: 'No partners match the current filter.',
        none: 'No partners listed yet.',
      },
      detail: {
        backToList: 'Back to partners',
        openJobs: 'Active jobs',
        about: 'About the company',
        industry: 'Industry',
        size: 'Size',
        location: 'Location',
        website: 'Website',
        viewAllJobs: 'See all jobs',
      },
    },

    partnerLayout: {
      activeTenant: 'Active tenant',
      activeJobs: 'Active jobs',
      candidates: 'Candidates',
      postJob: 'Post a job',
    },

    profile: {
      backToHome: 'Back to home',
      about: 'About',
      experience: 'Experience',
      education: 'Education',
      skills: 'Skills',
      languages: 'Languages',
      portfolio: 'Portfolio',
      certificates: 'Certificates',
      contactCta: 'Contact',
      shareProfile: 'Share profile',
    },

    certificate: {
      metaTitle: 'Certificate',
      title: 'Certificate of Completion',
      verified: 'Verified',
      issuedOn: 'Issued',
      verifyAt: 'Verify at',
      issuedTo: 'Issued to',
      forCompleting: 'for completing',
      downloadPdf: 'Download certificate (PDF)',
      shareLinkedIn: 'Add to LinkedIn',
      notFound: 'Certificate not found',
    },

    savedSearchUnsubscribe: {
      title: 'Unsubscribe from saved search',
      body: 'You will stop receiving email alerts for this saved search.',
      confirm: 'Yes, unsubscribe',
      cancel: 'Cancel',
      success: "You've unsubscribed.",
      successBody: "You will no longer receive emails for this search. You can still manage other saved searches from your dashboard.",
      backToHome: 'Back to home',
      invalidToken: 'This link is invalid or has expired.',
    },

    feedInfo: {
      metaTitle: 'Job XML feed — Syndication',
      metaDescription:
        "SSN's public XML feed for LinkedIn Jobs, Indeed, and generic Atom — ready to consume for ATS partners and job aggregators.",
      backToJobs: 'Back to job list',
      title: 'Job XML feed',
      intro:
        'SSN offers a public XML feed of the latest jobs so ATS applications, aggregators, and distribution partners like LinkedIn and Indeed can pull data without scraping. The feed is cached for 10 minutes at the edge — ideal for a 15–30 minute polling interval.',
      publicFeeds: {
        title: 'Public feeds',
        body: 'Each URL below returns up to 500 of the most recent PUBLISHED jobs, ordered by publish date descending.',
      },
      formats: {
        atom: {
          label: 'Generic Atom 1.0',
          description:
            'Standard RSS / Atom format (RFC 4287). Readable by feed readers, generic aggregators, or lightweight scraping pipelines.',
        },
        linkedin: {
          label: 'LinkedIn Jobs XML',
          description:
            "LinkedIn Talent Hub's XML feed format. Suitable for Limited Listings integrations and LinkedIn partners that pull jobs on a schedule.",
        },
        indeed: {
          label: 'Indeed XML',
          description:
            "Indeed's standard XML format (see docs.indeed.com). Supports salary, jobtype, and referencenumber fields per job.",
        },
      },
      tenantFeed: {
        title: 'Per-tenant feed',
        body: 'ATS partners pulling jobs from a single tenant can add the',
        bodyTail: 'parameter to the feed URL. Example:',
        replaceHint: 'Replace your-tenant with your tenant slug.',
        notFound: "If the tenant is not found or has no PUBLISHED jobs, the server responds with a 404 and an XML body explaining why.",
      },
      forAts: {
        title: 'For ATS partners',
        body: 'Sample curl commands for each format. All responses use',
        bodyMid: 'and headers',
      },
      refreshSchedule: {
        title: 'Refresh schedule',
        items: [
          'Feeds are rebuilt on demand and cached for <strong>10 minutes</strong> at the edge.',
          'During a <strong>30-minute stale-while-revalidate</strong> window, the CDN serves the cached version while refreshing in the background.',
          'Recommended polling for ATS partners: every <strong>15–30 minutes</strong>. Polling more often will not return newer data, only added bandwidth cost.',
          'Maximum <strong>500 jobs</strong> per feed, ordered by <code>publishedAt</code> descending.',
        ],
      },
      help: {
        title: 'Need help with integration?',
        body: 'Reach out to our partnerships team to discuss custom formats, push frequency, or a formal distribution agreement.',
      },
    },

    status: {
      metaTitle: 'System status — SSN',
      metaDescription:
        'Real-time status of SSN Pekerja services, active incidents, and scheduled maintenance.',
      eyebrow: 'System status',
      title: 'SSN Pekerja service status',
      updatedEvery: 'Updated every 30 seconds',
      overallStatus: {
        operational: 'All systems operational',
        degraded: 'Partial degradation',
        major_outage: 'Major outage',
        maintenance: 'Under maintenance',
      },
      maintenanceStatus: {
        planned: 'Planned',
        in_progress: 'In progress',
        completed: 'Completed',
        cancelled: 'Cancelled',
      },
      sections: {
        ongoingMaintenanceLabel: 'Ongoing maintenance',
        ongoingMaintenanceTitle: 'Maintenance in progress',
        completesAt: 'completes at',
        components: 'System components',
        activeIncidents: 'Active incidents',
        noActiveIncidents: 'No active incidents. All systems are running normally.',
        upcomingMaintenance: 'Upcoming maintenance',
        noUpcomingMaintenance: 'No maintenance scheduled.',
        affectedServices: 'Affected services:',
        history: '30-day history',
        noHistory: 'No incidents recorded in the last 30 days.',
        viewResolved: 'See {count} resolved incidents',
      },
      subscribe: 'Subscribe via JSON feed',
      subscribeNote: 'For external monitoring integrations.',
      incidentDetail: {
        backToStatus: 'Back to status',
        startedAt: 'Started',
        resolvedAt: 'Resolved',
        affected: 'Affected components',
        updates: 'Updates',
        notFound: 'Incident not found.',
      },
      maintenanceDetail: {
        backToStatus: 'Back to status',
        scheduledStart: 'Scheduled start',
        scheduledEnd: 'Scheduled end',
        affected: 'Affected components',
        updates: 'Updates',
        notFound: 'Maintenance not found.',
      },
    },

    privacyCenter: {
      metaTitle: 'Privacy Center',
      metaDescription: 'Manage your cookie preferences, view your consent history, and control your data.',
      eyebrow: 'Cookies & Privacy',
      title: 'Privacy Center',
      intro: 'Manage your cookie preferences and personal data per our',
      privacyPolicyLink: 'Privacy Policy',
      settings: {
        title: 'Privacy Settings',
        body: 'Enable or disable cookie categories. The "Required" category cannot be turned off because it is needed for login and security.',
      },
      history: {
        title: 'Consent history',
        inAccount: 'on this account',
        inSession: 'for this session',
        body: 'Record of changes to your cookie consent',
        empty: 'No consent records yet.',
        version: 'version',
      },
      categories: {
        necessary: 'Required',
        analytics: 'Analytics',
        marketing: 'Marketing',
        functional: 'Functional',
        on: 'On',
        off: 'Off',
      },
      dataRequests: {
        title: 'Data requests',
        body: 'Data access and deletion rights under the Personal Data Protection Law.',
        downloadMyData: 'Download my data',
        deleteMyAccount: 'Delete my account',
        guestPrefix: 'To request data export or deletion,',
        signIn: 'sign in',
        guestMid: 'to your account or',
        contactSupport: 'contact support',
      },
      footer: {
        prefix: 'See our',
        suffix: 'for details on how your data is processed.',
      },
      saved: 'Preferences saved.',
      saveFailed: 'Failed to save. Please try again.',
      saveError: 'Failed to save.',
      example: 'Example:',
      required: 'Required',
      active: 'On',
      inactive: 'Off',
      enableCategory: 'Enable category',
      acceptAll: 'Accept all',
      rejectAll: 'Reject all',
      savePreferences: 'Save preferences',
      saving: 'Saving…',
    },

    privacyPolicy: {
      title: 'Privacy Policy',
      sections: {
        overview: 'Overview',
        dataCollected: 'Data we collect',
        howWeUse: 'How we use data',
        sharing: 'Data sharing',
        retention: 'Retention',
        rights: 'Your rights',
        security: 'Security',
        contact: 'Contact',
        updates: 'Policy updates',
      },
    },
    terms: {
      title: 'Terms of Service',
      sections: {
        acceptance: 'Acceptance of terms',
        eligibility: 'Eligibility',
        accounts: 'User accounts',
        contentRules: 'Content rules',
        prohibited: 'Prohibited use',
        payment: 'Payment',
        termination: 'Termination',
        disclaimers: 'Disclaimers',
        liability: 'Limitation of liability',
        law: 'Governing law',
        contact: 'Contact',
      },
    },
    cookiePolicy: {
      title: 'Cookie Policy',
      sections: {
        whatAreCookies: 'What cookies are',
        howWeUse: 'How we use cookies',
        categories: 'Cookie categories',
        thirdParty: 'Third-party cookies',
        howToControl: 'How to control cookies',
        updates: 'Policy updates',
      },
    },
  },
} as const
