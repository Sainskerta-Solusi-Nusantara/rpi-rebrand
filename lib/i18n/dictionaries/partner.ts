// Partner namespace — partner/employer dashboard (overview, jobs, talent,
// analytics, team, billing, branding). Accessed as `t.partner.*`.
//
// Interpolation follows the project convention: leaf strings carry `{n}` /
// `{members}` / `{invites}` tokens that callers substitute with
// `String(value)` via `.replace('{n}', String(value))`.

export const partner = {
  id: {
    funnel: {
      applied: 'Dilamar',
      reviewed: 'Ditinjau',
      shortlist: 'Shortlist',
      interview: 'Wawancara',
      offer: 'Penawaran',
      hired: 'Diterima',
    },
    roles: {
      OWNER: 'Pemilik',
      ADMIN: 'Admin',
      RECRUITER: 'Perekrut',
      MEMBER: 'Anggota',
    },
    plans: {
      FREE: 'Gratis',
      PRO: 'Pro',
      BUSINESS: 'Bisnis',
      ENTERPRISE: 'Enterprise',
    },
    overview: {
      metaTitle: 'Dasbor Mitra',
      title: 'Dasbor Mitra',
      subtitle: 'Ringkasan performa rekrutmen perusahaan Anda.',
      kpis: {
        activeJobs: 'Lowongan Aktif',
        totalJobs: 'Total Lowongan',
        totalApplications: 'Total Lamaran',
        hired: 'Diterima',
      },
      funnelHeading: 'Corong Rekrutmen',
      recentJobsHeading: 'Lowongan Terbaru',
      teamActivityHeading: 'Aktivitas Tim',
      teamActivity: '{n} anggota tim aktif.',
      tabs: {
        overview: 'Ringkasan',
        trend: 'Tren',
      },
      trendChartTitle: 'Lamaran per Bulan',
    },
    jobs: {
      metaTitle: 'Lowongan Saya',
      title: 'Lowongan',
      subtitle: 'Kelola seluruh lowongan yang Anda posting.',
      createButton: 'Buat Lowongan',
    },
    newJob: {
      metaTitle: 'Buat Lowongan Baru',
      title: 'Buat Lowongan Baru',
      subtitle:
        'Isi detail lowongan. Anda dapat menyimpan sebagai draf atau langsung mempublikasikan.',
    },
    talent: {
      metaTitle: 'Talent Pool',
      title: 'Talent Pool',
      subtitle: '{n} kandidat berinteraksi dengan lowongan Anda.',
    },
    analytics: {
      metaTitle: 'Analitik',
      title: 'Analitik Rekrutmen',
      subtitle: 'Performa rekrutmen 6 bulan terakhir.',
      kpis: {
        totalViews: 'Total Tampilan',
        avgViewsPerJob: 'Rata-rata Tampilan/Lowongan',
        totalApplications6mo: 'Total Lamaran (6 bln)',
        totalNewJobs: 'Total Lowongan Baru',
      },
      appliedChartTitle: 'Lamaran per Bulan',
      jobsChartTitle: 'Lowongan Baru per Bulan',
      funnelHeading: 'Corong Konversi',
    },
    team: {
      metaTitle: 'Tim Saya',
      title: 'Tim Saya',
      subtitle: '{members} anggota aktif • {invites} undangan tertunda.',
      membersHeading: 'Anggota Tim',
      noMembers: 'Belum ada anggota tim.',
      pendingHeading: 'Undangan Tertunda',
      expires: 'Kadaluarsa {date}',
    },
    billing: {
      metaTitle: 'Penagihan',
      title: 'Penagihan & Paket',
      subtitle: 'Kelola paket berlangganan dan tagihan tenant Anda.',
      currentPlanHeading: 'Paket Saat Ini',
      planLabel: 'Paket',
      activePeriod: 'Periode aktif',
      upgradeButton: 'Tingkatkan Paket',
      historyHeading: 'Riwayat Tagihan',
      historyEmpty:
        'Riwayat tagihan akan ditampilkan setelah integrasi pembayaran aktif.',
    },
    branding: {
      metaTitle: 'Branding',
      title: 'Branding Tenant',
      subtitle:
        'Sesuaikan warna, logo, dan tipografi untuk mencerminkan brand perusahaan Anda.',
    },
  },
  en: {
    funnel: {
      applied: 'Applied',
      reviewed: 'Reviewed',
      shortlist: 'Shortlist',
      interview: 'Interview',
      offer: 'Offer',
      hired: 'Hired',
    },
    roles: {
      OWNER: 'Owner',
      ADMIN: 'Admin',
      RECRUITER: 'Recruiter',
      MEMBER: 'Member',
    },
    plans: {
      FREE: 'Free',
      PRO: 'Pro',
      BUSINESS: 'Business',
      ENTERPRISE: 'Enterprise',
    },
    overview: {
      metaTitle: 'Partner Dashboard',
      title: 'Partner Dashboard',
      subtitle: "An overview of your company's recruitment performance.",
      kpis: {
        activeJobs: 'Active Jobs',
        totalJobs: 'Total Jobs',
        totalApplications: 'Total Applications',
        hired: 'Hired',
      },
      funnelHeading: 'Recruitment Funnel',
      recentJobsHeading: 'Recent Jobs',
      teamActivityHeading: 'Team Activity',
      teamActivity: '{n} active team members.',
      tabs: {
        overview: 'Overview',
        trend: 'Trend',
      },
      trendChartTitle: 'Applications per Month',
    },
    jobs: {
      metaTitle: 'My Jobs',
      title: 'Jobs',
      subtitle: 'Manage all the jobs you have posted.',
      createButton: 'Create Job',
    },
    newJob: {
      metaTitle: 'Create New Job',
      title: 'Create New Job',
      subtitle:
        'Fill in the job details. You can save it as a draft or publish it right away.',
    },
    talent: {
      metaTitle: 'Talent Pool',
      title: 'Talent Pool',
      subtitle: '{n} candidates have engaged with your jobs.',
    },
    analytics: {
      metaTitle: 'Analytics',
      title: 'Recruitment Analytics',
      subtitle: 'Recruitment performance over the last 6 months.',
      kpis: {
        totalViews: 'Total Views',
        avgViewsPerJob: 'Avg. Views/Job',
        totalApplications6mo: 'Total Applications (6 mo)',
        totalNewJobs: 'Total New Jobs',
      },
      appliedChartTitle: 'Applications per Month',
      jobsChartTitle: 'New Jobs per Month',
      funnelHeading: 'Conversion Funnel',
    },
    team: {
      metaTitle: 'My Team',
      title: 'My Team',
      subtitle: '{members} active members • {invites} pending invitations.',
      membersHeading: 'Team Members',
      noMembers: 'No team members yet.',
      pendingHeading: 'Pending Invitations',
      expires: 'Expires {date}',
    },
    billing: {
      metaTitle: 'Billing',
      title: 'Billing & Plan',
      subtitle: "Manage your tenant's subscription plan and invoices.",
      currentPlanHeading: 'Current Plan',
      planLabel: 'Plan',
      activePeriod: 'Active period',
      upgradeButton: 'Upgrade Plan',
      historyHeading: 'Billing History',
      historyEmpty:
        'Billing history will appear once the payment integration is active.',
    },
    branding: {
      metaTitle: 'Branding',
      title: 'Tenant Branding',
      subtitle:
        "Customize colors, logo, and typography to reflect your company's brand.",
    },
  },
} as const
