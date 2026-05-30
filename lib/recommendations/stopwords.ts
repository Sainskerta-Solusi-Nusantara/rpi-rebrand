/**
 * Small Indonesian + English stopword list used by the job-recommendation
 * algorithm to filter out non-informative tokens before computing keyword
 * overlap against job titles. Kept intentionally small — be thorough but not
 * exhaustive (we still rely on the >3 char filter to drop most noise).
 */
export const STOPWORDS: ReadonlySet<string> = new Set([
  // Indonesian
  'di',
  'dan',
  'yang',
  'untuk',
  'dengan',
  'dari',
  'ke',
  'pada',
  'oleh',
  'atau',
  'akan',
  'adalah',
  'tidak',
  'sebagai',
  'juga',
  'agar',
  'serta',
  'saya',
  'kami',
  'kita',
  'mereka',
  'dia',
  'ini',
  'itu',
  'para',
  'bagi',
  'dalam',
  'karena',
  'sudah',
  'belum',
  'sangat',
  'lebih',
  'satu',
  'dua',
  'tahun',
  'orang',
  'bisa',
  'dapat',
  // English
  'the',
  'and',
  'or',
  'for',
  'with',
  'of',
  'in',
  'on',
  'at',
  'to',
  'a',
  'an',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'as',
  'by',
  'this',
  'that',
  'these',
  'those',
  'it',
  'its',
  'we',
  'our',
  'you',
  'your',
  'they',
  'them',
  'their',
  'from',
  'into',
  'over',
  'under',
  'about',
  'than',
  'then',
  'will',
  'have',
  'has',
  'had',
])

/**
 * Normalize free-form text into a deduplicated array of significant lowercase
 * tokens: split on non-alphanumeric, drop tokens of length <= 3, drop stopwords.
 */
export function tokenize(text: string | null | undefined): string[] {
  if (!text) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of text.toLowerCase().split(/[^a-z0-9À-ɏ]+/)) {
    const tok = raw.trim()
    if (tok.length <= 3) continue
    if (STOPWORDS.has(tok)) continue
    if (seen.has(tok)) continue
    seen.add(tok)
    out.push(tok)
  }
  return out
}
