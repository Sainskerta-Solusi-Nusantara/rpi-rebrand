'use client'

import * as React from 'react'
import { Bookmark, Check } from 'lucide-react'
import { Button } from '@/components/atoms/button'

export function SaveJobButton({
  jobId,
  initiallySaved = false,
}: {
  jobId: string
  initiallySaved?: boolean
}) {
  const [saved, setSaved] = React.useState(initiallySaved)
  const [pending, startTransition] = React.useTransition()
  const [error, setError] = React.useState<string | null>(null)

  function onClick() {
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}/save`, {
          method: saved ? 'DELETE' : 'POST',
        })
        if (!res.ok) throw new Error('failed')
        setSaved((prev) => !prev)
      } catch {
        setError('Gagal menyimpan')
      }
    })
  }

  return (
    <Button
      type="button"
      variant={saved ? 'secondary' : 'outline'}
      size="sm"
      onClick={onClick}
      disabled={pending}
      aria-pressed={saved}
      aria-label={saved ? 'Hapus dari simpanan' : 'Simpan lowongan'}
    >
      {saved ? (
        <Check className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Bookmark className="h-4 w-4" aria-hidden="true" />
      )}
      {saved ? 'Tersimpan' : 'Simpan'}
      {error && <span className="sr-only">{error}</span>}
    </Button>
  )
}
