'use client'

import { useState } from 'react'

export type InterviewIcsPayload = {
  uid: string
  summary: string
  description?: string | null
  location?: string | null
  url?: string | null
  startMs: number
  durationMin: number
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** Format a Date as a UTC iCalendar datetime (e.g. 20260601T030000Z). */
function toIcsUtc(d: Date): string {
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    'T' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    'Z'
  )
}

function escapeIcsText(value: string): string {
  // Per RFC 5545: escape backslash, comma, semicolon, newline.
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
}

function buildIcs(p: InterviewIcsPayload): string {
  const start = new Date(p.startMs)
  const end = new Date(p.startMs + p.durationMin * 60_000)
  const now = new Date()
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Rumah Pekerja Indonesia//Interview//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${p.uid}@rumahpekerja.id`,
    `DTSTAMP:${toIcsUtc(now)}`,
    `DTSTART:${toIcsUtc(start)}`,
    `DTEND:${toIcsUtc(end)}`,
    `SUMMARY:${escapeIcsText(p.summary)}`,
  ]
  if (p.description) {
    lines.push(`DESCRIPTION:${escapeIcsText(p.description)}`)
  }
  if (p.location) {
    lines.push(`LOCATION:${escapeIcsText(p.location)}`)
  }
  if (p.url) {
    lines.push(`URL:${p.url}`)
  }
  lines.push('END:VEVENT', 'END:VCALENDAR')
  return lines.join('\r\n')
}

/**
 * Client-side .ics generator + downloader. We build the file as a blob
 * here so we never need to round-trip to the server for a simple
 * calendar export.
 */
export function InterviewIcsButton({
  payload,
  filename = 'wawancara.ics',
  label = 'Tambahkan ke kalender',
}: {
  payload: InterviewIcsPayload
  filename?: string
  label?: string
}) {
  const [busy, setBusy] = useState(false)

  function onClick() {
    setBusy(true)
    try {
      const blob = new Blob([buildIcs(payload)], {
        type: 'text/calendar;charset=utf-8',
      })
      const href = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = href
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      // Give the browser a moment to start the download before releasing.
      setTimeout(() => URL.revokeObjectURL(href), 1000)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="border-input text-foreground hover:bg-muted inline-flex items-center justify-center rounded-md border bg-transparent px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-60"
    >
      {label}
    </button>
  )
}
