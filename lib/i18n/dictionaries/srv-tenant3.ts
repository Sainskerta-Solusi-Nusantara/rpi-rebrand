// Server-action messages for the srvTenant3 namespace.
// Accessed as t.srvTenant3.* inside server actions that use getServerT().
// Keys are grouped per source file.

export const srvTenant3 = {
  id: {
    // lib/tenants/email-template-actions.ts
    emailTemplate: {
      mustBeLoggedIn: 'Anda harus masuk.',
      tenantNotFound: 'Tenant tidak ditemukan.',
      noPermission: 'Anda tidak memiliki izin.',
      invalidData: 'Data tidak valid',
      genericError: 'Terjadi kesalahan. Coba lagi sebentar.',
    },
    // lib/tenants/job-actions.ts
    job: {
      mustBeLoggedIn: 'Anda harus masuk.',
      tenantNotFound: 'Tenant tidak ditemukan.',
      noPermission: 'Anda tidak memiliki izin.',
      invalidJobId: 'ID lowongan tidak valid.',
      jobNotFound: 'Lowongan tidak ditemukan.',
      invalidData: 'Data tidak valid',
      noPublishPermission: 'Anda tidak memiliki izin untuk publikasi.',
      categoryNotFound: 'Kategori tidak ditemukan.',
      invalidStatus: 'Status tidak valid.',
      genericError: 'Terjadi kesalahan. Coba lagi sebentar.',
    },
    // lib/tenants/job-import-actions.ts
    jobImport: {
      mustBeLoggedIn: 'Anda harus masuk.',
      tenantNotFound: 'Tenant tidak ditemukan.',
      noPermission: 'Anda tidak memiliki izin.',
      csvEmpty: 'CSV kosong.',
      requiredColumnMissing: 'Kolom wajib "{col}" tidak ditemukan di baris header.',
      csvNoDataRows: 'CSV tidak memiliki baris data.',
      maxRowsExceeded: 'Maksimum {max} baris per impor. Saat ini: {count}.',
      categoryNotFoundInRow: 'kategori "{slug}" tidak ditemukan',
      noPublishPermissionPreview: 'status: Anda tidak memiliki izin job.publish untuk status PUBLISHED',
      invalidData: 'Data tidak valid',
      categoryNotFoundImport: 'Kategori "{slug}" tidak ditemukan',
      noPublishPermissionImport: 'Tidak ada izin job.publish untuk status PUBLISHED',
      rowSaveError: 'Kesalahan internal saat menyimpan baris',
    },
    // lib/tenants/member-import-actions.ts
    memberImport: {
      mustBeLoggedIn: 'Anda harus masuk.',
      tenantNotFound: 'Tenant tidak ditemukan.',
      noPermission: 'Anda tidak memiliki izin.',
      csvEmpty: 'CSV kosong.',
      requiredColumnMissing: 'Kolom wajib "{col}" tidak ditemukan di baris header.',
      csvNoDataRows: 'CSV tidak memiliki baris data.',
      maxRowsExceeded: 'Maksimum {max} baris per impor. Saat ini: {count}.',
      duplicateEmailPreview: 'Email duplikat di CSV — baris pertama akan diproses',
      alreadyMember: 'Sudah menjadi anggota tenant',
      inviteAlreadyExists: 'Undangan aktif sudah ada',
      invalidData: 'Data tidak valid',
      duplicateEmailImport: 'Email duplikat di CSV',
      inviteSendError: 'Kesalahan internal saat mengirim undangan',
      rowProcessError: 'Kesalahan internal saat memproses baris',
    },
  },
  en: {
    // lib/tenants/email-template-actions.ts
    emailTemplate: {
      mustBeLoggedIn: 'You must be signed in.',
      tenantNotFound: 'Tenant not found.',
      noPermission: 'You do not have permission.',
      invalidData: 'Invalid data',
      genericError: 'An error occurred. Please try again shortly.',
    },
    // lib/tenants/job-actions.ts
    job: {
      mustBeLoggedIn: 'You must be signed in.',
      tenantNotFound: 'Tenant not found.',
      noPermission: 'You do not have permission.',
      invalidJobId: 'Invalid job ID.',
      jobNotFound: 'Job not found.',
      invalidData: 'Invalid data',
      noPublishPermission: 'You do not have permission to publish.',
      categoryNotFound: 'Category not found.',
      invalidStatus: 'Invalid status.',
      genericError: 'An error occurred. Please try again shortly.',
    },
    // lib/tenants/job-import-actions.ts
    jobImport: {
      mustBeLoggedIn: 'You must be signed in.',
      tenantNotFound: 'Tenant not found.',
      noPermission: 'You do not have permission.',
      csvEmpty: 'CSV is empty.',
      requiredColumnMissing: 'Required column "{col}" not found in the header row.',
      csvNoDataRows: 'CSV has no data rows.',
      maxRowsExceeded: 'Maximum {max} rows per import. Current: {count}.',
      categoryNotFoundInRow: 'category "{slug}" not found',
      noPublishPermissionPreview: 'status: You do not have job.publish permission for PUBLISHED status',
      invalidData: 'Invalid data',
      categoryNotFoundImport: 'Category "{slug}" not found',
      noPublishPermissionImport: 'No job.publish permission for PUBLISHED status',
      rowSaveError: 'Internal error while saving row',
    },
    // lib/tenants/member-import-actions.ts
    memberImport: {
      mustBeLoggedIn: 'You must be signed in.',
      tenantNotFound: 'Tenant not found.',
      noPermission: 'You do not have permission.',
      csvEmpty: 'CSV is empty.',
      requiredColumnMissing: 'Required column "{col}" not found in the header row.',
      csvNoDataRows: 'CSV has no data rows.',
      maxRowsExceeded: 'Maximum {max} rows per import. Current: {count}.',
      duplicateEmailPreview: 'Duplicate email in CSV — first row will be processed',
      alreadyMember: 'Already a tenant member',
      inviteAlreadyExists: 'Active invitation already exists',
      invalidData: 'Invalid data',
      duplicateEmailImport: 'Duplicate email in CSV',
      inviteSendError: 'Internal error while sending invitation',
      rowProcessError: 'Internal error while processing row',
    },
  },
} as const
