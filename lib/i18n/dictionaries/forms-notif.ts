export const formsNotif = {
  id: {
    notificationItem: {
      // aria-* intentionally left in JSX; no translatable visible text
    },
    notificationsBell: {
      // relative-time words
      justNow: 'baru saja',
      minutesAgo: '{x} menit lalu',
      hoursAgo: '{x} jam lalu',
      daysAgo: '{x} hari lalu',
      // panel heading
      heading: 'Notifikasi',
      // mark-all button
      markAllRead: 'Tandai semua dibaca',
      // empty state
      empty: 'Tidak ada notifikasi',
      // footer link
      viewAll: 'Lihat semua',
    },
    notificationsDropdown: {
      // panel heading
      heading: 'Notifikasi',
      // mark-all button
      markAllRead: 'Tandai semua dibaca',
      // empty state
      empty: 'Tidak ada notifikasi.',
      // footer link
      viewAll: 'Lihat semua',
    },
    mentionsInbox: {
      // empty state
      emptyTitle: 'Belum ada mention',
      emptyDesc: 'Anda akan melihatnya di sini ketika anggota tim menyebut Anda di catatan lamaran.',
      // summary line
      unreadSummary: '{x} mention belum dibaca',
      allRead: 'Semua mention sudah dibaca',
      // mark-all button
      markAllRead: 'Tandai semua dibaca',
      // row body — dynamic segments
      mentionedBy: 'Anda disebut oleh {authorName}',
      mentionContext: 'di lamaran {candidateName} — {jobTitle}',
      // row link
      openApplication: 'Buka lamaran',
    },
  },
  en: {
    notificationItem: {
      // aria-* intentionally left in JSX; no translatable visible text
    },
    notificationsBell: {
      // relative-time words
      justNow: 'just now',
      minutesAgo: '{x} min ago',
      hoursAgo: '{x} hr ago',
      daysAgo: '{x} days ago',
      // panel heading
      heading: 'Notifications',
      // mark-all button
      markAllRead: 'Mark all as read',
      // empty state
      empty: 'No notifications',
      // footer link
      viewAll: 'View all',
    },
    notificationsDropdown: {
      // panel heading
      heading: 'Notifications',
      // mark-all button
      markAllRead: 'Mark all as read',
      // empty state
      empty: 'No notifications.',
      // footer link
      viewAll: 'View all',
    },
    mentionsInbox: {
      // empty state
      emptyTitle: 'No mentions yet',
      emptyDesc: 'You will see them here when a team member mentions you in an application note.',
      // summary line
      unreadSummary: '{x} unread mention(s)',
      allRead: 'All mentions are read',
      // mark-all button
      markAllRead: 'Mark all as read',
      // row body — dynamic segments
      mentionedBy: 'You were mentioned by {authorName}',
      mentionContext: 'in application {candidateName} — {jobTitle}',
      // row link
      openApplication: 'Open application',
    },
  },
} as const
