export const formsEditor = {
  id: {
    loading: 'Memuat asesmen…',
    notFound: 'Asesmen tidak ditemukan.',

    settings: {
      heading: 'Pengaturan asesmen',
      currentStatus: 'Status saat ini:',
      publish: 'Publikasikan',
      unpublish: 'Tarik ke draf',
      archive: 'Arsipkan',
      titleLabel: 'Judul',
      descriptionLabel: 'Deskripsi',
      categoryLabel: 'Kategori',
      durationLabel: 'Durasi (menit)',
      passingScoreLabel: 'Skor lulus (0–100)',
      saveButton: 'Simpan pengaturan',
    },

    status: {
      DRAFT: 'Draf',
      PUBLISHED: 'Terbit',
      ARCHIVED: 'Arsip',
    },

    category: {
      technical: 'Teknis',
      soft: 'Soft skill',
      language: 'Bahasa',
      cognitive: 'Kognitif',
    },

    questionType: {
      multiple_choice: 'Pilihan ganda',
      true_false: 'Benar/Salah',
      multi_select: 'Pilihan jamak',
    },

    questions: {
      heading: 'Pertanyaan ({count})',
      addButton: 'Tambah pertanyaan',
      empty: 'Belum ada pertanyaan. Tambahkan satu untuk memulai.',
      editButton: 'Ubah',
      deleteButton: 'Hapus',
    },

    questionForm: {
      titleNew: 'Pertanyaan baru',
      titleEdit: 'Ubah pertanyaan',
      typeLabel: 'Tipe pertanyaan',
      textLabel: 'Pertanyaan',
      textPlaceholder: 'Tulis pertanyaan Anda…',
      choicesLabel: 'Pilihan',
      choicePlaceholder: 'Pilihan {n}',
      addChoice: 'Tambah pilihan',
      saveNew: 'Tambah pertanyaan',
      saveEdit: 'Simpan perubahan',
      saving: 'Menyimpan…',
      cancel: 'Batal',
      hintMultipleChoice: 'Tepat 1 jawaban benar.',
      hintTrueFalse: 'Tepat 2 pilihan dengan 1 jawaban benar.',
      hintMultiSelect: 'Minimal 1 jawaban benar; pengguna harus memilih semua jawaban benar.',
      trueFalseTrue: 'Benar',
      trueFalseFalse: 'Salah',
    },

    messages: {
      settingsSaved: 'Pengaturan disimpan.',
      published: 'Asesmen telah dipublikasikan.',
      archived: 'Asesmen diarsipkan.',
      unpublished: 'Asesmen dikembalikan ke draf.',
      confirmArchive: 'Arsipkan asesmen ini? Kandidat tidak akan dapat memulai percobaan baru.',
      confirmDeleteQuestion: 'Hapus pertanyaan ini?',
      errorDuration: 'Durasi harus antara 1–600 menit.',
      errorPassingScore: 'Skor lulus harus antara 0–100.',
      errorQuestionMinLength: 'Teks pertanyaan minimal 3 karakter.',
      errorChoiceEmpty: 'Setiap pilihan harus memiliki teks.',
    },
  },

  en: {
    loading: 'Loading assessment…',
    notFound: 'Assessment not found.',

    settings: {
      heading: 'Assessment settings',
      currentStatus: 'Current status:',
      publish: 'Publish',
      unpublish: 'Revert to draft',
      archive: 'Archive',
      titleLabel: 'Title',
      descriptionLabel: 'Description',
      categoryLabel: 'Category',
      durationLabel: 'Duration (minutes)',
      passingScoreLabel: 'Passing score (0–100)',
      saveButton: 'Save settings',
    },

    status: {
      DRAFT: 'Draft',
      PUBLISHED: 'Published',
      ARCHIVED: 'Archived',
    },

    category: {
      technical: 'Technical',
      soft: 'Soft skill',
      language: 'Language',
      cognitive: 'Cognitive',
    },

    questionType: {
      multiple_choice: 'Multiple choice',
      true_false: 'True/False',
      multi_select: 'Multi-select',
    },

    questions: {
      heading: 'Questions ({count})',
      addButton: 'Add question',
      empty: 'No questions yet. Add one to get started.',
      editButton: 'Edit',
      deleteButton: 'Delete',
    },

    questionForm: {
      titleNew: 'New question',
      titleEdit: 'Edit question',
      typeLabel: 'Question type',
      textLabel: 'Question',
      textPlaceholder: 'Write your question…',
      choicesLabel: 'Choices',
      choicePlaceholder: 'Choice {n}',
      addChoice: 'Add choice',
      saveNew: 'Add question',
      saveEdit: 'Save changes',
      saving: 'Saving…',
      cancel: 'Cancel',
      hintMultipleChoice: 'Exactly 1 correct answer.',
      hintTrueFalse: 'Exactly 2 choices with 1 correct answer.',
      hintMultiSelect: 'At least 1 correct answer; users must select all correct answers.',
      trueFalseTrue: 'True',
      trueFalseFalse: 'False',
    },

    messages: {
      settingsSaved: 'Settings saved.',
      published: 'Assessment has been published.',
      archived: 'Assessment archived.',
      unpublished: 'Assessment reverted to draft.',
      confirmArchive: 'Archive this assessment? Candidates will not be able to start new attempts.',
      confirmDeleteQuestion: 'Delete this question?',
      errorDuration: 'Duration must be between 1–600 minutes.',
      errorPassingScore: 'Passing score must be between 0–100.',
      errorQuestionMinLength: 'Question text must be at least 3 characters.',
      errorChoiceEmpty: 'Every choice must have text.',
    },
  },
} as const
