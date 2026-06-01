import Link from 'next/link'
import { prisma } from '@/lib/db'
import { verifyUnsubscribeToken } from '@/lib/saved-search/unsubscribe-token'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Berhenti berlangganan alert pencarian',
}

/**
 * Public unsubscribe target for saved-search digest emails. Reads an
 * HMAC-signed token tied to (searchId, userId), verifies it, and disables
 * `emailAlerts` on the matching row. Idempotent — re-visiting the link
 * after already unsubscribing still shows the success message.
 */
export default async function SavedSearchUnsubscribePage({
  params,
}: {
  params: { token: string }
}) {
  const decoded = verifyUnsubscribeToken(params.token)

  if (!decoded) {
    return (
      <div className="mx-auto w-full max-w-xl px-6 py-16">
        <h1 className="font-heading text-2xl md:text-3xl">Tautan tidak valid</h1>
        <p className="text-muted-foreground mt-3 text-sm">
          Tautan berhenti berlangganan tidak valid atau sudah kedaluwarsa. Anda
          dapat mengelola alert Anda secara manual dari dasbor.
        </p>
        <p className="mt-6">
          <Link
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            href={'/dashboard/pencarian-tersimpan' as any}
            className="inline-flex items-center rounded-md bg-[hsl(220,50%,14%)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[hsl(220,50%,18%)]"
          >
            Buka Pencarian Tersimpan
          </Link>
        </p>
      </div>
    )
  }

  // Verify the row actually still exists and belongs to the same user.
  const row = await prisma.savedSearch
    .findUnique({
      where: { id: decoded.searchId },
      select: { id: true, name: true, userId: true, emailAlerts: true },
    })
    .catch(() => null)

  if (!row || row.userId !== decoded.userId) {
    return (
      <div className="mx-auto w-full max-w-xl px-6 py-16">
        <h1 className="font-heading text-2xl md:text-3xl">
          Pencarian tidak ditemukan
        </h1>
        <p className="text-muted-foreground mt-3 text-sm">
          Pencarian tersimpan ini sudah tidak ada lagi. Tidak ada alert yang
          dikirim untuk kriteria tersebut.
        </p>
        <p className="mt-6">
          <Link
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            href={'/dashboard/pencarian-tersimpan' as any}
            className="inline-flex items-center rounded-md bg-[hsl(220,50%,14%)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[hsl(220,50%,18%)]"
          >
            Buka Pencarian Tersimpan
          </Link>
        </p>
      </div>
    )
  }

  // Disable alerts (idempotent).
  if (row.emailAlerts) {
    await prisma.savedSearch
      .update({
        where: { id: row.id },
        data: { emailAlerts: false },
      })
      .catch((err) => {
        console.error('[saved-search unsubscribe] failed', err)
      })
  }

  return (
    <div className="mx-auto w-full max-w-xl px-6 py-16">
      <h1 className="font-heading text-2xl md:text-3xl">
        Berhasil berhenti berlangganan
      </h1>
      <p className="text-muted-foreground mt-3 text-sm">
        Berhasil berhenti berlangganan alert untuk:{' '}
        <strong className="text-foreground font-medium">{row.name}</strong>.
      </p>
      <p className="text-muted-foreground mt-2 text-sm">
        Anda tidak akan menerima email mingguan untuk pencarian ini lagi. Anda
        dapat mengaktifkan kembali kapan saja dari dasbor.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={'/dashboard/pencarian-tersimpan' as any}
          className="inline-flex items-center rounded-md bg-[hsl(220,50%,14%)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[hsl(220,50%,18%)]"
        >
          Kelola alert
        </Link>
        <Link
          href="/jobs"
          className="inline-flex items-center rounded-md border border-input px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
          Cari lowongan
        </Link>
      </div>
    </div>
  )
}
