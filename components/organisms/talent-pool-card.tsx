import Link from 'next/link'
import { MapPin, FileText, ExternalLink, Briefcase } from 'lucide-react'
import type { TalentPoolCandidate } from '@/lib/talent-pool/queries'
import { TalentPoolOutreachModal } from './talent-pool-outreach-modal'
import { MatchScoreBadge } from './match-score-badge'
import { getServerT } from '@/lib/i18n/server-dictionary'

const dateFmt = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' })

/**
 * Server component — renders a single candidate card in the talent-pool
 * search results grid. The "Kirim pesan" action is delegated to the
 * client modal (TalentPoolOutreachModal); the rest is static markup.
 *
 * Privacy: this component receives a sanitized TalentPoolCandidate. There
 * is no place email/phone could leak — both fields are absent from that
 * type by design (see lib/talent-pool/queries.ts).
 */
export async function TalentPoolCard({
  candidate,
  tenantSlug,
  avgMatchScore,
}: {
  candidate: TalentPoolCandidate
  tenantSlug: string
  /**
   * Optional aggregate of the candidate's persisted match scores across
   * the applications they have submitted. Hidden when null.
   */
  avgMatchScore?: number | null
}) {
  const t = await getServerT()
  const tc = t.formsInsights.talentPoolCard

  const initials = candidate.displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')

  const profileHref = `/profil/${candidate.handle}`

  return (
    <article className="border-border bg-card flex h-full flex-col gap-3 rounded-2xl border p-5">
      <header className="flex items-start gap-3">
        {candidate.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={candidate.image}
            alt=""
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="bg-muted text-muted-foreground flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold"
          >
            {initials || '?'}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-heading text-base text-foreground truncate">
            {candidate.displayName}
          </h3>
          {candidate.headline && (
            <p className="text-muted-foreground line-clamp-2 text-xs">
              {candidate.headline}
            </p>
          )}
        </div>
        {typeof avgMatchScore === 'number' ? (
          <div
            className="shrink-0"
            title={tc.avgMatchScoreTitle}
          >
            <MatchScoreBadge score={avgMatchScore} size="sm" />
          </div>
        ) : null}
      </header>

      <dl className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        {candidate.location && (
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" aria-hidden="true" />
            <span className="truncate max-w-[10rem]">{candidate.location}</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Briefcase className="h-3 w-3" aria-hidden="true" />
          <span>
            {candidate.experienceYears > 0
              ? tc.experienceYears.replace('{years}', String(candidate.experienceYears))
              : tc.experienceLessThanOne}
          </span>
        </div>
        {candidate.hasResume && (
          <div className="flex items-center gap-1">
            <FileText className="h-3 w-3" aria-hidden="true" />
            <span>{tc.resumeAvailable}</span>
          </div>
        )}
      </dl>

      {candidate.skills.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Keahlian">
          {candidate.skills.map((s) => (
            <li
              key={s}
              className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[10px] font-medium"
            >
              {s}
            </li>
          ))}
        </ul>
      )}

      <p className="text-muted-foreground mt-auto text-[11px]">
        {tc.updatedAt.replace('{date}', dateFmt.format(candidate.updatedAt))}
      </p>

      <footer className="flex items-center justify-between gap-2">
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={profileHref as any}
          className="text-foreground hover:text-primary inline-flex items-center gap-1 text-sm font-medium"
        >
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          {tc.viewProfile}
        </Link>
        <TalentPoolOutreachModal
          tenantSlug={tenantSlug}
          candidateUserId={candidate.userId}
          candidateName={candidate.displayName}
          candidateHeadline={candidate.headline}
        />
      </footer>
    </article>
  )
}
