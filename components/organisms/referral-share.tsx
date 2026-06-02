'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Copy, Gift, Mail, MessageCircle, Send, Sparkles } from 'lucide-react'
import { getOrCreateMyReferral } from '@/lib/referrals/actions'
import { useI18n } from '@/lib/i18n/i18n-provider'

type Props = {
  code: string | null
  baseUrl: string
  totalSignups?: number
  totalApplied?: number
}

export function ReferralShare({
  code,
  baseUrl,
  totalSignups = 0,
  totalApplied = 0,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const { t } = useI18n()
  const tc = t.formsMisc3.referralShare

  const cleanBase = baseUrl.replace(/\/$/, '')
  const shareUrl = code ? `${cleanBase}/r/${code}` : ''

  async function onCopy(text: string) {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text)
      } else {
        const ta = document.createElement('textarea')
        ta.value = text
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      // Visible URL can still be copied manually.
    }
  }

  function onActivate() {
    setError(null)
    startTransition(async () => {
      const result = await getOrCreateMyReferral()
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  if (!code) {
    return (
      <div className="border-border bg-card rounded-2xl border p-6">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-lg">{tc.activateHeading}</h2>
        </div>
        <p className="text-muted-foreground mb-4 text-sm">
          {tc.activateBody}
        </p>
        <button
          type="button"
          onClick={onActivate}
          disabled={isPending}
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Gift className="h-4 w-4" aria-hidden="true" />
          {isPending ? tc.activatePending : tc.activateBtn}
        </button>
        {error && (
          <p
            role="alert"
            className="text-destructive mt-3 text-sm"
          >
            {error}
          </p>
        )}
      </div>
    )
  }

  const shareText = tc.shareText.replace('{url}', shareUrl)
  const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`
  const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(tc.tgText)}`
  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`
  const mailUrl = `mailto:?subject=${encodeURIComponent(tc.mailSubject)}&body=${encodeURIComponent(tc.mailBody.replace('{url}', shareUrl).replace('{code}', code ?? ''))}`

  return (
    <div className="border-border bg-card rounded-2xl border p-6">
      <div className="mb-4 flex items-center gap-2">
        <Gift className="h-5 w-5" aria-hidden="true" />
        <h2 className="font-heading text-lg">{tc.activeHeading}</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <div className="text-muted-foreground text-xs font-medium uppercase">
            {tc.labelCode}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <code className="bg-muted text-foreground rounded-md px-3 py-1.5 font-mono text-base font-semibold tracking-wider">
              {code}
            </code>
            <button
              type="button"
              onClick={() => onCopy(code)}
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs"
              aria-label="Salin kode referral"
            >
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              {tc.copyCode}
            </button>
          </div>
        </div>

        <div>
          <div className="text-muted-foreground text-xs font-medium uppercase">
            {tc.labelStats}
          </div>
          <div className="mt-1 flex flex-wrap gap-3 text-sm">
            <span>
              <span className="font-semibold">{totalSignups}</span>{' '}
              <span className="text-muted-foreground">{tc.statSignups}</span>
            </span>
            <span>
              <span className="font-semibold">{totalApplied}</span>{' '}
              <span className="text-muted-foreground">{tc.statApplied}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <label
          htmlFor="referral-url"
          className="text-muted-foreground mb-1 block text-xs font-medium uppercase"
        >
          {tc.labelLink}
        </label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            id="referral-url"
            type="text"
            readOnly
            value={shareUrl}
            aria-label="Tautan referral"
            className="border-input bg-background text-foreground focus:border-ring focus:ring-ring/30 block w-full min-w-0 flex-1 truncate rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2"
            onFocus={(e) => e.currentTarget.select()}
          />
          <button
            type="button"
            onClick={() => onCopy(shareUrl)}
            aria-live="polite"
            className="border-border bg-card text-foreground hover:bg-muted inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium shadow-sm transition"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" aria-hidden="true" /> {tc.copiedLabel}
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" aria-hidden="true" /> {tc.copyLabel}
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="border-border bg-card text-foreground hover:bg-muted inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium shadow-sm transition"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" /> {tc.shareWa}
        </a>
        <a
          href={tgUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="border-border bg-card text-foreground hover:bg-muted inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium shadow-sm transition"
        >
          <Send className="h-4 w-4" aria-hidden="true" /> {tc.shareTg}
        </a>
        <a
          href={xUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="border-border bg-card text-foreground hover:bg-muted inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium shadow-sm transition"
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" /> {tc.shareX}
        </a>
        <a
          href={mailUrl}
          className="border-border bg-card text-foreground hover:bg-muted inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium shadow-sm transition"
        >
          <Mail className="h-4 w-4" aria-hidden="true" /> {tc.shareMail}
        </a>
      </div>
    </div>
  )
}
