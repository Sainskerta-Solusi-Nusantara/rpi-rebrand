export const formsFeatureFlag = {
  id: {
    flagForm: {
      // field labels
      keyLabel: 'Key',
      nameLabel: 'Nama',
      descriptionLabel: 'Deskripsi',
      typeLabel: 'Tipe',
      percentageLabel: 'Persentase rollout: {pct}%',
      segmentRulesLabel: 'Aturan segment (AND)',
      environmentsLabel: 'Lingkungan',
      // type options
      typeBoolean: 'Boolean (semua-atau-tidak)',
      typePercentage: 'Persentase (rollout bertahap)',
      typeSegment: 'Segment (target spesifik)',
      // helper text
      keyHelperText: 'Huruf kecil, angka, tanda - atau _. Mulai dengan huruf. Maks 60 karakter.',
      percentageHelperText: '0% berarti tidak ada yang mendapat; 100% berarti semua mendapat.',
      environmentsHelperText: 'Lingkungan yang tidak dicentang akan dikembalikan false oleh evaluator.',
      // segment rule placeholders
      attrPlaceholder: 'atribut (mis. tenantId)',
      valuesPlaceholder: 'nilai (pisahkan dengan koma)',
      // segment rule buttons
      btnRemoveRule: 'Hapus',
      btnAddRule: 'Tambah aturan',
      // submit area
      btnSubmitPending: 'Menyimpan…',
      btnCreate: 'Buat flag',
      btnSave: 'Simpan perubahan',
      btnCancel: 'Batal',
    },
    overridesTable: {
      // add override form
      formHeading: 'Tambah override',
      formAriaLabel: 'Tambah override',
      scopeLabel: 'Scope',
      scopeUser: 'Override pengguna',
      scopeTenant: 'Override tenant',
      scopeBoth: 'Pengguna + tenant',
      userIdLabel: 'userId',
      tenantIdLabel: 'tenantId',
      userIdPlaceholderDisabled: '(tidak dipakai)',
      userIdPlaceholderActive: 'cuid pengguna',
      tenantIdPlaceholderDisabled: '(tidak dipakai)',
      tenantIdPlaceholderActive: 'cuid tenant',
      valueCheckboxLabel: 'Nilai = true (Aktif)',
      reasonPlaceholder: 'Alasan (opsional)',
      successMsg: 'Override tersimpan.',
      btnSubmitPending: 'Menyimpan…',
      btnSubmit: 'Tambah override',
      // overrides table columns
      colScope: 'Scope',
      colUser: 'Pengguna',
      colTenant: 'Tenant',
      colValue: 'Nilai',
      colReason: 'Alasan',
      colCreated: 'Dibuat',
      colActions: 'Aksi',
      // scope display labels
      scopeDisplayBoth: 'Pengguna + tenant',
      scopeDisplayUser: 'Pengguna',
      scopeDisplayTenant: 'Tenant',
      // value badges
      valueActive: 'Aktif',
      valueInactive: 'Nonaktif',
      // empty state
      emptyState: 'Belum ada override.',
      // remove override button
      btnRemovePending: 'Menghapus…',
      btnRemove: 'Hapus override',
      confirmRemove: 'Hapus override ini?',
    },
  },
  en: {
    flagForm: {
      // field labels
      keyLabel: 'Key',
      nameLabel: 'Name',
      descriptionLabel: 'Description',
      typeLabel: 'Type',
      percentageLabel: 'Rollout percentage: {pct}%',
      segmentRulesLabel: 'Segment rules (AND)',
      environmentsLabel: 'Environments',
      // type options
      typeBoolean: 'Boolean (all-or-nothing)',
      typePercentage: 'Percentage (gradual rollout)',
      typeSegment: 'Segment (specific targets)',
      // helper text
      keyHelperText: 'Lowercase letters, digits, - or _. Must start with a letter. Max 60 characters.',
      percentageHelperText: "0% means nobody gets it; 100% means everyone gets it.",
      environmentsHelperText: 'Unchecked environments will return false from the evaluator.',
      // segment rule placeholders
      attrPlaceholder: 'attribute (e.g. tenantId)',
      valuesPlaceholder: 'values (comma-separated)',
      // segment rule buttons
      btnRemoveRule: 'Remove',
      btnAddRule: 'Add rule',
      // submit area
      btnSubmitPending: 'Saving…',
      btnCreate: 'Create flag',
      btnSave: 'Save changes',
      btnCancel: 'Cancel',
    },
    overridesTable: {
      // add override form
      formHeading: 'Add override',
      formAriaLabel: 'Add override',
      scopeLabel: 'Scope',
      scopeUser: 'User override',
      scopeTenant: 'Tenant override',
      scopeBoth: 'User + tenant',
      userIdLabel: 'userId',
      tenantIdLabel: 'tenantId',
      userIdPlaceholderDisabled: '(not used)',
      userIdPlaceholderActive: 'user cuid',
      tenantIdPlaceholderDisabled: '(not used)',
      tenantIdPlaceholderActive: 'tenant cuid',
      valueCheckboxLabel: 'Value = true (Active)',
      reasonPlaceholder: 'Reason (optional)',
      successMsg: 'Override saved.',
      btnSubmitPending: 'Saving…',
      btnSubmit: 'Add override',
      // overrides table columns
      colScope: 'Scope',
      colUser: 'User',
      colTenant: 'Tenant',
      colValue: 'Value',
      colReason: 'Reason',
      colCreated: 'Created',
      colActions: 'Actions',
      // scope display labels
      scopeDisplayBoth: 'User + tenant',
      scopeDisplayUser: 'User',
      scopeDisplayTenant: 'Tenant',
      // value badges
      valueActive: 'Active',
      valueInactive: 'Inactive',
      // empty state
      emptyState: 'No overrides yet.',
      // remove override button
      btnRemovePending: 'Removing…',
      btnRemove: 'Remove override',
      confirmRemove: 'Remove this override?',
    },
  },
} as const
