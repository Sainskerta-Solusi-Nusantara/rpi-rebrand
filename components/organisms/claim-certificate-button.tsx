'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Award } from 'lucide-react'

import { issueCertificate } from '@/lib/enrollments/actions'

export function ClaimCertificateButton({
  enrollmentId,
}: {
  enrollmentId: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function doClaim() {
    setError(null)
    startTransition(async () => {
      const r = await issueCertificate({ enrollmentId })
      if (!r.ok) {
        setError(r.error)
        return
      }
      router.push(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (`/sertifikat/${r.certificateId}`) as any,
      )
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={doClaim}
        disabled={pending}
        className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Award className="h-4 w-4" aria-hidden />
        {pending ? 'Memproses…' : 'Klaim sertifikat'}
      </button>
      {error && (
        <span role="alert" className="text-destructive text-xs">
          {error}
        </span>
      )}
    </div>
  )
}
