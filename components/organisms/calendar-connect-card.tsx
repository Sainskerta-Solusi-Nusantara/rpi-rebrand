import { CalendarDays, Link2 } from 'lucide-react'
import { getMyCalendarAccounts } from '@/lib/calendar/actions'
import { CalendarDisconnectButton } from '@/components/organisms/calendar-disconnect-button'

const dateFmt = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

/**
 * Server component — shows the current user's connected calendar accounts
 * side-by-side (Google + Microsoft), each with its own connect/disconnect
 * state. Microsoft now mirrors the Google flow via
 * `/api/auth/microsoft-calendar/start`.
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
  const accounts = await getMyCalendarAccounts()
  const google = accounts.find((a) => a.provider === 'google') ?? null
  const microsoft = accounts.find((a) => a.provider === 'microsoft') ?? null

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
            {google ? (
              <div className="text-muted-foreground text-xs">
                Terhubung sebagai {google.providerEmail}
                {google.expiresAt && (
                  <>
                    {' '}
                    · token kedaluwarsa {dateFmt.format(google.expiresAt)}
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
            {google ? (
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

        {/* Microsoft row */}
        <div className="border-border flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-medium">Outlook / Microsoft 365</div>
            {microsoft ? (
              <div className="text-muted-foreground text-xs">
                Terhubung sebagai {microsoft.providerEmail}
                {microsoft.expiresAt && (
                  <>
                    {' '}
                    · token kedaluwarsa {dateFmt.format(microsoft.expiresAt)}
                  </>
                )}
              </div>
            ) : (
              <div className="text-muted-foreground text-xs">
                Belum terhubung. Hubungkan untuk sinkronisasi otomatis jadwal
                wawancara ke Outlook Anda.
              </div>
            )}
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            {microsoft ? (
              <>
                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                  Terhubung
                </span>
                <CalendarDisconnectButton provider="microsoft" />
              </>
            ) : (
              <a
                href="/api/auth/microsoft-calendar/start"
                className="border-border bg-background hover:bg-muted inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium text-foreground transition"
              >
                <Link2 className="h-4 w-4" aria-hidden="true" />
                Hubungkan Outlook
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
