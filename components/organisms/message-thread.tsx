'use client'

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import {
  sendMessage,
  markThreadRead,
  getMessagesAfter,
  type MessageRow,
} from '@/lib/messaging/actions'
import { useI18n } from '@/lib/i18n/i18n-provider'

const POLL_INTERVAL_MS = 10_000

const dateFmt = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

type Role = 'candidate' | 'recruiter'

export function MessageThread({
  applicationId,
  initialMessages,
  currentUserId,
  role,
}: {
  applicationId: string
  initialMessages: MessageRow[]
  currentUserId: string
  role: Role
}) {
  const { t } = useI18n()
  const tl = t.formsApplications.messageThread
  const [messages, setMessages] = useState<MessageRow[]>(initialMessages)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const listRef = useRef<HTMLDivElement | null>(null)
  const lastIdRef = useRef<string | null>(
    initialMessages.length > 0
      ? (initialMessages[initialMessages.length - 1]?.id ?? null)
      : null,
  )

  const scrollToBottom = useCallback(() => {
    const el = listRef.current
    if (!el) return
    // Defer to next frame so newly rendered nodes are measured.
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight
    })
  }, [])

  // Initial scroll + mark read on mount.
  useEffect(() => {
    scrollToBottom()
    void markThreadRead(applicationId)
    // Intentional: we only want to fire this once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Polling loop. Pauses while document is hidden so background tabs don't
  // hammer the server. Resumes immediately on visibility-change.
  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setInterval> | null = null

    async function tick() {
      if (cancelled) return
      if (typeof document !== 'undefined' && document.hidden) return
      try {
        const res = await getMessagesAfter({
          applicationId,
          sinceMessageId: lastIdRef.current,
        })
        if (!res.ok) return
        const incoming = res.data?.messages ?? []
        if (incoming.length === 0) return
        setMessages((prev) => {
          // Merge by id to avoid duplicates if polls race.
          const seen = new Set(prev.map((m) => m.id))
          const next = [...prev]
          for (const m of incoming) {
            if (!seen.has(m.id)) next.push(m)
          }
          return next
        })
        const tail = incoming[incoming.length - 1]
        if (tail) lastIdRef.current = tail.id
        scrollToBottom()
        // New messages from the other party -- mark them read.
        void markThreadRead(applicationId)
      } catch {
        // swallow -- next tick will retry
      }
    }

    function start() {
      if (timer) return
      timer = setInterval(tick, POLL_INTERVAL_MS)
    }
    function stop() {
      if (timer) {
        clearInterval(timer)
        timer = null
      }
    }
    function onVisibility() {
      if (document.hidden) {
        stop()
      } else {
        start()
        // Fire immediately on tab-focus so the user sees fresh state.
        void tick()
      }
    }

    if (typeof document !== 'undefined' && !document.hidden) start()
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibility)
    }

    return () => {
      cancelled = true
      stop()
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibility)
      }
    }
  }, [applicationId, scrollToBottom])

  const onSend = useCallback(() => {
    const body = draft.trim()
    if (!body) return
    setError(null)
    startTransition(async () => {
      const res = await sendMessage({ applicationId, body })
      if (!res.ok) {
        setError(res.error)
        return
      }
      setDraft('')
      // Fetch the new message we just sent (it will appear after the current
      // lastId) so we render it immediately without waiting for the next poll.
      const after = await getMessagesAfter({
        applicationId,
        sinceMessageId: lastIdRef.current,
      })
      if (after.ok && after.data) {
        const incoming = after.data.messages
        if (incoming.length > 0) {
          setMessages((prev) => {
            const seen = new Set(prev.map((m) => m.id))
            const next = [...prev]
            for (const m of incoming) if (!seen.has(m.id)) next.push(m)
            return next
          })
          const tail = incoming[incoming.length - 1]
          if (tail) lastIdRef.current = tail.id
          scrollToBottom()
        }
      }
    })
  }, [applicationId, draft, scrollToBottom])

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Ctrl+Enter or Cmd+Enter sends.
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        onSend()
      }
    },
    [onSend],
  )

  const groupedMessages = useMemo(() => messages, [messages])

  return (
    <div className="border-border bg-card flex flex-col rounded-2xl border">
      <div
        ref={listRef}
        role="log"
        aria-live="polite"
        aria-label="Riwayat pesan"
        className="flex max-h-[480px] min-h-[280px] flex-col gap-3 overflow-y-auto p-4"
      >
        {groupedMessages.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            {tl.emptyState}
          </p>
        ) : (
          groupedMessages.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              currentUserId={currentUserId}
              role={role}
            />
          ))
        )}
      </div>

      <div className="border-border border-t p-3">
        {error && (
          <p
            role="alert"
            className="border-destructive/30 bg-destructive/10 text-destructive mb-2 rounded-md border px-3 py-2 text-xs"
          >
            {error}
          </p>
        )}
        <label htmlFor="message-body" className="sr-only">
          {tl.composeLabel}
        </label>
        <textarea
          id="message-body"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={pending}
          rows={3}
          maxLength={5000}
          placeholder={tl.composePlaceholder}
          className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring/30 block w-full resize-none rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-muted-foreground text-xs">
            {draft.length}/5000
          </span>
          <button
            type="button"
            onClick={onSend}
            disabled={pending || draft.trim().length === 0}
            className="bg-primary text-primary-foreground inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? tl.sendPending : tl.sendBtn}
          </button>
        </div>
      </div>
    </div>
  )
}

function MessageBubble({
  message,
  currentUserId,
  role,
}: {
  message: MessageRow
  currentUserId: string
  role: Role
}) {
  const { t } = useI18n()
  const tl = t.formsApplications.messageThread
  const mine = message.senderId === currentUserId
  const senderName = message.sender.name ?? tl.fallbackSender
  const ts = dateFmt.format(
    typeof message.createdAt === 'string'
      ? new Date(message.createdAt)
      : message.createdAt,
  )

  // Read receipt -- only shown on the sender's own bubbles.
  let readReceipt: string | null = null
  if (mine) {
    if (role === 'candidate') {
      readReceipt = message.readByRecruiterAt ? tl.readReceipt : tl.sentReceipt
    } else {
      readReceipt = message.readByCandidateAt ? tl.readReceipt : tl.sentReceipt
    }
  }

  return (
    <div
      className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
      aria-label={mine ? tl.bubbleAriaOwn : tl.bubbleAriaFrom.replace('{name}', senderName)}
    >
      <div
        className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
          mine
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-muted text-foreground rounded-bl-sm'
        }`}
      >
        {!mine && (
          <p className="mb-0.5 text-xs font-medium opacity-80">{senderName}</p>
        )}
        <p className="whitespace-pre-wrap break-words">{message.body}</p>
        <p
          className={`mt-1 text-[10px] ${
            mine ? 'text-primary-foreground/70' : 'text-muted-foreground'
          }`}
        >
          {ts}
          {readReceipt && <span> · {readReceipt}</span>}
        </p>
      </div>
    </div>
  )
}
