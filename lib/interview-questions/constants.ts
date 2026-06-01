/**
 * Constants and result types shared by interview-question server actions and UI.
 *
 * Kept out of `actions.ts` because that file is `'use server'`, which Next.js
 * restricts to async function exports only.
 */

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; field?: string }

/**
 * Allowed question categories. Indonesian copy is rendered in the UI but the
 * stored value is the canonical English slug so server-side filters stay
 * stable across locales.
 */
export const QUESTION_CATEGORIES = [
  'technical',
  'behavioral',
  'situational',
  'culture',
  'other',
] as const
export type QuestionCategory = (typeof QUESTION_CATEGORIES)[number]
