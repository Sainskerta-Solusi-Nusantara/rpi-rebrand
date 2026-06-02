export const formsMisc4 = {
  id: {
    scorecardSummary: {
      // heading
      heading: 'Ringkasan scorecard',
      // empty state
      emptyState: 'Belum ada scorecard.',
      // stat labels
      statTotal: 'Total scorecard',
      statAvgScore: 'Skor rata-rata',
      statCriteria: 'Kriteria',
      // sections
      sectionScorePerCriteria: 'Skor per kriteria',
      sectionRecommendationDist: 'Sebaran rekomendasi',
      sectionIndividual: 'Scorecard individu',
      // score suffix
      scoreSuffix: '/ 5',
      // per-item
      itemScore: 'Skor: {score} / 5',
      itemBy: 'Oleh {author} · {count} kriteria',
    },
    interviewScorecardSummary: {
      // aria + heading
      heading: 'Scorecard Wawancara',
      // empty state
      emptyState: 'Belum ada scorecard tersimpan untuk lamaran ini.',
      // stat labels
      statAvgScore: 'Rata-rata skor',
      statTotal: 'Total scorecard',
      statConsensus: 'Konsensus',
      // no-data inside consensus cell
      noData: 'Belum cukup data',
      // distribution section
      sectionDist: 'Distribusi rekomendasi',
      emptyDist: 'Belum ada rekomendasi.',
      // criteria section
      sectionCriteria: 'Rata-rata per kriteria',
      // per-interview section
      sectionDetail: 'Detail per wawancara',
      // per-interview row
      rowScore: 'Skor: {score} / 5',
      rowBy: 'Oleh {author} · {count} kriteria',
      rowOpenDetail: 'Buka detail wawancara →',
    },
    savedSearchList: {
      // empty state
      emptyHeading: 'Belum ada pencarian tersimpan',
      emptyDesc: 'Buat pencarian pertama Anda untuk menerima alert email mingguan saat ada lowongan baru yang cocok dengan kriteria Anda.',
    },
    skillAutocomplete: {
      // default placeholder
      placeholder: 'Ketik untuk mencari skill, Enter untuk menambah',
      // chip list aria label
      ariaSelectedList: 'Skill terpilih',
      // remove-chip button aria label
      ariaRemoveChip: 'Hapus {skill}',
    },
    onboardingChecklist: {
      // section aria label
      ariaSection: 'Daftar onboarding',
      // heading
      heading: 'Selesaikan pengaturan akun',
      // progress text
      progress: '{done} dari {total} selesai',
      // dismiss button aria label
      ariaDismiss: 'Tutup daftar onboarding',
      // step link aria label
      ariaOpenStep: 'Buka {label}',
      // encouragement
      encouragement: 'Bagus! Lanjutkan untuk menyelesaikan semua langkah.',
      // wizard actions
      openWizard: 'Buka wizard onboarding',
      closeWizard: 'Tutup wizard',
      closing: 'Memuat…',
      // fallback error
      closeError: 'Terjadi kesalahan. Coba lagi.',
    },
    totpSetupWizard: {
      // start stage
      startDesc: 'Aktifkan two-factor authentication (2FA) untuk menambah lapisan keamanan saat masuk. Anda akan butuh aplikasi authenticator seperti Google Authenticator, 1Password, atau Authy.',
      startBtnIdle: 'Mulai setup 2FA',
      startBtnPending: 'Menyiapkan…',
      // qr stage
      qrStep1: '1. Pindai QR di authenticator app',
      qrManualHint: 'Jika tidak bisa scan, masukkan secret berikut secara manual.',
      qrSecretLabel: 'Secret manual',
      qrImageAlt: 'QR code 2FA',
      qrStep2: '2. Masukkan kode 6 digit dari aplikasi',
      confirmBtnIdle: 'Aktifkan 2FA',
      confirmBtnPending: 'Memverifikasi…',
      cancelLink: 'Batal',
      // done stage
      successMsg: '2FA berhasil diaktifkan.',
      recoveryHeading: 'Recovery codes',
      recoveryDesc: 'Simpan kode ini di tempat aman (password manager). Setiap kode hanya dapat dipakai sekali, dan ini satu-satunya kesempatan menampilkannya. Jika kehilangan akses ke authenticator, kode ini cara terakhir untuk masuk dan menonaktifkan 2FA.',
      copyAll: 'Salin semua ke clipboard',
      doneLink: 'Selesai',
    },
  },
  en: {
    scorecardSummary: {
      heading: 'Scorecard summary',
      emptyState: 'No scorecards yet.',
      statTotal: 'Total scorecards',
      statAvgScore: 'Average score',
      statCriteria: 'Criteria',
      sectionScorePerCriteria: 'Score per criterion',
      sectionRecommendationDist: 'Recommendation breakdown',
      sectionIndividual: 'Individual scorecards',
      scoreSuffix: '/ 5',
      itemScore: 'Score: {score} / 5',
      itemBy: 'By {author} · {count} criteria',
    },
    interviewScorecardSummary: {
      heading: 'Interview Scorecards',
      emptyState: 'No scorecards saved for this application yet.',
      statAvgScore: 'Average score',
      statTotal: 'Total scorecards',
      statConsensus: 'Consensus',
      noData: 'Not enough data yet',
      sectionDist: 'Recommendation distribution',
      emptyDist: 'No recommendations yet.',
      sectionCriteria: 'Average per criterion',
      sectionDetail: 'Detail per interview',
      rowScore: 'Score: {score} / 5',
      rowBy: 'By {author} · {count} criteria',
      rowOpenDetail: 'Open interview detail →',
    },
    savedSearchList: {
      emptyHeading: 'No saved searches yet',
      emptyDesc: 'Create your first search to receive weekly email alerts when new jobs matching your criteria are posted.',
    },
    skillAutocomplete: {
      placeholder: 'Type to search skills, press Enter to add',
      ariaSelectedList: 'Selected skills',
      ariaRemoveChip: 'Remove {skill}',
    },
    onboardingChecklist: {
      ariaSection: 'Onboarding checklist',
      heading: 'Complete your account setup',
      progress: '{done} of {total} complete',
      ariaDismiss: 'Dismiss onboarding checklist',
      ariaOpenStep: 'Open {label}',
      encouragement: 'Great! Keep going to finish all steps.',
      openWizard: 'Open onboarding wizard',
      closeWizard: 'Close wizard',
      closing: 'Loading…',
      closeError: 'An error occurred. Please try again.',
    },
    totpSetupWizard: {
      startDesc: 'Enable two-factor authentication (2FA) to add an extra layer of security when signing in. You will need an authenticator app such as Google Authenticator, 1Password, or Authy.',
      startBtnIdle: 'Start 2FA setup',
      startBtnPending: 'Setting up…',
      qrStep1: '1. Scan the QR code in your authenticator app',
      qrManualHint: 'If you cannot scan, enter the secret below manually.',
      qrSecretLabel: 'Manual secret',
      qrImageAlt: 'QR code for 2FA',
      qrStep2: '2. Enter the 6-digit code from the app',
      confirmBtnIdle: 'Enable 2FA',
      confirmBtnPending: 'Verifying…',
      cancelLink: 'Cancel',
      successMsg: '2FA successfully enabled.',
      recoveryHeading: 'Recovery codes',
      recoveryDesc: 'Save these codes somewhere safe (e.g. a password manager). Each code can only be used once, and this is the only time they will be shown. If you lose access to your authenticator, these codes are your last resort to sign in and disable 2FA.',
      copyAll: 'Copy all to clipboard',
      doneLink: 'Done',
    },
  },
} as const
