'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Trash2 } from 'lucide-react'
import { requestAccountDeletion } from '@/lib/auth/account-actions'

export function AccountDeleteForm({
  hasPassword,
  ownedTenantCount,
}: {
  hasPassword: boolean
  ownedTenantCount: number
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const r = await requestAccountDeletion(fd)
      if (!r.ok) {
        setError(r.error)
        return
      }
      // Sign out client-side; the server already wiped sessions, but the JWT
      // cookie still lives on this device.
      await signOut({ redirect: false })
      router.push('/?deleted=1')
      router.refresh()
    })
  }

  if (!hasPassword) {
    return (
      <p className="text-muted-foreground text-sm">
        Akun Anda menggunakan Google. Atur password terlebih dulu agar kami
        dapat memverifikasi identitas sebelum menghapus akun.
      </p>
    )
  }

  if (ownedTenantCount > 0) {
    return (
      <p className="rounded-md border border-amber-300/40 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
        Anda masih OWNER {ownedTenantCount} tenant. Transfer kepemilikan tenant
        tersebut terlebih dulu sebelum menghapus akun.
      </p>
    )
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="border-destructive/40 text-destructive hover:bg-destructive/5 inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-medium transition"
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
        Hapus akun saya
      </button>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-md border border-destructive/30 bg-destructive/5 p-4">
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">
          Tindakan ini permanen.
        </p>
        <p className="text-muted-foreground text-xs">
          Data profil, sesi, akun OAuth, lamaran tersimpan, dan token Anda
          akan dihapus atau dianonimkan. Catatan audit dipertahankan untuk
          kepatuhan. Anda tidak dapat masuk kembali dengan email ini.
        </p>
      </div>

      <div className="space-y-1">
        <label htmlFor="del-password" className="block text-sm font-medium text-foreground">
          Password saat ini
        </label>
        <input
          id="del-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={pending}
          className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="del-confirm" className="block text-sm font-medium text-foreground">
          Ketik <span className="font-mono">HAPUS</span> untuk konfirmasi
        </label>
        <input
          id="del-confirm"
          name="confirm"
          type="text"
          autoComplete="off"
          spellCheck={false}
          required
          placeholder="HAPUS"
          disabled={pending}
          className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90 inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? 'Menghapus…' : 'Hapus akun secara permanen'}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            setError(null)
          }}
          disabled={pending}
          className="text-muted-foreground hover:text-foreground text-sm font-medium disabled:opacity-60"
        >
          Batal
        </button>
      </div>
    </form>
  )
}
