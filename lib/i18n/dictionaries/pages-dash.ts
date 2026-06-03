// pages-dash namespace — dashboard candidate pages
// Covers: assesmen, disimpan, lms, lowonganDisimpan, loading

export const pagesDash = {
  id: {
    assesmen: {
      heading: 'Asesmen Keterampilan',
      subheading:
        'Buktikan kemampuan Anda lewat tes singkat. Lencana muncul di profil publik setelah Anda lulus.',
      searchPlaceholder: 'Cari asesmen…',
      searchButton: 'Cari',
      filterLabel: 'Semua kategori',
      countLabel: '{total} asesmen tersedia',
      countLabelCategory: '{total} asesmen tersedia di kategori "{category}"',
      emptyTitle: 'Belum ada asesmen yang cocok dengan filter Anda.',
      resetFilter: 'Reset filter',
      passed: 'Sudah lulus',
      categoryLabel: 'Kategori:',
      minutesSuffix: 'mnt',
      questionsSuffix: 'pertanyaan',
      passingScoreLabel: 'Lulus ≥ {score}',
      tryAgain: 'Coba lagi',
      tryButton: 'Coba',
      paginationLabel: 'Paginasi',
      filterCategoryLabel: 'Filter kategori',
    },
    disimpan: {
      heading: 'Lowongan Disimpan',
      countLabel: '{count} lowongan yang Anda simpan.',
      emptyText: 'Belum ada lowongan yang disimpan.',
      browseLink: 'Jelajahi lowongan',
    },
    lms: {
      heading: 'Pembelajaran Saya',
      subheading:
        '{inProgress} kursus aktif • {completed} selesai • {certificates} sertifikat',
      inProgressSection: 'Sedang Berjalan',
      completedSection: 'Selesai',
      emptyInProgress: 'Belum mendaftar kursus apa pun.',
      browseCoursesLink: 'Jelajahi kursus',
      emptyCompleted: 'Belum ada kursus yang diselesaikan.',
      courseMeta: '{hours} jam • {modules} modul',
      continueLink: 'Lanjutkan belajar',
      completedOn: 'Selesai {date}',
    },
    lowonganDisimpan: {
      heading: 'Pencarian Tersimpan',
      subheading:
        'Simpan kriteria pencarian lowongan favorit dan dapatkan alert email saat ada lowongan baru cocok.',
      emptyHeading: 'Belum ada pencarian tersimpan',
      emptyText:
        'Buat pencarian pertama Anda untuk menerima alert lowongan baru sesuai kriteria yang Anda pilih.',
      createButton: 'Buat pencarian baru',
      newSearchHeading: 'Pencarian baru',
    },
    loading: {
      srText: 'Memuat dasbor…',
    },
  },
  en: {
    assesmen: {
      heading: 'Skill Assessments',
      subheading:
        'Prove your abilities through short tests. Badges appear on your public profile after you pass.',
      searchPlaceholder: 'Search assessments…',
      searchButton: 'Search',
      filterLabel: 'All categories',
      countLabel: '{total} assessments available',
      countLabelCategory: '{total} assessments available in category "{category}"',
      emptyTitle: 'No assessments match your filter.',
      resetFilter: 'Reset filter',
      passed: 'Passed',
      categoryLabel: 'Category:',
      minutesSuffix: 'min',
      questionsSuffix: 'questions',
      passingScoreLabel: 'Pass ≥ {score}',
      tryAgain: 'Retry',
      tryButton: 'Try',
      paginationLabel: 'Pagination',
      filterCategoryLabel: 'Filter by category',
    },
    disimpan: {
      heading: 'Saved Jobs',
      countLabel: '{count} jobs saved.',
      emptyText: 'No saved jobs yet.',
      browseLink: 'Browse jobs',
    },
    lms: {
      heading: 'My Learning',
      subheading:
        '{inProgress} active courses • {completed} completed • {certificates} certificates',
      inProgressSection: 'In Progress',
      completedSection: 'Completed',
      emptyInProgress: 'Not enrolled in any course yet.',
      browseCoursesLink: 'Browse courses',
      emptyCompleted: 'No completed courses yet.',
      courseMeta: '{hours} hrs • {modules} modules',
      continueLink: 'Continue learning',
      completedOn: 'Completed {date}',
    },
    lowonganDisimpan: {
      heading: 'Saved Searches',
      subheading:
        'Save your favourite job search criteria and get email alerts when new matching jobs appear.',
      emptyHeading: 'No saved searches yet',
      emptyText:
        'Create your first search to receive alerts for new jobs matching your selected criteria.',
      createButton: 'Create new search',
      newSearchHeading: 'New search',
    },
    loading: {
      srText: 'Loading dashboard…',
    },
  },
} as const
