export const srvTenant2fa = {
  id: {
    tenant2fa: {
      mustLogin: 'Anda harus masuk.',
      tenantNotFound: 'Tenant tidak ditemukan.',
      ownerOnly: 'Hanya OWNER tenant yang dapat mengubah kebijakan ini.',
      genericError: 'Terjadi kesalahan. Coba lagi sebentar.',
      userNotFound: 'Pengguna tidak ditemukan.',
      noAccess: 'Anda tidak punya akses untuk tindakan ini.',
      notMember: 'Pengguna bukan anggota tenant ini.',
      nudgeTitle: 'Aktifkan 2FA untuk {tenantName}',
      nudgeBody:
        'Tenant {tenantName} mewajibkan two-factor authentication. Aktifkan sekarang agar akses dasbor tetap lancar.',
    },
  },
  en: {
    tenant2fa: {
      mustLogin: 'You must be signed in.',
      tenantNotFound: 'Tenant not found.',
      ownerOnly: 'Only the tenant OWNER can change this policy.',
      genericError: 'Something went wrong. Please try again shortly.',
      userNotFound: 'User not found.',
      noAccess: 'You do not have access to perform this action.',
      notMember: 'User is not a member of this tenant.',
      nudgeTitle: 'Enable 2FA for {tenantName}',
      nudgeBody:
        'Tenant {tenantName} requires two-factor authentication. Enable it now to keep your dashboard access uninterrupted.',
    },
  },
} as const
