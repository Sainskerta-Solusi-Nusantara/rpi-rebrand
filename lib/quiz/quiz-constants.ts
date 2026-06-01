/**
 * Constants and result types shared by quiz server actions and client UI.
 *
 * Kept out of `quiz-actions.ts` because that file is a `'use server'` module,
 * which Next.js restricts to async function exports only.
 */

export const MAX_ATTEMPTS_PER_QUIZ = 5

export type StartAttemptResult =
  | { ok: true; attemptId: string }
  | { ok: false; error: string }

export type SubmitAttemptResult =
  | {
      ok: true
      score: number
      passed: boolean
      certificateIssued: boolean
      certificateId?: string
      certificateNumber?: string
    }
  | { ok: false; error: string }
