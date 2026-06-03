// Locale-aware Zod error map + a parse helper for server actions.
//
// Schemas drop their inline Indonesian messages so this map governs the text:
//   - built-in validators (min/max/email/url/regex/enum/type) → generic
//     localized templates from `t.zodErrors.*`.
//   - `.refine`/`.superRefine`/custom rules attach a key via
//     `params: { i18n: '<key>' }` (no inline message); resolved from
//     `t.zodErrors.custom[key]`.
//
// Usage in a 'use server' action: `const parsed = await localizedParse(schema, data)`.
// The map is passed per-parse (NOT z.setErrorMap, which is process-global and
// not request/locale safe).

import { z } from 'zod'
import { getServerT } from './server-dictionary'
import type { Dictionary } from './dictionary'

export function makeZodErrorMap(t: Dictionary): z.ZodErrorMap {
  const m = t.zodErrors
  const custom = m.custom as Record<string, string>

  return (issue, ctx) => {
    switch (issue.code) {
      case z.ZodIssueCode.invalid_type: {
        if (issue.received === 'undefined' || issue.received === 'null') {
          return { message: m.required }
        }
        return { message: m.invalidType }
      }
      case z.ZodIssueCode.too_small: {
        const min = String(issue.minimum)
        if (issue.type === 'string') {
          // A required string (.min(1)) reads better as "Required" than
          // "At least 1 characters".
          if (Number(issue.minimum) === 1) return { message: m.required }
          return { message: m.tooSmallString.replace('{min}', min) }
        }
        if (issue.type === 'array' || issue.type === 'set')
          return { message: m.tooSmallArray.replace('{min}', min) }
        if (issue.type === 'date') return { message: m.tooSmallDate }
        return { message: m.tooSmallNumber.replace('{min}', min) }
      }
      case z.ZodIssueCode.too_big: {
        const max = String(issue.maximum)
        if (issue.type === 'string') return { message: m.tooBigString.replace('{max}', max) }
        if (issue.type === 'array' || issue.type === 'set')
          return { message: m.tooBigArray.replace('{max}', max) }
        if (issue.type === 'date') return { message: m.tooBigDate }
        return { message: m.tooBigNumber.replace('{max}', max) }
      }
      case z.ZodIssueCode.invalid_string: {
        if (issue.validation === 'email') return { message: m.invalidEmail }
        if (issue.validation === 'url') return { message: m.invalidUrl }
        return { message: m.invalidString }
      }
      case z.ZodIssueCode.invalid_enum_value:
      case z.ZodIssueCode.invalid_union:
        return { message: m.invalidEnum }
      case z.ZodIssueCode.invalid_date:
        return { message: m.invalidDate }
      case z.ZodIssueCode.custom: {
        const key = (issue.params as { i18n?: string } | undefined)?.i18n
        if (key && custom[key]) return { message: custom[key] }
        return { message: issue.message ?? ctx.defaultError }
      }
      default:
        return { message: ctx.defaultError }
    }
  }
}

/**
 * safeParse with the request's locale-aware Zod error map. Drop-in replacement
 * for `schema.safeParse(data)` inside server actions.
 */
export async function localizedParse<S extends z.ZodTypeAny>(
  schema: S,
  data: unknown,
): Promise<z.SafeParseReturnType<z.input<S>, z.output<S>>> {
  const t = await getServerT()
  return schema.safeParse(data, { errorMap: makeZodErrorMap(t) })
}
