export const formsTenantJob = {
  id: {
    jobForm: {
      // Fieldset legends
      legendIdentity: 'Identitas lowongan',
      legendContent: 'Detail konten',
      legendStatus: 'Status publikasi',

      // Identity fieldset labels & placeholders
      titleLabel: 'Judul',
      titlePlaceholder: 'Senior Backend Engineer',
      locationLabel: 'Lokasi',
      locationPlaceholder: 'Jakarta, Indonesia',
      locationTypeLabel: 'Tipe lokasi',
      employmentTypeLabel: 'Tipe pekerjaan',
      experienceLevelLabel: 'Level pengalaman',
      salaryMinLabel: 'Gaji minimum (IDR / bulan)',
      salaryMaxLabel: 'Gaji maksimum (IDR / bulan)',
      salaryPlaceholder: 'Opsional',
      categoryLabel: 'Kategori',
      categoryNone: '— Tidak ada kategori —',
      tagsLabel: 'Skill / tag',
      tagsPlaceholder: 'Ketik skill (mis. react), Enter untuk menambah',
      tagsHint: 'Pilih dari saran atau ketik skill baru. Tekan Enter atau koma untuk menambahkan.',

      // Employment type option labels
      employmentFull: 'Penuh waktu',
      employmentPart: 'Paruh waktu',
      employmentContract: 'Kontrak',
      employmentInternship: 'Magang',
      employmentFreelance: 'Freelance',

      // Experience level option labels
      experienceEntry: 'Entry-level',
      experienceJunior: 'Junior',
      experienceMid: 'Mid-level',
      experienceSenior: 'Senior',
      experienceLead: 'Lead',
      experienceExecutive: 'Executive',

      // Location type option labels
      locationOnsite: 'On-site',
      locationHybrid: 'Hybrid',
      locationRemote: 'Remote',

      // Status option labels
      statusDraft: 'Draft',
      statusPublished: 'Dipublikasikan',
      statusPaused: 'Dijeda',
      statusClosed: 'Ditutup',
      statusArchived: 'Diarsipkan',

      // Status fieldset
      statusLabel: 'Status',
      statusHint: 'Mengubah status menjadi "Dipublikasikan" membutuhkan izin',

      // Content fieldset labels & placeholders
      descriptionLabel: 'Deskripsi',
      descriptionMinHint: '(min 50 karakter)',
      descriptionPlaceholder: 'Ringkasan posisi, peran, dan dampaknya.',
      responsibilitiesLabel: 'Tanggung jawab (opsional)',
      responsibilitiesPlaceholder: '• Memimpin pengembangan layanan inti…',
      requirementsLabel: 'Kualifikasi (opsional)',
      requirementsPlaceholder: '• 5+ tahun pengalaman backend…',
      benefitsLabel: 'Benefit (opsional)',
      benefitsPlaceholder: '• Asuransi kesehatan, stock options…',

      // JD generator
      jdGenerateTitle: 'Buat draft JD berdasarkan judul, level, dan skill',
      jdGeneratePending: 'Membuat draft…',
      jdGenerateButton: 'Generate dari role',
      jdTitleRequired: 'Isi judul terlebih dahulu (minimal 3 karakter).',
      jdPreviewInfo:
        'Draft berhasil dibuat. Tinjau ringkasan di bawah lalu konfirmasi untuk menerapkan (akan menimpa deskripsi, tanggung jawab, kualifikasi, dan benefit).',
      jdPreviewDescription: 'Pratinjau deskripsi',
      jdPreviewResponsibilities: 'Pratinjau tanggung jawab',
      jdApply: 'Terapkan draft',
      jdDiscard: 'Batal',

      // Submit / actions
      submitPending: 'Menyimpan…',
      submitEdit: 'Simpan perubahan',
      submitCreate: 'Buat lowongan',
      cancel: 'Batal',

      // Banners
      bannerSaved: 'Perubahan berhasil disimpan.',
      bannerCreated: 'Lowongan berhasil dibuat.',
    },
  },
  en: {
    jobForm: {
      // Fieldset legends
      legendIdentity: 'Job identity',
      legendContent: 'Content details',
      legendStatus: 'Publication status',

      // Identity fieldset labels & placeholders
      titleLabel: 'Title',
      titlePlaceholder: 'Senior Backend Engineer',
      locationLabel: 'Location',
      locationPlaceholder: 'Jakarta, Indonesia',
      locationTypeLabel: 'Location type',
      employmentTypeLabel: 'Employment type',
      experienceLevelLabel: 'Experience level',
      salaryMinLabel: 'Minimum salary (IDR / month)',
      salaryMaxLabel: 'Maximum salary (IDR / month)',
      salaryPlaceholder: 'Optional',
      categoryLabel: 'Category',
      categoryNone: '— No category —',
      tagsLabel: 'Skill / tag',
      tagsPlaceholder: 'Type a skill (e.g. react), press Enter to add',
      tagsHint: "Choose from suggestions or type a new skill. Press Enter or comma to add.",

      // Employment type option labels
      employmentFull: 'Full-time',
      employmentPart: 'Part-time',
      employmentContract: 'Contract',
      employmentInternship: 'Internship',
      employmentFreelance: 'Freelance',

      // Experience level option labels
      experienceEntry: 'Entry-level',
      experienceJunior: 'Junior',
      experienceMid: 'Mid-level',
      experienceSenior: 'Senior',
      experienceLead: 'Lead',
      experienceExecutive: 'Executive',

      // Location type option labels
      locationOnsite: 'On-site',
      locationHybrid: 'Hybrid',
      locationRemote: 'Remote',

      // Status option labels
      statusDraft: 'Draft',
      statusPublished: 'Published',
      statusPaused: 'Paused',
      statusClosed: 'Closed',
      statusArchived: 'Archived',

      // Status fieldset
      statusLabel: 'Status',
      statusHint: 'Changing the status to "Published" requires the',

      // Content fieldset labels & placeholders
      descriptionLabel: 'Description',
      descriptionMinHint: '(min 50 characters)',
      descriptionPlaceholder: 'Summary of the position, role, and its impact.',
      responsibilitiesLabel: 'Responsibilities (optional)',
      responsibilitiesPlaceholder: '• Lead development of core services…',
      requirementsLabel: 'Qualifications (optional)',
      requirementsPlaceholder: '• 5+ years of backend experience…',
      benefitsLabel: 'Benefits (optional)',
      benefitsPlaceholder: '• Health insurance, stock options…',

      // JD generator
      jdGenerateTitle: 'Generate a JD draft from the title, level, and skills',
      jdGeneratePending: 'Generating draft…',
      jdGenerateButton: 'Generate from role',
      jdTitleRequired: 'Enter a title first (minimum 3 characters).',
      jdPreviewInfo:
        'Draft generated. Review the summary below, then confirm to apply (this will overwrite the description, responsibilities, qualifications, and benefits).',
      jdPreviewDescription: 'Description preview',
      jdPreviewResponsibilities: 'Responsibilities preview',
      jdApply: 'Apply draft',
      jdDiscard: 'Discard',

      // Submit / actions
      submitPending: 'Saving…',
      submitEdit: 'Save changes',
      submitCreate: 'Create job',
      cancel: 'Cancel',

      // Banners
      bannerSaved: 'Changes saved successfully.',
      bannerCreated: 'Job listing created successfully.',
    },
  },
} as const
