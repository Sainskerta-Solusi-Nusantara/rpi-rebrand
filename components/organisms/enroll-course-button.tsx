'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Award, CheckCircle2, GraduationCap, LogIn, PlayCircle } from 'lucide-react'

import { Button } from '@/components/atoms/button'
import { enrollInCourse } from '@/lib/enrollments/actions'

export type EnrollmentStateLite = {
  id: string
  status: 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED'
  progress: number
  certificateId?: string | null
}

export function EnrollCourseButton({
  courseSlug,
  enrollment,
  signedIn,
}: {
  courseSlug: string
  enrollment: EnrollmentStateLite | null
  signedIn: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Not signed in → push to login with callback back to the course page.
  if (!signedIn) {
    const callback = `/courses/${courseSlug}`
    return (
      <Button asChild size="lg" className="w-full">
        <Link
          href={
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (`/login?callbackUrl=${encodeURIComponent(callback)}`) as any
          }
        >
          <LogIn className="mr-2 h-4 w-4" aria-hidden />
          Masuk untuk mendaftar
        </Link>
      </Button>
    )
  }

  // Completed → certificate / continue revisit.
  if (enrollment?.status === 'COMPLETED') {
    return (
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
          Selesai
        </div>
        {enrollment.certificateId ? (
          <Button asChild size="lg" className="w-full">
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={(`/sertifikat/${enrollment.certificateId}`) as any}
            >
              <Award className="mr-2 h-4 w-4" aria-hidden />
              Lihat sertifikat
            </Link>
          </Button>
        ) : (
          <Button asChild size="lg" className="w-full">
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={(`/dashboard/kursus/${courseSlug}`) as any}
            >
              <Award className="mr-2 h-4 w-4" aria-hidden />
              Klaim sertifikat
            </Link>
          </Button>
        )}
      </div>
    )
  }

  // Already enrolled in-progress → continue.
  if (enrollment) {
    return (
      <Button asChild size="lg" className="w-full">
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={(`/dashboard/kursus/${courseSlug}`) as any}
        >
          <PlayCircle className="mr-2 h-4 w-4" aria-hidden />
          Lanjutkan kursus ({enrollment.progress}%)
        </Link>
      </Button>
    )
  }

  // Signed in, not yet enrolled → call action.
  function doEnroll() {
    setError(null)
    startTransition(async () => {
      const r = await enrollInCourse({ courseSlug })
      if (!r.ok) {
        setError(r.error)
        return
      }
      router.push(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (`/dashboard/kursus/${courseSlug}`) as any,
      )
      router.refresh()
    })
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        size="lg"
        className="w-full"
        onClick={doEnroll}
        disabled={pending}
        loading={pending}
      >
        <GraduationCap className="mr-2 h-4 w-4" aria-hidden />
        {pending ? 'Mendaftarkan…' : 'Daftar kursus'}
      </Button>
      {error && (
        <p role="alert" className="text-destructive text-xs">
          {error}
        </p>
      )}
    </div>
  )
}
