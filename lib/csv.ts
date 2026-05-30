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

/**
 * RFC 4180-style CSV parser. Handles:
 *  - Quoted fields ("foo,bar") with embedded commas, CR, LF.
 *  - Doubled quotes inside quoted fields ("She said ""hi""") → literal `"`.
 *  - Unquoted fields read as-is until the next `,` or row terminator.
 *  - CRLF, LF, or CR row terminators.
 *
 * Totally empty rows (a blank line with zero fields) are skipped. A row that
 * contains a single empty field (e.g. `,`) is preserved.
 *
 * Returns an array of rows, each row an array of string field values.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let field = ''
  let row: string[] = []
  let inQuotes = false
  let i = 0
  const n = text.length

  // Strip UTF-8 BOM if present.
  if (n > 0 && text.charCodeAt(0) === 0xfeff) {
    i = 1
  }

  const pushField = () => {
    row.push(field)
    field = ''
  }
  const pushRow = () => {
    // Skip rows that are completely empty (one empty field and nothing else,
    // which is how a stray blank line gets parsed).
    if (row.length === 1 && row[0] === '') {
      row = []
      return
    }
    rows.push(row)
    row = []
  }

  while (i < n) {
    const ch = text[i]

    if (inQuotes) {
      if (ch === '"') {
        // Escaped quote inside a quoted field?
        if (i + 1 < n && text[i + 1] === '"') {
          field += '"'
          i += 2
          continue
        }
        // Closing quote.
        inQuotes = false
        i += 1
        continue
      }
      field += ch
      i += 1
      continue
    }

    // Not in quotes.
    if (ch === '"') {
      inQuotes = true
      i += 1
      continue
    }
    if (ch === ',') {
      pushField()
      i += 1
      continue
    }
    if (ch === '\r') {
      pushField()
      pushRow()
      // Consume CRLF as a single terminator.
      if (i + 1 < n && text[i + 1] === '\n') {
        i += 2
      } else {
        i += 1
      }
      continue
    }
    if (ch === '\n') {
      pushField()
      pushRow()
      i += 1
      continue
    }
    field += ch
    i += 1
  }

  // Flush trailing field / row (file may not end with a newline).
  if (inQuotes || field.length > 0 || row.length > 0) {
    pushField()
    pushRow()
  }

  return rows
}
