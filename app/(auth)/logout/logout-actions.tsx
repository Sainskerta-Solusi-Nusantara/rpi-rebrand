'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export function LogoutActions() {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function handleLogout() {
    setPending(true)
    await signOut({ redirect: false })
    router.push('/login?signedOut=1')
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleLogout}
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[hsl(220,50%,14%)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[hsl(220,50%,18%)] focus:outline-none focus:ring-2 focus:ring-[hsl(43,74%,55%)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? 'Memproses…' : 'Ya, keluar'}
      </button>
      <Link
        href="/dashboard"
        className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted"
      >
        Batal
      </Link>
    </div>
  )
}
