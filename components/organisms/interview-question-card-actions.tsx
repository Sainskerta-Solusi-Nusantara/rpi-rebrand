'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Trash2 } from 'lucide-react'
import { deleteQuestion } from '@/lib/interview-questions/actions'

export function QuestionCardClientActions({
  questionId,
  text,
  canManage,
}: {
  questionId: string
  text: string
  canManage: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function onCopy() {
    setError(null)
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      setError('Browser tidak mendukung Salin.')
      return
    }
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      })
      .catch(() => {
        setError('Gagal menyalin.')
      })
  }

  function onDelete() {
    if (!confirming) {
      setConfirming(true)
      setTimeout(() => setConfirming(false), 3000)
      return
    }
    setError(null)
    startTransition(async () => {
      const res = await deleteQuestion(questionId)
      if (!res.ok) {
        setError(res.error)
        setConfirming(false)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onCopy}
        className="border-input text-foreground inline-flex items-center gap-1.5 rounded-md border bg-transparent px-3 py-1.5 text-xs font-medium hover:bg-muted"
      >
        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
        {copied ? 'Disalin' : 'Salin'}
      </button>
      {canManage && (
        <button
          type="button"
          onClick={onDelete}
          disabled={pending}
          className={
            confirming
              ? 'bg-destructive text-destructive-foreground inline-flex items-center gap-1.5 rounded-md border border-destructive px-3 py-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-60'
              : 'border-input text-foreground inline-flex items-center gap-1.5 rounded-md border bg-transparent px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60'
          }
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          {pending ? 'Menghapus…' : confirming ? 'Yakin hapus?' : 'Hapus'}
        </button>
      )}
      {error && (
        <span role="alert" className="text-destructive text-xs">
          {error}
        </span>
      )}
    </div>
  )
}
