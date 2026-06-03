// pagesPublicMisc namespace — misc public pages: profil index, mitra listing,
// saved-search unsubscribe, and public loading skeleton.
// Accessed as `t.pagesPublicMisc.*`.
//
// Interpolation tokens like `{name}`, `{activeTenants}`, `{publishedJobs}`
// are substituted by callers via .replace('{token}', String(value)).

export const pagesPublicMisc = {
  id: {
    // ------------------------------------------------------------------ profil
    profil: {
      heading: 'Profil RPI tidak ditemukan',
      body: 'Masukkan {usernameCode} atau ID profil di URL, contoh {exampleCode}.',
      ctaBrowse: 'Jelajahi mitra',
      ctaHome: 'Kembali ke beranda',
    },
    // ------------------------------------------------------------------ mitra
    mitra: {
      heading: 'Mitra Perekrut Kami',
      statsDesc:
        '{activeTenants} perusahaan mempercayakan rekrutmen mereka kepada Rumah Pekerja Indonesia, dengan {publishedJobs} lowongan aktif.',
      searchPlaceholder: 'Cari nama mitra…',
      searchButton: 'Cari',
      clearSearch: 'Bersihkan',
      clearAll: 'Bersihkan semua',
      noDataIndustry: 'Belum ada data.',
      sortLabel: 'Urutkan',
      sortRelevance: 'Relevansi',
      sortNewest: 'Terbaru',
      sortAlpha: 'A–Z',
      sortJobsHigh: 'Lowongan ↓',
      sortJobsLow: 'Lowongan ↑',
      resultCount: '{total} mitra',
      pageInfo: 'halaman {page} dari {totalPages}',
      emptyHeading: 'Tidak ada mitra',
      emptyFiltered: 'Belum ada mitra yang cocok dengan filter saat ini.',
      emptyAll: 'Belum ada mitra terdaftar.',
      clearFilter: 'Bersihkan filter',
      jobsActive: '{count} lowongan aktif',
      prevPage: 'Sebelumnya',
      nextPage: 'Berikutnya',
      ctaHeading: 'Jadi Mitra Perekrut',
      ctaBody:
        'Pasang lowongan, kelola talent pool, dan bangun brand karier Anda di platform yang fokus pada pekerja Indonesia.',
      ctaButton: 'Daftar Sebagai Mitra',
      filterIndustryTitle: 'Industri',
      filterPlanTitle: 'Plan Tier',
    },
    // ---------------------------------------------- savedSearchUnsubscribe
    savedSearchUnsubscribe: {
      invalidHeading: 'Tautan tidak valid',
      invalidBody:
        'Tautan berhenti berlangganan tidak valid atau sudah kedaluwarsa. Anda dapat mengelola alert Anda secara manual dari dasbor.',
      notFoundHeading: 'Pencarian tidak ditemukan',
      notFoundBody:
        'Pencarian tersimpan ini sudah tidak ada lagi. Tidak ada alert yang dikirim untuk kriteria tersebut.',
      openSaved: 'Buka Pencarian Tersimpan',
      successHeading: 'Berhasil berhenti berlangganan',
      successBody: 'Berhasil berhenti berlangganan alert untuk: {name}.',
      successDetail:
        'Anda tidak akan menerima email mingguan untuk pencarian ini lagi. Anda dapat mengaktifkan kembali kapan saja dari dasbor.',
      manageAlerts: 'Kelola alert',
      searchJobs: 'Cari lowongan',
    },
    // --------------------------------------------------------------- loading
    loading: {
      srOnly: 'Memuat…',
    },
  },

  en: {
    // ------------------------------------------------------------------ profil
    profil: {
      heading: 'RPI profile not found',
      body: 'Enter the {usernameCode} or profile ID in the URL, e.g. {exampleCode}.',
      ctaBrowse: 'Browse partners',
      ctaHome: 'Back to home',
    },
    // ------------------------------------------------------------------ mitra
    mitra: {
      heading: 'Our Recruiting Partners',
      statsDesc:
        '{activeTenants} companies trust their recruitment to Rumah Pekerja Indonesia, with {publishedJobs} active jobs.',
      searchPlaceholder: 'Search partner name…',
      searchButton: 'Search',
      clearSearch: 'Clear',
      clearAll: 'Clear all',
      noDataIndustry: 'No data yet.',
      sortLabel: 'Sort',
      sortRelevance: 'Relevance',
      sortNewest: 'Newest',
      sortAlpha: 'A–Z',
      sortJobsHigh: 'Jobs ↓',
      sortJobsLow: 'Jobs ↑',
      resultCount: '{total} partners',
      pageInfo: 'page {page} of {totalPages}',
      emptyHeading: 'No partners',
      emptyFiltered: 'No partners match the current filters.',
      emptyAll: 'No partners registered yet.',
      clearFilter: 'Clear filter',
      jobsActive: '{count} active jobs',
      prevPage: 'Previous',
      nextPage: 'Next',
      ctaHeading: 'Become a Recruiting Partner',
      ctaBody:
        'Post jobs, manage your talent pool, and build your employer brand on a platform focused on Indonesian workers.',
      ctaButton: 'Register as Partner',
      filterIndustryTitle: 'Industry',
      filterPlanTitle: 'Plan Tier',
    },
    // ---------------------------------------------- savedSearchUnsubscribe
    savedSearchUnsubscribe: {
      invalidHeading: 'Invalid link',
      invalidBody:
        'The unsubscribe link is invalid or has expired. You can manage your alerts manually from the dashboard.',
      notFoundHeading: 'Search not found',
      notFoundBody:
        'This saved search no longer exists. No alerts are being sent for those criteria.',
      openSaved: 'Open Saved Searches',
      successHeading: 'Successfully unsubscribed',
      successBody: 'Successfully unsubscribed from alerts for: {name}.',
      successDetail:
        'You will no longer receive weekly emails for this search. You can re-enable it at any time from the dashboard.',
      manageAlerts: 'Manage alerts',
      searchJobs: 'Search jobs',
    },
    // --------------------------------------------------------------- loading
    loading: {
      srOnly: 'Loading…',
    },
  },
} as const
