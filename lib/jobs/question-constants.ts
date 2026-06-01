/**
 * Constants and types for job application custom questions.
 *
 * Kept out of `question-actions.ts` because that file is `'use server'`,
 * which Next.js restricts to async function exports only.
 */

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; field?: string }

export const JOB_QUESTION_TYPES = [
  'short_text',
  'long_text',
  'single_choice',
  'multi_choice',
  'file_url',
  'yes_no',
] as const
export type JobQuestionType = (typeof JOB_QUESTION_TYPES)[number]

export const CHOICE_TYPES: ReadonlyArray<JobQuestionType> = [
  'single_choice',
  'multi_choice',
]
