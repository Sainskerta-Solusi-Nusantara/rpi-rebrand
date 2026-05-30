import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, CalendarClock, Video, MapPin, Phone } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { InterviewIcsButton } from '@/components/organisms/interview-ics-button'

export const metadata = { title: 'Jadwal Wawancara — Dasbor' }

const dateFmt = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'full',
  timeStyle: 'short',
})

const TYPE_LABEL: Record<string, string> = {
  video: 'Video call',
  onsite: 'Onsite',
  phone: 'Telepon',
}

const STATUS_LABEL: Record<string, string> = {
  scheduled: 'Terjadwal',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
  no_show: 'Tidak hadir',
}

const STATUS_TONE: Record<string, string> = {
  scheduled: 'bg-violet-100 text-violet-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  no_show: 'bg-slate-100 text-slate-800',
}

/**
 * Very small text sanitiser — strips C0 control chars + DEL so notes
 * coming from the recruiter render cleanly without injection surface.
 * We render with whitespace-pre-line; React already escapes HTML so
 * we only need to remove non-printables.
 */
function sanitiseNotes(value: string | null): string {
  if (!value) return ''
  let out = ''
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i)
    // Keep \t (9), \n (10), \r (13); drop other C0 controls and DEL.
    if (code === 9 || code === 10 || code === 13) {
      out += value[i]
    } else if (code >= 32 && code !== 127) {
      out += value[i]
    }
  }
  return out.trim()
}

export default async function CandidateInterviewListPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await requireAuth(
    `/dashboard/lamaran/${params.id}/wawancara`,
  )
  const userId = session.user.id

  const application = await prisma.application
    .findUnique({
      where: { id: params.id },
      select: {
        id: true,
        userId: true,
        job: { select: { title: true, slug: true } },
        tenant: { select: { name: true } },
      },
    })
    .catch(() => null)
  if (!application || application.userId !== userId) {
    notFound()
  }

  const interviews = await prisma.interviewSchedule
    .findMany({
      where: { applicationId: application.id },
      orderBy: { scheduledAt: 'asc' },
      select: {
        id: true,
        scheduledAt: true,
        durationMin: true,
        type: true,
        meetingUrl: true,
        location: true,
        notes: true,
        status: true,
      },
    })
    .catch(
      () => [] as Awaited<ReturnType<typeof prisma.interviewSchedule.findMany>>,
    )

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={'/dashboard/lamaran' as any}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke lamaran saya
        </Link>
      </div>

      <header className="border-border bg-card rounded-2xl border p-6">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5" aria-hidden="true" />
          <h1 className="font-heading text-2xl">Jadwal wawancara</h1>
        </div>
        <p className="text-muted-foreground mt-1 text-sm">
          {application.job.title} · {application.tenant.name}
        </p>
      </header>

      {interviews.length === 0 ? (
        <section className="border-border bg-card rounded-2xl border p-6">
          <p className="text-muted-foreground text-sm">
            Belum ada wawancara dijadwalkan untuk lamaran ini.
          </p>
        </section>
      ) : (
        <ul className="space-y-4">
          {interviews.map((iv) => {
            const typeLabel = TYPE_LABEL[iv.type] ?? iv.type
            const statusLabel = STATUS_LABEL[iv.status] ?? iv.status
            const statusTone =
              STATUS_TONE[iv.status] ?? 'bg-slate-100 text-slate-800'
            const typeIcon =
              iv.type === 'video' ? (
                <Video className="h-4 w-4" aria-hidden="true" />
              ) : iv.type === 'onsite' ? (
                <MapPin className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Phone className="h-4 w-4" aria-hidden="true" />
              )
            const notes = sanitiseNotes(iv.notes)
            const descriptionParts: string[] = [
              `Wawancara untuk ${application.job.title} di ${application.tenant.name}.`,
              `Jenis: ${typeLabel}.`,
            ]
            if (iv.type === 'video' && iv.meetingUrl) {
              descriptionParts.push(`Tautan: ${iv.meetingUrl}`)
            }
            if (notes) descriptionParts.push(notes)

            return (
              <li
                key={iv.id}
                className="border-border bg-card rounded-2xl border p-6 space-y-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium">
                    {typeIcon}
                    {typeLabel}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {iv.durationMin} menit
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${statusTone}`}
                  >
                    {statusLabel}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground text-xs uppercase block">
                    Tanggal & jam
                  </span>
                  <span className="font-medium">
                    {dateFmt.format(iv.scheduledAt)}
                  </span>
                </div>
                {iv.type === 'video' && iv.meetingUrl && (
                  <div className="text-sm">
                    <span className="text-muted-foreground text-xs uppercase block">
                      Tautan meeting
                    </span>
                    <a
                      href={iv.meetingUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="break-all hover:underline"
                    >
                      {iv.meetingUrl}
                    </a>
                  </div>
                )}
                {iv.type === 'onsite' && iv.location && (
                  <div className="text-sm">
                    <span className="text-muted-foreground text-xs uppercase block">
                      Lokasi
                    </span>
                    <span>{iv.location}</span>
                  </div>
                )}
                {notes && (
                  <div className="text-sm">
                    <span className="text-muted-foreground text-xs uppercase block">
                      Catatan rekruter
                    </span>
                    <p className="whitespace-pre-line">{notes}</p>
                  </div>
                )}
                {iv.status === 'scheduled' && (
                  <div>
                    <InterviewIcsButton
                      payload={{
                        uid: iv.id,
                        summary: `Wawancara ${application.job.title} — ${application.tenant.name}`,
                        description: descriptionParts.join('\n'),
                        location:
                          iv.type === 'onsite'
                            ? (iv.location ?? null)
                            : iv.type === 'video'
                              ? (iv.meetingUrl ?? null)
                              : null,
                        url: iv.type === 'video' ? (iv.meetingUrl ?? null) : null,
                        startMs: iv.scheduledAt.getTime(),
                        durationMin: iv.durationMin,
                      }}
                      filename={`wawancara-${iv.id}.ics`}
                    />
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
