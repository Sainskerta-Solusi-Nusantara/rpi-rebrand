/**
 * Onboarding wizard configuration.
 *
 * Pure config module — no DB, no React. Imported from both server and client
 * components. The schema lives in `lib/onboarding/checklist.ts` for the
 * dashboard checklist widget; this module powers the FULL multi-step wizard
 * at `/welcome/[step]`.
 *
 * Step indices are stable identifiers persisted to `User.onboardingStep`.
 * Append new steps to the end of WIZARD_STEPS; do NOT renumber existing
 * indices, otherwise users mid-flow will jump to a different screen.
 */

export type WizardStepId =
  | 'welcome'
  | 'verify-email'
  | 'profile'
  | 'resume'
  | 'interests'
  | 'explore'

export type WizardUserData = {
  emailVerified: Date | null
  name: string | null
  headline: string | null
  bio: string | null
  location: string | null
  hasResume?: boolean
}

export type WizardStep = {
  id: WizardStepId
  index: number
  title: string
  description: string
  route: string
  /** Whether this step can be considered complete given current user data. */
  checkCompleted: (user: WizardUserData) => boolean
  /** When true the step is auto-skipped if already completed (e.g. verified email). */
  autoSkip?: boolean
}

export const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'welcome',
    index: 0,
    title: 'Selamat datang',
    description: 'Kenali SSN dan mulai perjalanan karier Anda.',
    route: '/welcome/0',
    checkCompleted: () => false,
  },
  {
    id: 'verify-email',
    index: 1,
    title: 'Verifikasi email',
    description: 'Konfirmasi alamat email agar akun Anda lebih aman.',
    route: '/welcome/1',
    checkCompleted: (u) => u.emailVerified != null,
    autoSkip: true,
  },
  {
    id: 'profile',
    index: 2,
    title: 'Lengkapi profil',
    description: 'Tambahkan nama, headline, lokasi, dan bio singkat.',
    route: '/welcome/2',
    checkCompleted: (u) =>
      Boolean(u.name) &&
      Boolean(u.headline || u.bio || u.location),
  },
  {
    id: 'resume',
    index: 3,
    title: 'Resume',
    description: 'Unggah CV atau buat resume baru dengan builder.',
    route: '/welcome/3',
    checkCompleted: (u) => Boolean(u.hasResume),
  },
  {
    id: 'interests',
    index: 4,
    title: 'Minat karier',
    description: 'Pilih 3-5 topik atau kategori pekerjaan favorit Anda.',
    route: '/welcome/4',
    checkCompleted: () => false,
  },
  {
    id: 'explore',
    index: 5,
    title: 'Mulai jelajah',
    description: 'Temukan lowongan, kursus, dan dashboard Anda.',
    route: '/welcome/5',
    checkCompleted: () => false,
  },
]

export const TOTAL_WIZARD_STEPS = WIZARD_STEPS.length

/** Maximum valid step index a user may be on (0..5). */
export const MAX_WIZARD_STEP_INDEX = WIZARD_STEPS.length - 1

/**
 * Given a user's saved progress, returns the route the user should land on
 * next. Auto-skips steps marked `autoSkip` whose `checkCompleted` is true so
 * verified users don't see the email step again.
 */
export function nextStepFor(user: WizardUserData, currentStep = 0): string {
  for (let i = currentStep; i < WIZARD_STEPS.length; i++) {
    const step = WIZARD_STEPS[i]
    if (!step) continue
    if (step.autoSkip && step.checkCompleted(user)) continue
    return step.route
  }
  return '/dashboard'
}

/** Curated subset of `lib/skills/taxonomy` slugs surfaced as interest chips. */
export const INTEREST_CHIPS: ReadonlyArray<{ slug: string; label: string }> = [
  { slug: 'frontend', label: 'Frontend' },
  { slug: 'backend', label: 'Backend' },
  { slug: 'mobile', label: 'Mobile' },
  { slug: 'devops', label: 'DevOps' },
  { slug: 'data-science', label: 'Data Science' },
  { slug: 'machine-learning', label: 'Machine Learning' },
  { slug: 'product-management', label: 'Product Management' },
  { slug: 'ui-ux-design', label: 'UI/UX Design' },
  { slug: 'qa', label: 'Quality Assurance' },
  { slug: 'cybersecurity', label: 'Cybersecurity' },
  { slug: 'cloud', label: 'Cloud' },
  { slug: 'blockchain', label: 'Blockchain' },
  { slug: 'marketing', label: 'Marketing' },
  { slug: 'sales', label: 'Sales' },
  { slug: 'finance', label: 'Finance' },
  { slug: 'hr', label: 'Human Resources' },
  { slug: 'operations', label: 'Operations' },
  { slug: 'content', label: 'Content' },
]

/** Storage key for client-side interest selections (no DB column exists). */
export const INTERESTS_STORAGE_KEY = 'rpi_onboarding_interests'
