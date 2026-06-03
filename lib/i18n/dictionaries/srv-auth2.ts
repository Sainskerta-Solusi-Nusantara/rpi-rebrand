export const srvAuth2 = {
  id: {
    emailChange: {
      mustLogin: 'Anda harus masuk.',
      accountNotFound: 'Akun tidak ditemukan.',
      oauthNoEmailChange:
        'Akun OAuth tidak dapat mengganti email lewat alur ini. Atur password terlebih dulu.',
      emailSameAsCurrent: 'Email baru sama dengan email saat ini.',
      passwordWrong: 'Password salah.',
      emailTaken: 'Email tersebut sudah digunakan.',
      genericError: 'Terjadi kesalahan. Coba lagi sebentar.',
      tokenInvalid: 'Token tidak valid.',
      linkInvalid: 'Tautan tidak valid.',
      linkUsed: 'Tautan sudah digunakan.',
      linkExpired: 'Tautan sudah kedaluwarsa. Mulai permintaan baru.',
      linkStale: 'Tautan tidak lagi berlaku karena email telah berubah.',
    },
    notification: {
      mustLogin: 'Anda harus masuk.',
      dataInvalid: 'Data tidak valid.',
      genericError: 'Terjadi kesalahan. Coba lagi sebentar.',
    },
    oauth: {
      mustLogin: 'Anda harus masuk.',
      passwordRequired: 'Masukkan password Anda.',
      accountNotFound: 'Akun tidak ditemukan.',
      noPasswordSet:
        'Akun Anda tidak memiliki password. Atur password terlebih dulu agar tidak terkunci.',
      passwordWrong: 'Password salah.',
      googleNotLinked: 'Akun Google tidak terhubung.',
      genericError: 'Terjadi kesalahan. Coba lagi sebentar.',
    },
    password: {
      oauthAccount:
        'Akun Anda menggunakan Google. Hubungi support untuk mengatur password.',
      currentPasswordWrong: 'Password saat ini salah',
      dataInvalid: 'Data tidak valid',
      changeFailed: 'Gagal mengganti password. Coba lagi.',
    },
  },
  en: {
    emailChange: {
      mustLogin: 'You must be signed in.',
      accountNotFound: 'Account not found.',
      oauthNoEmailChange:
        'OAuth accounts cannot change email through this flow. Set a password first.',
      emailSameAsCurrent: 'New email is the same as your current email.',
      passwordWrong: 'Incorrect password.',
      emailTaken: 'That email is already in use.',
      genericError: 'Something went wrong. Please try again shortly.',
      tokenInvalid: 'Invalid token.',
      linkInvalid: 'Invalid link.',
      linkUsed: 'This link has already been used.',
      linkExpired: 'Link has expired. Please start a new request.',
      linkStale: 'Link is no longer valid because the email has already changed.',
    },
    notification: {
      mustLogin: 'You must be signed in.',
      dataInvalid: 'Invalid data.',
      genericError: 'Something went wrong. Please try again shortly.',
    },
    oauth: {
      mustLogin: 'You must be signed in.',
      passwordRequired: 'Please enter your password.',
      accountNotFound: 'Account not found.',
      noPasswordSet:
        'Your account has no password. Set a password first to avoid being locked out.',
      passwordWrong: 'Incorrect password.',
      googleNotLinked: 'No Google account is linked.',
      genericError: 'Something went wrong. Please try again shortly.',
    },
    password: {
      oauthAccount:
        'Your account uses Google sign-in. Contact support to set a password.',
      currentPasswordWrong: 'Current password is incorrect',
      dataInvalid: 'Invalid data',
      changeFailed: 'Failed to change password. Please try again.',
    },
  },
} as const
