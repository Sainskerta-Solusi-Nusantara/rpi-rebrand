// formsEnterprise namespace — enterprise-sections.tsx marketing components.
// Mounted at dictionary[locale].formsEnterprise.* (see lib/i18n/dictionary.ts).

export const formsEnterprise = {
  id: {
    // -----------------------------------------------------------------------
    // EnterpriseHero
    // -----------------------------------------------------------------------
    hero: {
      eyebrow: 'Solusi Enterprise',
      headlinePart1: 'Perekrutan',
      headlineHighlight: 'berskala enterprise',
      headlinePart2: 'untuk Indonesia.',
      body: 'Platform multi-tenant yang menyatukan grup usaha, BUMN, dan perusahaan terregulasi — dengan SSO, SLA 99.9%, residensi data lokal, dan tim sukses yang khusus untuk Anda.',
      ctaPrimary: 'Bicara dengan Tim Sales',
      ctaSecondary: 'Unduh Brosur (PDF)',
      stats: [
        { v: '99.9%', l: 'SLA uptime' },
        { v: '500K+', l: 'Pelamar/bulan' },
        { v: '< 4 jam', l: 'Respons dukungan' },
        { v: 'ISO 27001', l: 'Tersertifikasi' },
      ],
    },

    // -----------------------------------------------------------------------
    // EnterpriseTrust
    // -----------------------------------------------------------------------
    trust: {
      heading: 'Dipercaya oleh perusahaan terdepan Indonesia',
    },

    // -----------------------------------------------------------------------
    // EnterpriseCapabilities
    // -----------------------------------------------------------------------
    capabilities: {
      eyebrow: 'Empat Pilar',
      heading: 'Dibangun untuk skala enterprise',
      body: 'Bukan paket “Pro plus” — arsitektur, kontrak, dan tim yang berbeda dari produk SaaS biasa.',
      pillars: [
        {
          title: 'Keamanan tingkat bank',
          desc: 'Enkripsi end-to-end, kontrol akses berlapis, audit log lengkap, dan kepatuhan terhadap UU PDP serta standar internasional.',
          points: [
            'SSO via SAML 2.0 / OIDC',
            'SCIM auto-provisioning',
            'IP allow-list & device trust',
            'Audit log immutable 7 tahun',
          ],
        },
        {
          title: 'Multi-tenant untuk grup usaha',
          desc: 'Satu kontrak induk, banyak anak perusahaan. Setiap entitas punya branding, kebijakan, dan tim sendiri — tetap dalam satu dashboard induk.',
          points: [
            'Hierarki tenant tak terbatas',
            'Branding per anak usaha',
            'Konsolidasi laporan grup',
            'Pemisahan data tegas (RLS)',
          ],
        },
        {
          title: 'Skala & performa',
          desc: 'Diuji untuk 500.000+ pelamar/bulan dan ribuan rekruter aktif. Auto-scaling, CDN regional Indonesia, dan replikasi lintas zona.',
          points: [
            'P95 latency < 200ms nasional',
            'Auto-scale tanpa intervensi',
            'CDN Jakarta + Singapura',
            'Disaster recovery RPO < 5 menit',
          ],
        },
        {
          title: 'Dedicated partnership',
          desc: 'Tim sukses yang khusus untuk Anda — Customer Success Manager, Solutions Engineer, dan jalur eskalasi langsung ke engineering.',
          points: [
            'Dedicated CSM bernama',
            'Solutions Engineer on-call',
            'Kuartalan Business Review',
            'Direct line ke VP Engineering',
          ],
        },
      ],
    },

    // -----------------------------------------------------------------------
    // EnterpriseSecurity
    // -----------------------------------------------------------------------
    security: {
      eyebrow: 'Keamanan & Kepatuhan',
      heading: 'Sertifikasi yang Anda butuhkan',
      body: 'Diperiksa oleh auditor independen setiap tahun. Dokumen tersedia untuk tim compliance Anda di bawah NDA.',
      compliance: [
        { label: 'ISO 27001:2022', sub: 'Information Security' },
        { label: 'SOC 2 Type II', sub: 'Annual audit' },
        { label: 'UU PDP', sub: 'Pelindungan Data Pribadi' },
        { label: 'PCI DSS L1', sub: 'Payment-grade security' },
        { label: 'OWASP ASVS L3', sub: 'App security verified' },
        { label: 'BSSN-ready', sub: 'Lokalisasi data' },
      ],
      features: [
        {
          title: 'Enkripsi menyeluruh',
          desc: 'AES-256 saat data diam, TLS 1.3 saat transit, dan envelope encryption untuk PII sensitif.',
        },
        {
          title: 'Manajemen identitas',
          desc: 'SSO SAML/OIDC, SCIM, MFA wajib, session management, dan device trust.',
        },
        {
          title: 'Residensi data Indonesia',
          desc: 'Seluruh data tersimpan di data center berlokasi di Indonesia dengan replikasi cross-zone.',
        },
        {
          title: 'Audit log lengkap',
          desc: 'Setiap aksi tercatat dengan timestamp, IP, user, dan diff — diretensi 7 tahun tanpa modifikasi.',
        },
        {
          title: 'Opsi deployment',
          desc: 'Public cloud (default), single-tenant VPC, atau on-premise untuk industri terregulasi.',
        },
        {
          title: 'Incident response',
          desc: 'SLA notifikasi insiden 1 jam, post-mortem publik, dan kompensasi otomatis bila SLA terlewat.',
        },
      ],
    },

    // -----------------------------------------------------------------------
    // EnterpriseImplementation
    // -----------------------------------------------------------------------
    implementation: {
      eyebrow: 'Implementasi',
      heading: 'Dari kickoff sampai go-live dalam 90 hari',
      body: 'Metodologi yang sudah teruji di belasan grup usaha. Anda tahu apa yang terjadi tiap minggu — tanpa kejutan, tanpa scope creep.',
      phases: [
        {
          range: 'Minggu 1–2',
          title: 'Discovery & Architecture',
          bullets: [
            'Workshop dengan tim HR, IT, dan compliance Anda',
            'Pemetaan proses rekrutmen saat ini',
            'Desain arsitektur tenant & integrasi',
            'Penyusunan rencana migrasi data',
          ],
        },
        {
          range: 'Minggu 3–6',
          title: 'Konfigurasi & Integrasi',
          bullets: [
            'Setup tenant induk + anak perusahaan',
            'Konfigurasi SSO, SCIM, dan policy keamanan',
            'Integrasi HRIS, payroll, ATS lama',
            'Branding & custom domain per entitas',
          ],
        },
        {
          range: 'Minggu 7–10',
          title: 'Migrasi & Pelatihan',
          bullets: [
            'Migrasi data historis (kandidat, lowongan, arsip)',
            'Pelatihan onsite untuk recruiter & admin',
            'UAT bersama tim Anda + sign-off',
            'Pelatihan train-the-trainer untuk skala internal',
          ],
        },
        {
          range: 'Minggu 11–12',
          title: 'Go-Live & Hypercare',
          bullets: [
            'Soft launch dengan tim pilot',
            'Hypercare 30 hari — engineer on standby',
            'Review KPI minggu ke-2 dan ke-4',
            'Transisi ke dukungan reguler',
          ],
        },
      ],
    },

    // -----------------------------------------------------------------------
    // EnterpriseCaseStudy
    // -----------------------------------------------------------------------
    caseStudy: {
      eyebrow: 'Studi Kasus',
      heading: 'Bagaimana grup usaha multi-industri menyatukan {count} anak perusahaan',
      body: 'Sebuah konglomerat dengan {count} entitas — dari perbankan, telekomunikasi, hingga otomotif — sebelumnya menggunakan {atsSystems} sistem ATS berbeda. Dalam 90 hari, mereka berpindah ke satu platform SSN dengan tenant terpisah per entitas, tetap mempertahankan branding dan kebijakan masing-masing.',
      quote: 'Yang membuat SSN berbeda bukan fitur — semua vendor punya fitur. Yang berbeda adalah cara mereka memahami kompleksitas grup kami dan tetap merilis dengan kualitas mingguan.',
      quoteAttribution: 'Rina Adriani',
      quoteRole: 'Group Head of Talent Acquisition, salah satu konglomerat top-10 Indonesia',
      ctaReadMore: 'Baca studi kasus lengkap',
      metrics: [
        { v: '6 → 1', l: 'Sistem ATS', sub: 'Konsolidasi penuh' },
        { v: '83%', l: 'Hemat biaya lisensi', sub: 'Tahun pertama' },
        { v: '12 hari', l: 'Waktu hire rata-rata', sub: 'Dari 31 hari' },
        { v: '4.7/5', l: 'NPS recruiter', sub: 'Survei internal' },
      ],
    },

    // -----------------------------------------------------------------------
    // EnterpriseContact
    // -----------------------------------------------------------------------
    contact: {
      eyebrow: 'Bicara dengan Sales',
      heading: 'Mari bicara tentang skala Anda',
      body: 'Tim Enterprise Sales kami akan menghubungi Anda dalam 1 hari kerja untuk demo terstruktur dan diskusi arsitektur — tanpa komitmen.',
      benefits: [
        'Demo terstruktur sesuai industri Anda',
        'Akses dokumen keamanan & arsitektur',
        'Estimasi biaya & ROI yang jujur',
        'Tanpa komitmen, tanpa hard sell',
      ],
      officeLabel: 'Kantor Enterprise Sales',
      officeCity: 'Jakarta Selatan, Indonesia',
      officeAddress: 'Menara Standard Chartered Lt. 21, Jakarta',
      officeEmail: 'enterprise@pekerja.sainskerta.net',
      officePhone: '+62 21 5000 1010',
      form: {
        fullNameLabel: 'Nama lengkap',
        jobTitleLabel: 'Jabatan',
        jobTitlePlaceholder: 'contoh: Head of Talent',
        workEmailLabel: 'Email kerja',
        workEmailPlaceholder: 'nama@perusahaan.com',
        phoneLabel: 'Telepon',
        phonePlaceholder: '+62 ...',
        companyNameLabel: 'Nama perusahaan',
        companySizeLabel: 'Ukuran perusahaan',
        companySizePlaceholder: 'Pilih ukuran',
        industryLabel: 'Industri',
        industryPlaceholder: 'Pilih industri',
        messageLabel: 'Apa yang ingin Anda capai?',
        messagePlaceholder: 'Ceritakan situasi rekrutmen Anda saat ini, sistem yang sudah dipakai, dan apa yang ingin diubah…',
        consentPrefix: 'Saya menyetujui',
        consentPrivacyLink: 'Kebijakan Privasi',
        consentSuffix: 'dan pemrosesan data untuk keperluan korespondensi sales.',
        submitLabel: 'Kirim Permintaan Demo',
      },
      companySizes: [
        '500 – 2.000 karyawan',
        '2.000 – 10.000 karyawan',
        '10.000 – 50.000 karyawan',
        '50.000+ karyawan',
      ],
      industries: [
        'Perbankan & Keuangan',
        'Telekomunikasi',
        'Energi & Sumber Daya',
        'Otomotif & Manufaktur',
        'Consumer Goods',
        'Pemerintah / BUMN',
        'Konglomerat',
        'Lainnya',
      ],
    },
  },

  // =========================================================================
  // English mirror
  // =========================================================================
  en: {
    hero: {
      eyebrow: 'Enterprise Solutions',
      headlinePart1: 'Enterprise-scale',
      headlineHighlight: 'recruitment',
      headlinePart2: 'for Indonesia.',
      body: 'A multi-tenant platform that unifies business groups, state-owned enterprises, and regulated companies — with SSO, 99.9% SLA, local data residency, and a dedicated success team.',
      ctaPrimary: 'Talk to Sales',
      ctaSecondary: 'Download Brochure (PDF)',
      stats: [
        { v: '99.9%', l: 'SLA uptime' },
        { v: '500K+', l: 'Applicants/month' },
        { v: '< 4 hrs', l: 'Support response' },
        { v: 'ISO 27001', l: 'Certified' },
      ],
    },

    trust: {
      heading: 'Trusted by Indonesia\'s leading enterprises',
    },

    capabilities: {
      eyebrow: 'Four Pillars',
      heading: 'Built for enterprise scale',
      body: 'Not a "Pro plus" bundle — a different architecture, contract, and team from standard SaaS.',
      pillars: [
        {
          title: 'Bank-grade security',
          desc: 'End-to-end encryption, layered access controls, complete audit logs, and compliance with Indonesia\'s PDP Law and international standards.',
          points: [
            'SSO via SAML 2.0 / OIDC',
            'SCIM auto-provisioning',
            'IP allow-list & device trust',
            'Immutable audit log for 7 years',
          ],
        },
        {
          title: 'Multi-tenant for business groups',
          desc: 'One master contract, many subsidiaries. Each entity has its own branding, policies, and team — all within a single parent dashboard.',
          points: [
            'Unlimited tenant hierarchy',
            'Per-subsidiary branding',
            'Consolidated group reports',
            'Strict data isolation (RLS)',
          ],
        },
        {
          title: 'Scale & performance',
          desc: 'Tested for 500,000+ applicants/month and thousands of active recruiters. Auto-scaling, Indonesia regional CDN, and cross-zone replication.',
          points: [
            'P95 latency < 200ms nationwide',
            'Auto-scale without intervention',
            'CDN Jakarta + Singapore',
            'Disaster recovery RPO < 5 min',
          ],
        },
        {
          title: 'Dedicated partnership',
          desc: 'A success team dedicated to you — a named Customer Success Manager, Solutions Engineer, and a direct escalation path to engineering.',
          points: [
            'Named dedicated CSM',
            'Solutions Engineer on-call',
            'Quarterly Business Review',
            'Direct line to VP Engineering',
          ],
        },
      ],
    },

    security: {
      eyebrow: 'Security & Compliance',
      heading: 'The certifications you need',
      body: 'Audited by independent auditors every year. Documents available for your compliance team under NDA.',
      compliance: [
        { label: 'ISO 27001:2022', sub: 'Information Security' },
        { label: 'SOC 2 Type II', sub: 'Annual audit' },
        { label: 'UU PDP', sub: 'Personal Data Protection' },
        { label: 'PCI DSS L1', sub: 'Payment-grade security' },
        { label: 'OWASP ASVS L3', sub: 'App security verified' },
        { label: 'BSSN-ready', sub: 'Data localisation' },
      ],
      features: [
        {
          title: 'End-to-end encryption',
          desc: 'AES-256 at rest, TLS 1.3 in transit, and envelope encryption for sensitive PII.',
        },
        {
          title: 'Identity management',
          desc: 'SSO SAML/OIDC, SCIM, mandatory MFA, session management, and device trust.',
        },
        {
          title: 'Indonesia data residency',
          desc: 'All data stored in data centres located in Indonesia with cross-zone replication.',
        },
        {
          title: 'Complete audit log',
          desc: 'Every action recorded with timestamp, IP, user, and diff — retained for 7 years without modification.',
        },
        {
          title: 'Deployment options',
          desc: 'Public cloud (default), single-tenant VPC, or on-premise for regulated industries.',
        },
        {
          title: 'Incident response',
          desc: '1-hour incident notification SLA, public post-mortems, and automatic compensation if SLA is missed.',
        },
      ],
    },

    implementation: {
      eyebrow: 'Implementation',
      heading: 'From kickoff to go-live in 90 days',
      body: 'A methodology proven across dozens of business groups. You know what happens every week — no surprises, no scope creep.',
      phases: [
        {
          range: 'Weeks 1–2',
          title: 'Discovery & Architecture',
          bullets: [
            'Workshop with your HR, IT, and compliance teams',
            'Mapping your current recruitment process',
            'Tenant architecture and integration design',
            'Data migration plan',
          ],
        },
        {
          range: 'Weeks 3–6',
          title: 'Configuration & Integration',
          bullets: [
            'Parent tenant + subsidiary setup',
            'SSO, SCIM, and security policy configuration',
            'HRIS, payroll, and legacy ATS integration',
            'Branding & custom domain per entity',
          ],
        },
        {
          range: 'Weeks 7–10',
          title: 'Migration & Training',
          bullets: [
            'Historical data migration (candidates, jobs, archives)',
            'On-site training for recruiters & admins',
            'UAT with your team + sign-off',
            'Train-the-trainer for internal scaling',
          ],
        },
        {
          range: 'Weeks 11–12',
          title: 'Go-Live & Hypercare',
          bullets: [
            'Soft launch with pilot team',
            'Hypercare 30 days — engineer on standby',
            'KPI review at weeks 2 and 4',
            'Transition to regular support',
          ],
        },
      ],
    },

    caseStudy: {
      eyebrow: 'Case Study',
      heading: 'How a multi-industry business group unified {count} subsidiaries',
      body: 'A conglomerate with {count} entities — spanning banking, telecoms, and automotive — previously ran {atsSystems} separate ATS systems. Within 90 days they moved to a single SSN platform with isolated tenants per entity, keeping each one\'s branding and policies intact.',
      quote: "What sets SSN apart isn't the features — every vendor has features. What's different is how they understand our group's complexity while still shipping quality updates every week.",
      quoteAttribution: 'Rina Adriani',
      quoteRole: 'Group Head of Talent Acquisition, one of Indonesia\'s top-10 conglomerates',
      ctaReadMore: 'Read the full case study',
      metrics: [
        { v: '6 → 1', l: 'ATS systems', sub: 'Full consolidation' },
        { v: '83%', l: 'Licence cost savings', sub: 'First year' },
        { v: '12 days', l: 'Average time to hire', sub: 'Down from 31 days' },
        { v: '4.7/5', l: 'Recruiter NPS', sub: 'Internal survey' },
      ],
    },

    contact: {
      eyebrow: 'Talk to Sales',
      heading: 'Tell us about your scale',
      body: 'Our Enterprise Sales team will reach out within one business day for a structured demo and architecture discussion — no commitment required.',
      benefits: [
        'Structured demo tailored to your industry',
        'Access to security & architecture docs',
        'Honest cost & ROI estimate',
        'No commitment, no hard sell',
      ],
      officeLabel: 'Enterprise Sales Office',
      officeCity: 'South Jakarta, Indonesia',
      officeAddress: 'Menara Standard Chartered Fl. 21, Jakarta',
      officeEmail: 'enterprise@pekerja.sainskerta.net',
      officePhone: '+62 21 5000 1010',
      form: {
        fullNameLabel: 'Full name',
        jobTitleLabel: 'Job title',
        jobTitlePlaceholder: 'e.g. Head of Talent',
        workEmailLabel: 'Work email',
        workEmailPlaceholder: 'name@company.com',
        phoneLabel: 'Phone',
        phonePlaceholder: '+62 ...',
        companyNameLabel: 'Company name',
        companySizeLabel: 'Company size',
        companySizePlaceholder: 'Select size',
        industryLabel: 'Industry',
        industryPlaceholder: 'Select industry',
        messageLabel: 'What are you trying to achieve?',
        messagePlaceholder: 'Tell us about your current recruitment situation, the systems you use, and what you want to change…',
        consentPrefix: 'I agree to the',
        consentPrivacyLink: 'Privacy Policy',
        consentSuffix: 'and to processing my data for sales correspondence.',
        submitLabel: 'Send Demo Request',
      },
      companySizes: [
        '500 – 2,000 employees',
        '2,000 – 10,000 employees',
        '10,000 – 50,000 employees',
        '50,000+ employees',
      ],
      industries: [
        'Banking & Finance',
        'Telecommunications',
        'Energy & Resources',
        'Automotive & Manufacturing',
        'Consumer Goods',
        'Government / SOE',
        'Conglomerate',
        'Other',
      ],
    },
  },
} as const
