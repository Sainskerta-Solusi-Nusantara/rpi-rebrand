import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

import { CreateAssessmentForm } from '@/components/organisms/create-assessment-form'
import { getServerT } from '@/lib/i18n/server-dictionary'

export const metadata = { title: 'Buat Asesmen Baru' }

export default async function NewAdminAssessmentPage() {
  const t = await getServerT()
  const ta = t.admin.assessmentNew
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <Link
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        href={'/admin/assessments' as any}
        className="text-muted-foreground inline-flex items-center gap-1 text-xs hover:underline"
      >
        <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
        {ta.back}
      </Link>

      <header>
        <h1 className="font-heading text-2xl md:text-3xl">{ta.title}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{ta.subtitle}</p>
      </header>

      <CreateAssessmentForm />
    </div>
  )
}
