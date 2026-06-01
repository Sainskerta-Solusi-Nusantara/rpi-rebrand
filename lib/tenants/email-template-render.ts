/**
 * Pure template-rendering helper shared by both the server-side resolver
 * (`email-template-resolver.ts`) and client-side preview UI
 * (`tenant-email-template-form.tsx`).
 *
 * Kept in its own file with NO `'server-only'` import so client components can
 * import it without the production build failing.
 */

/**
 * Replace `{{varName}}` tokens in `template` with values from `vars`.
 *
 * Unknown variables are left as-is in the output (so users can spot typos
 * like `{{Name}}` literally in the sent email and fix their template).
 * Null/undefined values are coerced to empty string. No HTML escaping is
 * performed — see `email-template-resolver.ts` header for rationale.
 */
export function renderTemplate(
  template: string,
  vars: Record<string, string | null | undefined>,
): string {
  if (!template) return ''
  return template.replace(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g, (match, name: string) => {
    if (!Object.prototype.hasOwnProperty.call(vars, name)) return match
    const v = vars[name]
    return v == null ? '' : String(v)
  })
}
