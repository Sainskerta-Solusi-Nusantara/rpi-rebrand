import { CalendarDays, Link2, Info } from 'lucide-react'
import { getMyCalendarAccount } from '@/lib/calendar/actions'
import { CalendarDisconnectButton } from '@/components/organisms/calendar-disconnect-button'

const dateFmt = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

/**
 * Server component — shows the current user's connected calendar account
 * (provider + email + expiry), with a "Hubungkan" CTA for unconnected users
 * and a "Putuskan" client subcomponent for connected users.
 *
 * Microsoft is rendered as a disabled, "Segera hadir" placeholder so the UI
 * already advertises the roadmap.
 */
export async function CalendarConnectCard({
  status,
}: {
  /**
   * Optional banner state from `?calendar=` query string in the security page.
   *  - "connected" → success banner
   *  - "error"     → red banner with reason text
   */
  status?: { kind: 'connected' } | { kind: 'error'; reason?: string }
}) {
  const account = await getMyCalendarAccount()

  return (
    <section
      aria-label="Kalender"
      className="border-border bg-card rounded-2xl border p-6"
    >
      <div className="mb-4 flex items-center gap-2">
        <CalendarDays className="h-5 w-5" aria-hidden="true" />
        <h2 className="font-heading text-lg">Kalender</h2>
      </div>

      <p className="text-muted-foreground mb-4 text-sm">
        Hubungkan akun kalender Anda agar wawancara yang dijadwalkan otomatis
        muncul di kalender. Token akses disimpan dengan aman dan dapat
        diputus kapan saja.
      </p>

      {status?.kind === 'connected' && (
        <p
          role="status"
          className="mb-4 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success"
        >
          Kalender berhasil terhubung.
        </p>
      )}
      {status?.kind === 'error' && (
        <p
          role="alert"
          className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          Gagal menghubungkan kalender
          {status.reason ? ` (${status.reason})` : ''}. Silakan coba lagi.
        </p>
      )}

      <div className="space-y-3">
        {/* Google row */}
        <div className="border-border flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-medium">Google Calendar</div>
            {account && account.provider === 'google' ? (
              <div className="text-muted-foreground text-xs">
                {account.providerEmail}
                {account.expiresAt && (
                  <>
                    {' '}
                    · token kedaluwarsa {dateFmt.format(account.expiresAt)}
                  </>
                )}
              </div>
            ) : (
              <div className="text-muted-foreground text-xs">
                Aktifkan agar wawancara otomatis tampil di Google Calendar Anda.
              </div>
            )}
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            {account && account.provider === 'google' ? (
              <>
                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                  Terhubung
                </span>
                <CalendarDisconnectButton provider="google" />
              </>
            ) : (
              <a
                href="/api/calendar/google/connect"
                className="border-border bg-background hover:bg-muted inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium text-foreground transition"
              >
                <Link2 className="h-4 w-4" aria-hidden="true" />
                Hubungkan Google Calendar
              </a>
            )}
          </div>
        </div>

        {/* Microsoft row (soon) */}
        <div className="border-border flex flex-col gap-3 rounded-lg border p-4 opacity-60 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-medium">Outlook / Microsoft 365</div>
            <div className="text-muted-foreground text-xs">
              Sinkronisasi dengan kalender Microsoft.
            </div>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <button
              type="button"
              disabled
              aria-disabled="true"
              title="Segera hadir"
              className="border-border bg-background inline-flex cursor-not-allowed items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium text-muted-foreground"
            >
              <Link2 className="h-4 w-4" aria-hidden="true" />
              Hubungkan Outlook
            </button>
            <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
              <Info className="h-3 w-3" aria-hidden="true" />
              Segera hadir
            </span>
          </div>
        </div>
      </div>

    </section>
  )
}
