/**
 * Plain-text @mention parser for recruiter notes.
 *
 * Rules:
 *  - Mention syntax is `@username` where username is lowercase letters, digits,
 *    `.`, `_`, or `-`.
 *  - We deliberately keep the regex narrow so we never pick up email handles or
 *    code snippets like `@types/x` ambiguously. The leading char must NOT be a
 *    word character (so `foo@bar` is not treated as a mention).
 *  - Usernames are returned lowercased and de-duplicated, preserving the first
 *    occurrence's relative ordering.
 *
 * NO database I/O lives here — pure functions are easy to unit test and reuse
 * in both server actions and rendering.
 */

const MENTION_RE = /(^|[^A-Za-z0-9_])@([a-z0-9._-]+)/g

/**
 * Extract every distinct `@username` mention from a body of text.
 *
 * Returns lowercase usernames. The mention candidate IS NOT validated against
 * the User table here — callers must resolve `usernames` against
 * `prisma.user.findMany({ where: { username: { in: usernames } } })`.
 */
export function parseMentions(body: string): string[] {
  if (!body) return []
  const seen = new Set<string>()
  const out: string[] = []
  // Reset lastIndex because /g regexes are stateful when reused.
  MENTION_RE.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = MENTION_RE.exec(body)) !== null) {
    const username = match[2]?.toLowerCase()
    if (!username) continue
    // Reject pathological values (regex already constrains, but be defensive).
    if (username.length < 2 || username.length > 64) continue
    if (!seen.has(username)) {
      seen.add(username)
      out.push(username)
    }
  }
  return out
}

/**
 * Minimal HTML entity escape — we intentionally avoid pulling in an HTML
 * library so this module stays dependency-free. The output is suitable for
 * dropping into a server-rendered note body via dangerouslySetInnerHTML.
 */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export type KnownUserLookup = Record<string, { id: string; name: string | null }>

/**
 * Render a note body to HTML with `@username` tokens wrapped in `<a>` when
 * the username is in `knownUsers` (case-insensitive lookup on lowercase keys).
 * Unknown mentions stay as plain text. Linebreaks become `<br>`.
 *
 * The link href points to the user's profile (`/u/{username}`) — adjust if the
 * profile URL convention changes. Class names follow tenant theme.
 */
export function renderMentionsToHtml(
  body: string,
  knownUsers: KnownUserLookup,
): string {
  if (!body) return ''
  const escaped = escapeHtml(body)
  // Operate on the escaped string so `<script>@foo</script>` is safe — only
  // the literal `@foo` token (which survives entity-escaping) is replaced.
  MENTION_RE.lastIndex = 0
  const replaced = escaped.replace(
    MENTION_RE,
    (_full, leading: string, username: string) => {
      const key = username.toLowerCase()
      const user = knownUsers[key]
      if (user) {
        const display = escapeHtml(user.name ?? `@${username}`)
        return `${leading}<a class="text-primary font-medium hover:underline" data-mention-username="${escapeHtml(
          key,
        )}" data-mention-user-id="${escapeHtml(user.id)}" href="/u/${escapeHtml(key)}">@${escapeHtml(username)}</a><span class="sr-only"> (${display})</span>`
      }
      // Unknown: keep as literal token.
      return `${leading}@${escapeHtml(username)}`
    },
  )
  return replaced.replace(/\n/g, '<br/>')
}
