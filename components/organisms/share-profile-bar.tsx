'use client'

import { useState } from 'react'
import { Check, Copy, Mail } from 'lucide-react'

export function ShareProfileBar({
  url,
  displayName,
}: {
  url: string
  displayName: string
}) {
  const [copied, setCopied] = useState(false)

  async function onCopy() {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(url)
      } else {
        // Legacy fallback
        const ta = document.createElement('textarea')
        ta.value = url
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
      // No-op — user can still copy the visible URL manually
    }
  }

  const mailSubject = encodeURIComponent(`Profil ${displayName} di SSN`)
  const mailBody = encodeURIComponent(
    `Halo, saya ingin membagikan profil ${displayName} dari SSN:\n\n${url}\n`,
  )

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <input
        type="text"
        readOnly
        value={url}
        aria-label="Tautan profil"
        className="border-input bg-background text-foreground focus:border-ring focus:ring-ring/30 block w-full min-w-0 flex-1 truncate rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2"
        onFocus={(e) => e.currentTarget.select()}
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onCopy}
          aria-live="polite"
          className="border-border bg-card text-foreground hover:bg-muted inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium shadow-sm transition"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" aria-hidden /> Tersalin
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" aria-hidden /> Salin tautan
            </>
          )}
        </button>
        <a
          href={`mailto:?subject=${mailSubject}&body=${mailBody}`}
          className="border-border bg-card text-foreground hover:bg-muted inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium shadow-sm transition"
        >
          <Mail className="h-4 w-4" aria-hidden /> Email
        </a>
      </div>
    </div>
  )
}
