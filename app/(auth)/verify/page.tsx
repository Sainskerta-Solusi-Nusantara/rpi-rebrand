import Link from 'next/link'
import { getServerT } from '@/lib/i18n/server-dictionary'

export const metadata = {
  title: 'Verifikasi Email · Rumah Pekerja Indonesia',
  description: 'Periksa email Anda untuk melanjutkan.',
}

export default async function VerifyPage() {
  const t = await getServerT()
  const tv = t.auth.verify.checkInbox

  return (
    <div className="space-y-6 text-center">
      <div
        aria-hidden
        className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[hsl(43,74%,55%)]/15 text-3xl"
      >
        <span className="text-primary">✉</span>
      </div>

      <header className="space-y-2">
        <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          {tv.title}
        </h2>
        <p className="text-sm text-muted-foreground">
          {tv.body}
        </p>
      </header>

      <div className="rounded-md border border-border bg-muted/50 p-4 text-left text-xs text-muted-foreground">
        <p className="font-medium text-foreground">{tv.helpTitle}</p>
        <ul className="mt-2 list-disc space-y-1 pl-4">
          <li>{tv.helpItems.spam}</li>
          <li>{tv.helpItems.correctAddress}</li>
          <li>{tv.helpItems.wait}</li>
        </ul>
      </div>

      <div className="flex flex-col gap-2 text-sm">
        <Link href="/login" className="font-medium text-primary hover:underline">
          {tv.backToLogin}
        </Link>
        <Link
          href="/register"
          className="text-muted-foreground hover:text-foreground hover:underline"
        >
          {tv.useDifferentEmail}
        </Link>
      </div>
    </div>
  )
}
