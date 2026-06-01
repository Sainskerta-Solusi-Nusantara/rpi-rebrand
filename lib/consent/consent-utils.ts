import type { ConsentPrefs, CookieCategoryKey } from './cookie-categories'

/**
 * Tiny helper used by client-side script-loader gates and by UI components
 * to ask "is this category opted-in?" without re-implementing falsy checks.
 *
 * Pass `null`/`undefined` prefs (= no decision yet) → returns false for
 * everything except `necessary` (which is always allowed by definition).
 */
export function isCategoryAllowed(
  category: CookieCategoryKey,
  prefs: ConsentPrefs | null | undefined,
): boolean {
  if (category === 'necessary') return true
  if (!prefs) return false
  return Boolean(prefs[category])
}
