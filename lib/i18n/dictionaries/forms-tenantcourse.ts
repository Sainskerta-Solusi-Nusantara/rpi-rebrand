export const formsTenantCourse = {
  id: {
    courseForm: {
      // fieldset legends
      legendIdentity: 'Identitas kursus',
      legendDescription: 'Deskripsi',
      legendPublication: 'Status publikasi',
      // labels
      titleLabel: 'Judul',
      levelLabel: 'Level',
      durationLabel: 'Durasi (jam)',
      instructorLabel: 'Instruktur',
      thumbnailLabel: 'URL thumbnail (opsional)',
      descriptionLabel: 'Deskripsi',
      descriptionHint: '(min 50 karakter)',
      statusLabel: 'Status',
      statusHelperText:
        'Mengubah status menjadi "Dipublikasikan" akan mengisi tanggal publikasi otomatis.',
      // placeholders
      titlePlaceholder: 'Membangun Aplikasi Next.js untuk Pemula',
      descriptionPlaceholder: 'Apa yang akan dipelajari peserta dalam kursus ini…',
      // select options
      instructorUnassigned: '— Belum ditentukan —',
      // level labels
      levelBeginner: 'Pemula',
      levelIntermediate: 'Menengah',
      levelAdvanced: 'Lanjutan',
      // status labels
      statusDraft: 'Draft',
      statusPublished: 'Dipublikasikan',
      statusArchived: 'Diarsipkan',
      // buttons
      btnSaving: 'Menyimpan…',
      btnSaveChanges: 'Simpan perubahan',
      btnCreate: 'Buat kursus',
      btnCancel: 'Batal',
      // banners
      bannerCreated: 'Kursus berhasil dibuat.',
      bannerUpdated: 'Perubahan berhasil disimpan.',
    },
    curriculumEditor: {
      // heading
      heading: 'Kurikulum',
      // module actions
      btnAddModule: 'Tambah modul',
      btnSaveModule: 'Simpan modul',
      btnSaving: 'Menyimpan…',
      btnSave: 'Simpan',
      btnCancel: 'Batal',
      btnEdit: 'Ubah',
      btnDelete: 'Hapus',
      // module labels
      moduleTitleLabel: 'Judul modul',
      moduleTitlePlaceholder: 'Pengantar Next.js',
      moduleCounter: 'Modul {n}',
      lessonCount: '{count} pelajaran',
      // aria labels
      ariaLabelMoveUp: 'Pindahkan ke atas',
      ariaLabelMoveDown: 'Pindahkan ke bawah',
      // empty states
      emptyModules: 'Belum ada modul. Tambahkan modul pertama untuk memulai.',
      emptyLessons: 'Belum ada pelajaran di modul ini.',
      // confirm dialogs
      confirmDeleteModule: 'Hapus modul "{title}"? Semua pelajaran di dalamnya akan ikut terhapus.',
      confirmDeleteLesson: 'Hapus pelajaran "{title}"?',
      // validation errors
      errorModuleTitleEmpty: 'Judul modul tidak boleh kosong.',
      errorOrderNotNumber: 'Urutan harus berupa angka.',
      errorDurationNotNumber: 'Durasi harus berupa angka.',
      // lesson form
      lessonFormTitleNew: 'Pelajaran baru',
      lessonFormTitleEdit: 'Ubah pelajaran',
      lessonTitleLabel: 'Judul',
      lessonTitlePlaceholder: 'Pengenalan App Router',
      lessonContentTypeLabel: 'Tipe konten',
      lessonOrderLabel: 'Urutan',
      lessonDurationLabel: 'Durasi (menit)',
      lessonUrlLabel: 'URL konten (opsional)',
      lessonBodyLabel: 'Isi konten (opsional)',
      lessonBodyPlaceholder: 'Catatan, transkrip, atau ringkasan…',
      // lesson buttons
      btnAddLesson: 'Tambah pelajaran',
      btnSaveLesson: 'Tambah pelajaran',
      btnSaveLessonChanges: 'Simpan perubahan',
      // lesson meta
      lessonMeta: '{dur} menit · urutan #{ord}',
      // content type labels
      contentTypeVideo: 'Video',
      contentTypeArticle: 'Artikel',
      contentTypeQuiz: 'Kuis',
      contentTypeAssignment: 'Tugas',
      contentTypeDownload: 'Unduhan',
    },
  },
  en: {
    courseForm: {
      // fieldset legends
      legendIdentity: 'Course identity',
      legendDescription: 'Description',
      legendPublication: 'Publication status',
      // labels
      titleLabel: 'Title',
      levelLabel: 'Level',
      durationLabel: 'Duration (hours)',
      instructorLabel: 'Instructor',
      thumbnailLabel: 'Thumbnail URL (optional)',
      descriptionLabel: 'Description',
      descriptionHint: '(min 50 characters)',
      statusLabel: 'Status',
      statusHelperText:
        'Changing status to "Published" will automatically fill in the publication date.',
      // placeholders
      titlePlaceholder: 'Building a Next.js Application for Beginners',
      descriptionPlaceholder: "What will participants learn in this course…",
      // select options
      instructorUnassigned: '— Not assigned —',
      // level labels
      levelBeginner: 'Beginner',
      levelIntermediate: 'Intermediate',
      levelAdvanced: 'Advanced',
      // status labels
      statusDraft: 'Draft',
      statusPublished: 'Published',
      statusArchived: 'Archived',
      // buttons
      btnSaving: 'Saving…',
      btnSaveChanges: 'Save changes',
      btnCreate: 'Create course',
      btnCancel: 'Cancel',
      // banners
      bannerCreated: 'Course created successfully.',
      bannerUpdated: 'Changes saved successfully.',
    },
    curriculumEditor: {
      // heading
      heading: 'Curriculum',
      // module actions
      btnAddModule: 'Add module',
      btnSaveModule: 'Save module',
      btnSaving: 'Saving…',
      btnSave: 'Save',
      btnCancel: 'Cancel',
      btnEdit: 'Edit',
      btnDelete: 'Delete',
      // module labels
      moduleTitleLabel: 'Module title',
      moduleTitlePlaceholder: 'Introduction to Next.js',
      moduleCounter: 'Module {n}',
      lessonCount: '{count} lessons',
      // aria labels
      ariaLabelMoveUp: 'Move up',
      ariaLabelMoveDown: 'Move down',
      // empty states
      emptyModules: 'No modules yet. Add the first module to get started.',
      emptyLessons: 'No lessons in this module yet.',
      // confirm dialogs
      confirmDeleteModule: 'Delete module "{title}"? All lessons inside will also be deleted.',
      confirmDeleteLesson: 'Delete lesson "{title}"?',
      // validation errors
      errorModuleTitleEmpty: 'Module title cannot be empty.',
      errorOrderNotNumber: 'Order must be a number.',
      errorDurationNotNumber: 'Duration must be a number.',
      // lesson form
      lessonFormTitleNew: 'New lesson',
      lessonFormTitleEdit: 'Edit lesson',
      lessonTitleLabel: 'Title',
      lessonTitlePlaceholder: 'Introduction to App Router',
      lessonContentTypeLabel: 'Content type',
      lessonOrderLabel: 'Order',
      lessonDurationLabel: 'Duration (minutes)',
      lessonUrlLabel: 'Content URL (optional)',
      lessonBodyLabel: 'Content body (optional)',
      lessonBodyPlaceholder: 'Notes, transcript, or summary…',
      // lesson buttons
      btnAddLesson: 'Add lesson',
      btnSaveLesson: 'Add lesson',
      btnSaveLessonChanges: 'Save changes',
      // lesson meta
      lessonMeta: '{dur} min · order #{ord}',
      // content type labels
      contentTypeVideo: 'Video',
      contentTypeArticle: 'Article',
      contentTypeQuiz: 'Quiz',
      contentTypeAssignment: 'Assignment',
      contentTypeDownload: 'Download',
    },
  },
} as const
