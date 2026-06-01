'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FileText, Upload } from 'lucide-react'
import { advanceOnboardingStep } from '@/lib/onboarding/wizard-actions'

export interface OnboardingStepResumeProps {
  nextStep: number
  nextRoute: string
}

export function OnboardingStepResume({
  nextStep,
  nextRoute,
}: OnboardingStepResumeProps) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  const [error, setError] = React.useState<string | null>(null)

  function handleAdvance() {
    setError(null)
    startTransition(async () => {
      const result = await advanceOnboardingStep({ step: nextStep })
      if (!result.ok) {
        setError(result.error)
        return
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.push(nextRoute as any)
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">
        Resume yang lengkap meningkatkan peluang Anda dilirik perekrut. Pilih
        salah satu opsi di bawah.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={'/dashboard/cv' as any}
          className="border-border bg-card hover:bg-muted group block rounded-2xl border p-5 transition-colors"
        >
          <div className="space-y-2">
            <span className="bg-primary/10 text-primary inline-flex h-10 w-10 items-center justify-center rounded-full">
              <Upload className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="font-heading text-base">Unggah CV</div>
            <p className="text-muted-foreground text-sm">
              Sudah punya CV? Unggah file PDF atau DOCX Anda.
            </p>
          </div>
        </Link>

        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={'/dashboard/cv' as any}
          className="border-border bg-card hover:bg-muted group block rounded-2xl border p-5 transition-colors"
        >
          <div className="space-y-2">
            <span className="bg-primary/10 text-primary inline-flex h-10 w-10 items-center justify-center rounded-full">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="font-heading text-base">Buat resume baru</div>
            <p className="text-muted-foreground text-sm">
              Gunakan resume builder kami dengan template siap pakai.
            </p>
          </div>
        </Link>
      </div>

      {error && (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm"
        >
          {error}
        </div>
      )}

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleAdvance}
          disabled={isPending}
          className="bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? 'Memuat…' : 'Lanjut'}
        </button>
      </div>
    </div>
  )
}
