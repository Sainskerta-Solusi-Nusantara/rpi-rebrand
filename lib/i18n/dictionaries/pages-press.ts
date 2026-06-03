// Press pages namespace — detail, archive, category, tag pages.
// Mounted at `dictionary[locale].pagesPress.*` (see lib/i18n/dictionary.ts).

export const pagesPress = {
  id: {
    // -----------------------------------------------------------------------
    // Common (shared across all press sub-pages)
    // -----------------------------------------------------------------------
    common: {
      backToPress: 'Kembali ke press room',
      backToPressBrief: 'Kembali ke press',
      readMore: 'Baca selengkapnya',
      viewAll: 'Lihat semua',
      pressReleaseCount: '{n} siaran pers',
    },

    // -----------------------------------------------------------------------
    // Detail page  (/press/[slug])
    // -----------------------------------------------------------------------
    detail: {
      forImmediateRelease: 'UNTUK PUBLIKASI SEGERA',
      topicsLabel: 'Topik',
      mediaContact: 'Kontak Media',
      downloadsLabel: 'Materi Pengunduhan',
      shareLabel: 'Bagikan',
      requestInterview: 'Permintaan Wawancara',
      print: 'Cetak',
      copyLink: 'Salin link',
      relatedEyebrow: 'Siaran Pers Lain',
      relatedHeading: 'Pengumuman terkait',
      ctaHeading: 'Butuh informasi lebih?',
      ctaBody: 'Akses arsip lengkap siaran pers, press kit, foto eksekutif, dan brand guidelines di press room kami.',
      ariaRelated: 'Siaran pers terkait',
      emailSubjectAsk: 'Tanya: {title}',
      emailSubjectInterview: 'Wawancara: {title}',
    },

    // -----------------------------------------------------------------------
    // Archive page  (/press/archive)
    // -----------------------------------------------------------------------
    archive: {
      eyebrow: 'Arsip Press',
      heading: 'Arsip lengkap siaran pers',
      bodyPrefix: 'Cari dan akses semua',
      bodySuffix: 'Rumah Pekerja Indonesia. Untuk wawancara atau permintaan kustom, hubungi tim media kami.',
      totalReleases: '{n} siaran pers',
      searchPlaceholder: 'Cari judul, ringkasan, atau topik…',
      searchAriaLabel: 'Cari siaran pers',
      clearSearch: 'Bersihkan',
      clearSearchAria: 'Hapus pencarian',
      searchButton: 'Cari',
      categoryLabel: 'Kategori',
      yearLabel: 'Tahun',
      yearAll: 'Semua',
      resultCount: '{n} hasil',
      resultCountSuffix: 'dari {total} siaran',
      resetFilter: 'Reset filter',
      emptyHeading: 'Tidak ada siaran pers yang cocok',
      emptyBody: 'Coba ubah kata kunci atau pilih kategori lain.',
      releasesPerYear: '{n} siaran',
      sidebarArchiveLabel: 'Arsip',
      sidebarTotal: 'Total siaran',
      sidebarActiveYears: 'Tahun aktif',
      sidebarCategories: 'Kategori',
      sidebarSince: 'Sejak',
      sidebarPerCategory: 'Per Kategori',
      sidebarMediaTeam: 'Tim Media',
      sidebarMediaBody: 'Untuk wawancara, riset, atau permintaan kustom — tim komunikasi membalas dalam 4 jam kerja.',
      sidebarContactTeam: 'Hubungi Tim Media',
      sidebarPressKitBody: 'Logo pack, brand guidelines, foto eksekutif, fact sheet — semuanya dalam satu unduhan.',
      sidebarDownload: 'Unduh (58 MB)',
      rowReadLabel: 'Baca',
    },

    // -----------------------------------------------------------------------
    // Category page  (/press/category/[slug])
    // -----------------------------------------------------------------------
    category: {
      eyebrow: 'Kategori Siaran Pers',
      releaseCountSuffix: 'siaran pers dalam kategori ini.',
      emptyHeading: 'Belum ada siaran pers dalam kategori ini',
      emptyBody: 'Jelajahi semua siaran pers RPI di halaman press.',
      emptyAction: 'Lihat semua siaran pers',
      otherEyebrow: 'Jelajahi kategori lain',
      ariaOtherCategories: 'Kategori lainnya',
    },

    // -----------------------------------------------------------------------
    // Tag page  (/press/tag/[slug])
    // -----------------------------------------------------------------------
    tag: {
      eyebrow: 'Tag Siaran Pers',
      otherTagsLabel: 'Tag lain:',
      emptyHeading: 'Belum ada siaran pers dengan tag ini',
      emptyBody: 'Jelajahi semua siaran pers RPI.',
      emptyAction: 'Lihat semua siaran pers',
      otherEyebrow: 'Jelajahi tag lain',
      ariaOtherTags: 'Tag lainnya',
    },
  },

  en: {
    // -----------------------------------------------------------------------
    // Common
    // -----------------------------------------------------------------------
    common: {
      backToPress: 'Back to press room',
      backToPressBrief: 'Back to press',
      readMore: 'Read more',
      viewAll: 'View all',
      pressReleaseCount: '{n} press releases',
    },

    // -----------------------------------------------------------------------
    // Detail page
    // -----------------------------------------------------------------------
    detail: {
      forImmediateRelease: 'FOR IMMEDIATE RELEASE',
      topicsLabel: 'Topics',
      mediaContact: 'Media Contact',
      downloadsLabel: 'Download Materials',
      shareLabel: 'Share',
      requestInterview: 'Request Interview',
      print: 'Print',
      copyLink: 'Copy link',
      relatedEyebrow: 'Other Press Releases',
      relatedHeading: 'Related announcements',
      ctaHeading: 'Need more information?',
      ctaBody: 'Access the full archive of press releases, press kit, executive photos, and brand guidelines in our press room.',
      ariaRelated: 'Related press releases',
      emailSubjectAsk: 'Inquiry: {title}',
      emailSubjectInterview: 'Interview: {title}',
    },

    // -----------------------------------------------------------------------
    // Archive page
    // -----------------------------------------------------------------------
    archive: {
      eyebrow: 'Press Archive',
      heading: 'Complete press release archive',
      bodyPrefix: 'Search and access all',
      bodySuffix: 'Rumah Pekerja Indonesia. For interviews or custom requests, contact our media team.',
      totalReleases: '{n} press releases',
      searchPlaceholder: 'Search by title, summary, or topic…',
      searchAriaLabel: 'Search press releases',
      clearSearch: 'Clear',
      clearSearchAria: 'Clear search',
      searchButton: 'Search',
      categoryLabel: 'Category',
      yearLabel: 'Year',
      yearAll: 'All',
      resultCount: '{n} results',
      resultCountSuffix: 'of {total} releases',
      resetFilter: 'Reset filter',
      emptyHeading: 'No matching press releases',
      emptyBody: 'Try changing the keyword or selecting a different category.',
      releasesPerYear: '{n} releases',
      sidebarArchiveLabel: 'Archive',
      sidebarTotal: 'Total releases',
      sidebarActiveYears: 'Active years',
      sidebarCategories: 'Categories',
      sidebarSince: 'Since',
      sidebarPerCategory: 'By Category',
      sidebarMediaTeam: 'Media Team',
      sidebarMediaBody: 'For interviews, research, or custom requests — the communications team responds within 4 business hours.',
      sidebarContactTeam: 'Contact Media Team',
      sidebarPressKitBody: 'Logo pack, brand guidelines, executive photos, fact sheet — all in one download.',
      sidebarDownload: 'Download (58 MB)',
      rowReadLabel: 'Read',
    },

    // -----------------------------------------------------------------------
    // Category page
    // -----------------------------------------------------------------------
    category: {
      eyebrow: 'Press Release Category',
      releaseCountSuffix: 'press releases in this category.',
      emptyHeading: 'No press releases in this category yet',
      emptyBody: 'Browse all RPI press releases on the press page.',
      emptyAction: 'View all press releases',
      otherEyebrow: 'Explore other categories',
      ariaOtherCategories: 'Other categories',
    },

    // -----------------------------------------------------------------------
    // Tag page
    // -----------------------------------------------------------------------
    tag: {
      eyebrow: 'Press Release Tag',
      otherTagsLabel: 'Other tags:',
      emptyHeading: 'No press releases with this tag yet',
      emptyBody: 'Browse all RPI press releases.',
      emptyAction: 'View all press releases',
      otherEyebrow: 'Explore other tags',
      ariaOtherTags: 'Other tags',
    },
  },
} as const
