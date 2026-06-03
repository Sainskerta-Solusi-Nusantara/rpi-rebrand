export const srvAuth1 = {
  id: {
    // --- account-actions.ts ---
    account: {
      mustLogin: 'Anda harus masuk.',
      typeHapus: 'Ketik HAPUS untuk konfirmasi.',
      enterPassword: 'Masukkan password Anda.',
      notFound: 'Akun tidak ditemukan.',
      alreadyDeleted: 'Akun ini sudah dihapus.',
      oauthNoPassword:
        'Atur password terlebih dulu sebelum menghapus akun (akun OAuth-only tidak dapat dikonfirmasi via password).',
      wrongPassword: 'Password salah.',
      ownerMustTransfer:
        'Anda masih OWNER tenant: {list}. Transfer kepemilikan dulu sebelum menghapus akun.',
      genericError: 'Terjadi kesalahan. Coba lagi sebentar.',
    },
    // --- actions.ts ---
    auth: {
      dataInvalid: 'Data tidak valid',
      emailTaken: 'Email sudah terdaftar',
      emailInvalid: 'Email tidak valid',
      genericError: 'Terjadi kesalahan. Coba lagi sebentar.',
      resetLinkInvalid: 'Tautan reset tidak valid atau sudah kedaluwarsa. Minta tautan baru.',
      mustLoginVerify: 'Anda perlu masuk untuk meminta verifikasi.',
      accountNotFound: 'Akun tidak ditemukan.',
      alreadyVerified: 'Email Anda sudah terverifikasi.',
      waitBeforeResend: 'Tunggu sebentar sebelum meminta tautan baru.',
    },
    // --- api-token-actions.ts ---
    apiToken: {
      mustLogin: 'Anda harus masuk.',
      dataInvalid: 'Data tidak valid',
      tokenLimitReached:
        'Batas {max} token aktif tercapai. Cabut token lama dulu.',
      genericError: 'Terjadi kesalahan. Coba lagi sebentar.',
      invalidTokenId: 'ID token tidak valid.',
      tokenNotFound: 'Token tidak ditemukan.',
      tokenNotOwned: 'Token bukan milik Anda.',
    },
    // --- avatar-actions.ts ---
    avatar: {
      mustLogin: 'Anda harus masuk.',
      fileNotFound: 'Berkas tidak ditemukan.',
      fileEmpty: 'Berkas kosong.',
      fileTooLarge: 'Ukuran gambar melebihi 5 MB.',
      invalidFormat: 'Format gambar harus JPEG, PNG, atau WEBP.',
      genericError: 'Terjadi kesalahan. Coba lagi sebentar.',
    },
  },
  en: {
    // --- account-actions.ts ---
    account: {
      mustLogin: 'You must be signed in.',
      typeHapus: 'Type HAPUS to confirm.',
      enterPassword: 'Enter your password.',
      notFound: 'Account not found.',
      alreadyDeleted: 'This account has already been deleted.',
      oauthNoPassword:
        'Set a password first before deleting your account (OAuth-only accounts cannot be confirmed via password).',
      wrongPassword: 'Incorrect password.',
      ownerMustTransfer:
        'You are still OWNER of tenant(s): {list}. Transfer ownership first before deleting your account.',
      genericError: 'Something went wrong. Please try again shortly.',
    },
    // --- actions.ts ---
    auth: {
      dataInvalid: 'Invalid data',
      emailTaken: 'Email already registered',
      emailInvalid: 'Invalid email',
      genericError: 'Something went wrong. Please try again shortly.',
      resetLinkInvalid: 'Reset link is invalid or has expired. Request a new link.',
      mustLoginVerify: 'You must be signed in to request verification.',
      accountNotFound: 'Account not found.',
      alreadyVerified: 'Your email is already verified.',
      waitBeforeResend: 'Please wait a moment before requesting a new link.',
    },
    // --- api-token-actions.ts ---
    apiToken: {
      mustLogin: 'You must be signed in.',
      dataInvalid: 'Invalid data',
      tokenLimitReached:
        'Limit of {max} active tokens reached. Revoke an old token first.',
      genericError: 'Something went wrong. Please try again shortly.',
      invalidTokenId: 'Invalid token ID.',
      tokenNotFound: 'Token not found.',
      tokenNotOwned: 'This token does not belong to you.',
    },
    // --- avatar-actions.ts ---
    avatar: {
      mustLogin: 'You must be signed in.',
      fileNotFound: 'File not found.',
      fileEmpty: 'File is empty.',
      fileTooLarge: 'Image size exceeds 5 MB.',
      invalidFormat: 'Image format must be JPEG, PNG, or WEBP.',
      genericError: 'Something went wrong. Please try again shortly.',
    },
  },
} as const
