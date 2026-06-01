/**
 * Informational widget that lists every event in the app that triggers a
 * Web Push notification to the user. Rendered on the notifications settings
 * page (`/dashboard/notifikasi`) so users understand what they will (or
 * won't) receive after enabling push.
 *
 * The list here MUST stay in sync with `lib/push/event-config.ts`. When
 * adding or removing a push trigger, update both.
 *
 * This is a Server Component — no client interactivity is needed.
 */

const PUSH_TRIGGERS: ReadonlyArray<{
  title: string
  description: string
}> = [
  {
    title: 'Login dari perangkat baru',
    description:
      'Kami mengirim notifikasi jika ada perangkat atau lokasi baru yang masuk ke akun Anda. Dapat dimatikan via preferensi “Login alert”.',
  },
  {
    title: 'Status lamaran Anda berubah',
    description:
      'Saat perekrut mengubah status lamaran Anda (mis. SHORTLISTED, INTERVIEW, OFFERED), kami beri tahu langsung. Notifikasi ini transaksional dan tidak dapat dimatikan.',
  },
  {
    title: 'Pesan baru di lamaran Anda',
    description:
      'Pesan baru dari perekrut atau pelamar pada thread lamaran akan memicu push. Notifikasi ini bersifat kritis dan tidak dapat dimatikan.',
  },
  {
    title: 'Wawancara dijadwalkan / dibatalkan',
    description:
      'Saat perekrut menjadwalkan, mengubah waktu, atau membatalkan wawancara Anda, kami akan langsung memberi tahu.',
  },
  {
    title: 'Laporan moderasi diselesaikan',
    description:
      'Jika laporan moderasi yang Anda kirim atau yang terkait konten Anda telah ditinjau, kami akan memberi tahu hasilnya.',
  },
] as const

export function PushTriggerInfo() {
  return (
    <section
      aria-labelledby="push-trigger-info-heading"
      className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/40"
      data-testid="push-trigger-info"
    >
      <h3
        id="push-trigger-info-heading"
        className="text-sm font-semibold text-slate-900 dark:text-slate-100"
      >
        Kapan kami mengirim push notification?
      </h3>
      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
        Aktifkan push pada perangkat ini untuk menerima notifikasi peristiwa
        berikut secara langsung.
      </p>
      <ul className="mt-3 space-y-2 text-sm">
        {PUSH_TRIGGERS.map((t) => (
          <li
            key={t.title}
            className="flex gap-2 text-slate-700 dark:text-slate-300"
          >
            <span aria-hidden className="mt-1 text-slate-400">
              •
            </span>
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {t.title}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {t.description}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
