export const formsMisc2 = {
  id: {
    cmdK: {
      // input
      searchPlaceholder: 'Ketik perintah atau cari...',
      // empty state
      noResults: 'Tidak ada hasil.',
      // default item labels
      itemDashboard: 'Dashboard',
      itemJobs: 'Lowongan',
      itemSettings: 'Pengaturan',
      itemNewJob: 'Buat lowongan baru',
      itemNewJobHint: 'Baru',
      itemInvite: 'Undang anggota',
      // group names (used as display labels)
      groupPage: 'Halaman',
      groupAction: 'Aksi',
      groupRecent: 'Terakhir',
    },
    skillChips: {
      // section heading
      popularSearch: 'Pencarian Populer',
      // chip labels (Indonesian-only chips; bilingual chips kept in code)
      chipInternship: 'Magang/Internship',
      chipAccountant: 'Akuntan',
      chipAdmin: 'Administrasi',
      chipOps: 'Operasional',
      // "see all" link
      seeAll: 'Lihat semua',
      // aria labels
      ariaSearchJob: 'Cari lowongan {label}',
      ariaSeeAll: 'Lihat semua lowongan',
    },
    adminUsersTable: {
      // column headers
      colUser: 'Pengguna',
      colRole: 'Peran',
      colStatus: 'Status',
      colVerified: 'Verifikasi',
      colRegistered: 'Terdaftar',
      colLastLogin: 'Login Terakhir',
      // status labels
      statusActive: 'Aktif',
      statusPending: 'Menunggu',
      statusSuspended: 'Ditangguhkan',
      statusDeleted: 'Dihapus',
      // verified badges
      verifiedYes: 'Ya',
      verifiedNo: 'Belum',
      // actions
      detailLink: 'Detail →',
      // aria labels
      ariaSelectAll: 'Pilih semua di halaman ini',
      ariaSelectUser: 'Pilih {name}',
      // empty state
      noUsers: 'Tidak ada pengguna yang cocok.',
    },
  },
  en: {
    cmdK: {
      // input
      searchPlaceholder: 'Type a command or search...',
      // empty state
      noResults: 'No results.',
      // default item labels
      itemDashboard: 'Dashboard',
      itemJobs: 'Job Listings',
      itemSettings: 'Settings',
      itemNewJob: 'Create new job listing',
      itemNewJobHint: 'New',
      itemInvite: 'Invite member',
      // group names (used as display labels)
      groupPage: 'Pages',
      groupAction: 'Actions',
      groupRecent: 'Recent',
    },
    skillChips: {
      // section heading
      popularSearch: 'Popular Searches',
      // chip labels
      chipInternship: 'Internship',
      chipAccountant: 'Accountant',
      chipAdmin: 'Administration',
      chipOps: 'Operations',
      // "see all" link
      seeAll: 'See all',
      // aria labels
      ariaSearchJob: 'Search {label} jobs',
      ariaSeeAll: 'See all job listings',
    },
    adminUsersTable: {
      // column headers
      colUser: 'User',
      colRole: 'Role',
      colStatus: 'Status',
      colVerified: 'Verified',
      colRegistered: 'Registered',
      colLastLogin: 'Last Login',
      // status labels
      statusActive: 'Active',
      statusPending: 'Pending',
      statusSuspended: 'Suspended',
      statusDeleted: 'Deleted',
      // verified badges
      verifiedYes: 'Yes',
      verifiedNo: 'No',
      // actions
      detailLink: 'Detail →',
      // aria labels
      ariaSelectAll: 'Select all on this page',
      ariaSelectUser: 'Select {name}',
      // empty state
      noUsers: 'No matching users.',
    },
  },
} as const
