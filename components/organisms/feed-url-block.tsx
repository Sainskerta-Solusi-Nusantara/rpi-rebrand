'use client'

/**
 * Compact code-block with a "copy" button for syndication feed URLs.
 *
 * Kept dependency-free (no toast / no notification library) — falls back to
 * a transient in-button label so it works in marketing pages and inside the
 * tenant settings page without dragging in additional state.
 */

import { useCallback, useState } from 'react'
import { Check, Copy } from 'lucide-react'

type FeedUrlBlockProps = {
  label?: string
  url: string
  description?: string
}

export function FeedUrlBlock({ label, url, description }: FeedUrlBlockProps) {
  const [copied, setCopied] = useState(false)

  const onCopy = useCallback(async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(url)
      } else {
        // Fallback for very old browsers — create a hidden input.
        const ta = document.createElement('textarea')
        ta.value = url
        ta.setAttribute('readonly', '')
        ta.style.position = 'absolute'
        ta.style.left = '-9999px'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard access denied — silent */
    }
  }, [url])

  return (
    <div className="space-y-1">
      {label && (
        <div className="text-foreground text-sm font-medium">{label}</div>
      )}
      {description && (
        <div className="text-muted-foreground text-xs">{description}</div>
      )}
      <div className="border-border bg-muted/40 flex items-stretch gap-2 rounded-md border">
        <code className="flex-1 overflow-x-auto whitespace-nowrap p-2 font-mono text-xs">
          {url}
        </code>
        <button
          type="button"
          onClick={onCopy}
          aria-label={copied ? 'URL disalin' : 'Salin URL'}
          className="bg-background hover:bg-muted text-foreground inline-flex shrink-0 items-center gap-1 border-l border-border px-3 text-xs font-medium transition"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              Tersalin
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              Salin URL
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default FeedUrlBlock
