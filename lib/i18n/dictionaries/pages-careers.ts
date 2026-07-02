// pages-careers namespace — location/[slug], team/[slug], courses/topic/[slug]
// Mounted at `dictionary[locale].pagesCareers.*`

export const pagesCareers = {
  id: {
    // ------------------------------------------------------------------
    // careers/location/[slug]
    // ------------------------------------------------------------------
    location: {
      back: 'Kembali ke semua karier',
      eyebrow: 'Lokasi Karier',
      openingsSuffix: 'lowongan di lokasi ini',
      emptyHeading: 'Belum ada lowongan di lokasi ini',
      emptyBody: 'Cek kembali nanti — atau jelajahi lokasi lain di bawah.',
      emptyButton: 'Lihat semua lowongan',
      otherEyebrow: 'Jelajahi',
      otherHeading: 'Lokasi lainnya',
      otherAllLink: 'Semua lowongan',
      otherCount: '{n} lowongan',
    },

    // ------------------------------------------------------------------
    // careers/team/[slug]
    // ------------------------------------------------------------------
    team: {
      back: 'Kembali ke semua tim',
      eyebrow: 'Tim Karier',
      openingsSuffix: 'lowongan terbuka di tim ini',
      emptyHeading: 'Belum ada lowongan terbuka di tim ini',
      emptyBody: 'Cek kembali nanti — atau jelajahi tim lain di bawah.',
      emptyButton: 'Lihat semua lowongan',
      otherEyebrow: 'Jelajahi',
      otherHeading: 'Tim lainnya di SSN',
      otherAllLink: 'Semua lowongan',
      otherCount: '{n} lowongan',
    },

    // ------------------------------------------------------------------
    // courses/topic/[slug]
    // ------------------------------------------------------------------
    coursesTopic: {
      back: 'Kembali ke semua kursus',
      eyebrow: 'Topik Kursus',
      coursesSuffix: 'kursus di topik ini',
      emptyHeading: 'Belum ada kursus dalam topik ini',
      emptyBody: 'Cek kembali nanti — atau jelajahi topik lain di bawah.',
      emptyButton: 'Lihat semua kursus',
      otherEyebrow: 'Jelajahi',
      otherHeading: 'Topik kursus lainnya',
      otherAllLink: 'Semua kursus',
      otherCount: '{n} kursus',
    },
  },

  en: {
    // ------------------------------------------------------------------
    // careers/location/[slug]
    // ------------------------------------------------------------------
    location: {
      back: 'Back to all careers',
      eyebrow: 'Career Location',
      openingsSuffix: 'opening(s) in this location',
      emptyHeading: 'No openings in this location yet',
      emptyBody: 'Check back later — or explore other locations below.',
      emptyButton: 'View all openings',
      otherEyebrow: 'Explore',
      otherHeading: 'Other locations',
      otherAllLink: 'All openings',
      otherCount: '{n} opening(s)',
    },

    // ------------------------------------------------------------------
    // careers/team/[slug]
    // ------------------------------------------------------------------
    team: {
      back: 'Back to all teams',
      eyebrow: 'Career Team',
      openingsSuffix: 'open role(s) in this team',
      emptyHeading: 'No open roles in this team yet',
      emptyBody: 'Check back later — or explore other teams below.',
      emptyButton: 'View all openings',
      otherEyebrow: 'Explore',
      otherHeading: 'Other teams at SSN',
      otherAllLink: 'All openings',
      otherCount: '{n} opening(s)',
    },

    // ------------------------------------------------------------------
    // courses/topic/[slug]
    // ------------------------------------------------------------------
    coursesTopic: {
      back: 'Back to all courses',
      eyebrow: 'Course Topic',
      coursesSuffix: 'course(s) in this topic',
      emptyHeading: 'No courses in this topic yet',
      emptyBody: 'Check back later — or explore other topics below.',
      emptyButton: 'View all courses',
      otherEyebrow: 'Explore',
      otherHeading: 'Other course topics',
      otherAllLink: 'All courses',
      otherCount: '{n} course(s)',
    },
  },
} as const
