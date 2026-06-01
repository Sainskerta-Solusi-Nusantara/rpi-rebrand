/**
 * Default interview stage names used as starter pipeline when no custom
 * stages have been defined for a tenant. Kept here instead of
 * `interview-stage-actions.ts` because that file is `'use server'` and
 * Next.js restricts those modules to async function exports only.
 */

export const DEFAULT_STAGE_NAMES = [
  'Screening',
  'Technical',
  'Behavioral',
  'HR / Cultural Fit',
  'Final',
] as const
