'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { X, Send, AlertCircle, CheckCircle2 } from 'lucide-react'
import { sendOutreach } from '@/lib/talent-pool/actions'

export function TalentPoolOutreachModal({
  tenantSlug,
  candidateUserId,
  candidateName,
  candidateHeadline,
  triggerLabel = 'Kirim pesan',
}: {
  tenantSlug: string
  candidateUserId: string
  candidateName: string
  candidateHeadline: string | null
  triggerLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [pending, startTransition] = useTransition()
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  // Focus the textarea when the modal opens.
  useEffect(() => {
    if (open && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [open])

  // Close on Escape.
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  function close() {
    if (pending) return
    setOpen(false)
    // Reset only after the close animation/teardown so the user briefly sees
    // the success state before everything resets.
    setTimeout(() => {
      setBody('')
      setError(null)
      setSuccess(false)
    }, 200)
  }

  function submit() {
    setError(null)
    setSuccess(false)
    const trimmed = body.trim()
    if (trimmed.length < 10) {
      setError('Pesan minimal 10 karakter.')
      return
    }
    if (trimmed.length > 2000) {
      setError('Pesan maksimal 2000 karakter.')
      return
    }
    startTransition(async () => {
      const r = await sendOutreach({
        tenantSlug,
        candidateUserId,
        body: trimmed,
      })
      if (!r.ok) {
        setError(r.error)
        return
      }
      setSuccess(true)
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium"
      >
        <Send className="h-3.5 w-3.5" aria-hidden="true" />
        {triggerLabel}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="outreach-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) close()
          }}
        >
          <div className="bg-card border-border w-full max-w-lg rounded-2xl border p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2
                  id="outreach-title"
                  className="font-heading text-lg text-foreground"
                >
                  Kirim pesan ke {candidateName}
                </h2>
                {candidateHeadline && (
                  <p className="text-muted-foreground mt-0.5 text-sm">
                    {candidateHeadline}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={close}
                disabled={pending}
                aria-label="Tutup"
                className="text-muted-foreground hover:text-foreground rounded-md p-1 disabled:opacity-50"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="border-border bg-muted/30 mb-3 flex items-start gap-2 rounded-md border p-3 text-xs">
              <AlertCircle
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="text-muted-foreground">
                Pesan dikirim sebagai tawaran satu arah. Kandidat dapat
                membalas hanya setelah melamar lowongan Anda.
              </p>
            </div>

            <label
              htmlFor="outreach-body"
              className="text-muted-foreground mb-1 block text-xs uppercase"
            >
              Pesan ({body.trim().length}/2000)
            </label>
            <textarea
              ref={textareaRef}
              id="outreach-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={pending || success}
              rows={6}
              maxLength={2000}
              placeholder="Halo, saya tertarik dengan profil Anda untuk posisi…"
              className="border-border bg-background block w-full rounded-md border px-3 py-2 text-sm disabled:opacity-60"
            />

            {error && (
              <div
                role="alert"
                className="text-destructive mt-3 flex items-center gap-1.5 text-xs"
              >
                <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                {error}
              </div>
            )}
            {success && (
              <div
                role="status"
                className="mt-3 flex items-center gap-1.5 text-xs text-green-700"
              >
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                Pesan terkirim. Kandidat akan menerima notifikasi.
              </div>
            )}

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={close}
                disabled={pending}
                className="border-border bg-background hover:bg-muted rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
              >
                {success ? 'Tutup' : 'Batal'}
              </button>
              {!success && (
                <button
                  type="button"
                  onClick={submit}
                  disabled={pending || body.trim().length < 10}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send className="h-3.5 w-3.5" aria-hidden="true" />
                  {pending ? 'Mengirim…' : 'Kirim pesan'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
