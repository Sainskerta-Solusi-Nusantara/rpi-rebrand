'use client'

/**
 * Small informational hint shown in the recruiter UI when the chosen
 * application status will trigger an automated candidate email.
 *
 * Visibility rules:
 *   - Hidden when `newStatus` is APPLIED (initial state) or WITHDRAWN
 *     (user-initiated by the candidate). These never send.
 *   - Visible for any other status: REVIEWED, SHORTLISTED, INTERVIEW,
 *     OFFERED, HIRED, REJECTED.
 *
 * The actual "same value -> no email" gate lives server-side in
 * updateApplicationStatus. Callers should additionally hide this when the
 * selected status hasn't changed from the current value, to avoid misleading
 * the recruiter.
 */
export function ApplicationStatusNotifyInfo({
  newStatus,
}: {
  newStatus: string
}) {
  if (newStatus === 'APPLIED' || newStatus === 'WITHDRAWN') return null
  return (
    <p
      className="text-muted-foreground mt-1 text-xs"
      role="note"
      data-testid="application-status-notify-info"
    >
      Kandidat akan menerima email otomatis tentang perubahan status ini.
    </p>
  )
}
