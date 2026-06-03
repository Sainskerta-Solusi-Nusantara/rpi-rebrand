// Server-action messages namespace: srvBilling.
// Keys are grouped by source file.

export const srvBilling = {
  id: {
    // lib/billing/stripe-actions.ts
    stripe: {
      demoMode: 'Mode demo — STRIPE_SECRET_KEY belum dikonfigurasi.',
      dataInvalid: 'Data tidak valid.',
      freePlanNoCheckout: 'Plan Free tidak memerlukan checkout.',
      mustSignIn: 'Anda harus masuk.',
      tenantNotFound: 'Tenant tidak ditemukan.',
      noBillingPermission: 'Anda tidak memiliki izin billing.',
      planUnavailable: 'Plan ini tidak tersedia untuk checkout.',
      stripeNoUrl: 'Stripe tidak mengembalikan URL checkout.',
      checkoutFailed: 'Gagal memulai checkout.',
      portalFailed: 'Gagal membuka portal.',
    },
    // lib/tenants/billing-actions.ts
    tenantBilling: {
      dataInvalid: 'Data tidak valid',
      mustSignIn: 'Anda harus masuk.',
      tenantNotFound: 'Tenant tidak ditemukan.',
      noPermission: 'Anda tidak memiliki izin.',
      alreadyOnPlan: 'Tenant sudah berada pada plan tersebut.',
      noActiveSubscription: 'Tidak ada langganan aktif untuk dibatalkan.',
      genericError: 'Terjadi kesalahan. Coba lagi sebentar.',
    },
    // lib/blog/actions.ts
    blog: {
      mustSignIn: 'Anda harus masuk.',
      accessDenied: 'Akses ditolak.',
      articleIdInvalid: 'ID artikel tidak valid.',
      articleNotFound: 'Artikel tidak ditemukan.',
      dataInvalid: 'Data tidak valid',
      genericError: 'Terjadi kesalahan. Coba lagi sebentar.',
    },
    // lib/jd-generator/actions.ts
    jdGenerator: {
      mustSignIn: 'Anda harus masuk.',
      dataInvalid: 'Data tidak valid',
      tenantNotFound: 'Tenant tidak ditemukan.',
      noPermission: 'Anda tidak memiliki izin.',
    },
  },
  en: {
    // lib/billing/stripe-actions.ts
    stripe: {
      demoMode: 'Demo mode — STRIPE_SECRET_KEY is not configured.',
      dataInvalid: 'Invalid data.',
      freePlanNoCheckout: 'The Free plan does not require checkout.',
      mustSignIn: 'You must be signed in.',
      tenantNotFound: 'Tenant not found.',
      noBillingPermission: 'You do not have billing permission.',
      planUnavailable: 'This plan is not available for checkout.',
      stripeNoUrl: 'Stripe did not return a checkout URL.',
      checkoutFailed: 'Failed to start checkout.',
      portalFailed: 'Failed to open the portal.',
    },
    // lib/tenants/billing-actions.ts
    tenantBilling: {
      dataInvalid: 'Invalid data',
      mustSignIn: 'You must be signed in.',
      tenantNotFound: 'Tenant not found.',
      noPermission: 'You do not have permission.',
      alreadyOnPlan: 'The tenant is already on that plan.',
      noActiveSubscription: 'No active subscription to cancel.',
      genericError: 'An error occurred. Please try again shortly.',
    },
    // lib/blog/actions.ts
    blog: {
      mustSignIn: 'You must be signed in.',
      accessDenied: 'Access denied.',
      articleIdInvalid: 'Invalid article ID.',
      articleNotFound: 'Article not found.',
      dataInvalid: 'Invalid data',
      genericError: 'An error occurred. Please try again shortly.',
    },
    // lib/jd-generator/actions.ts
    jdGenerator: {
      mustSignIn: 'You must be signed in.',
      dataInvalid: 'Invalid data',
      tenantNotFound: 'Tenant not found.',
      noPermission: 'You do not have permission.',
    },
  },
} as const
