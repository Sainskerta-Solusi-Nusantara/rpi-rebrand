/**
 * Tenant email-template resolver.
 *
 * Pure helpers used by the candidate-notification email-send path in
 * `lib/tenants/application-actions.ts`. When a tenant has a row in
 * `TenantEmailTemplate` for a given status (and `enabled = true`), we use
 * THAT instead of the hard-coded default in `applicationStatusEmail`.
 *
 * Variable replacement happens at send time via `renderTemplate`. Supported
 * placeholders:
 *   {{name}}            — candidate display name (may be empty)
 *   {{jobTitle}}        — job title
 *   {{tenantName}}      — tenant display name
 *   {{oldStatus}}       — previous ApplicationStatus
 *   {{newStatus}}       — new ApplicationStatus
 *   {{applicationUrl}}  — link for the candidate to view the application
 *   {{recruiterNote}}   — optional free-text note from Application.notes
 *
 * HTML escaping decision: we DO NOT HTML-escape variable values when
 * rendering. The body is plain-text / markdown-light. The mailer wraps the
 * rendered body inside a minimal HTML shell (with `white-space: pre-wrap`
 * styling). Tenants own their template content; if they want to embed user
 * input safely they should review the variables they reference. This mirrors
 * how the existing default templates handle variables (e.g. `${opts.jobTitle}`
 * is interpolated directly into the HTML in `applicationStatusEmail`).
 */

import 'server-only'
import { cache } from 'react'
import { prisma } from '@/lib/db'

export type ResolvedTemplate = {
  subject: string
  body: string
}

/**
 * Look up the custom override for (tenantId, status) when enabled. Returns
 * `null` when the tenant has no enabled custom template — the caller should
 * fall back to the default `applicationStatusEmail` path.
 *
 * Cached per-request via `React.cache` so a render that fans out to multiple
 * resolvers (e.g. an admin preview) only hits the DB once per (tenant,status)
 * tuple.
 */
export const resolveEmailTemplate = cache(
  async (args: {
    tenantId: string
    status: string
  }): Promise<ResolvedTemplate | null> => {
    if (!args.tenantId || !args.status) return null
    const row = await prisma.tenantEmailTemplate
      .findUnique({
        where: { tenantId_status: { tenantId: args.tenantId, status: args.status } },
        select: { subject: true, body: true, enabled: true },
      })
      .catch(() => null)
    if (!row || !row.enabled) return null
    return { subject: row.subject, body: row.body }
  },
)

/**
 * Replace `{{varName}}` tokens in `template` with values from `vars`.
 *
 * Unknown variables are left as-is in the output (so users can spot typos
 * like `{{Name}}` literally in the sent email and fix their template).
 * Null/undefined values are coerced to empty string. No HTML escaping is
 * performed — see the file header for rationale.
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
