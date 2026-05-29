/**
 * RFC 4180 CSV serializer. Wraps any field containing comma, quote, CR, LF, or
 * leading/trailing whitespace in double quotes; doubles embedded quotes.
 */
export function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return ''
  const s =
    value instanceof Date
      ? value.toISOString()
      : typeof value === 'object'
        ? JSON.stringify(value)
        : String(value)
  if (/[",\r\n]/.test(s) || /^\s|\s$/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export function csvRow(values: unknown[]): string {
  return values.map(csvEscape).join(',')
}

/** Serializes rows into a single CSV blob with CRLF line endings. */
export function toCsv(headers: string[], rows: unknown[][]): string {
  const out: string[] = [csvRow(headers)]
  for (const r of rows) out.push(csvRow(r))
  return out.join('\r\n') + '\r\n'
}
