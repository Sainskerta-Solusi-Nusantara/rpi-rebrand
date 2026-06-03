// Error/event reporting. Provider-agnostic: every capture is structured-logged,
// and additionally POSTed (fire-and-forget) to an ingestion endpoint when one
// is configured. This keeps the app decoupled from any specific SaaS SDK —
// point the DSN at a Sentry tunnel, PostHog, Logflare, or a custom collector.
//
// Configure with either:
//   NEXT_PUBLIC_OBSERVABILITY_DSN  — used by both client and server captures
//   OBSERVABILITY_DSN              — server-only (takes precedence on the server)
// When neither is set, captures are logged only (a safe no-op for forwarding).
//
// Isomorphic and total: these functions never throw.

import { createLogger, type LogLevel } from './logger'

const log = createLogger('report')

export interface CaptureContext {
  [key: string]: unknown
}

interface NormalizedError {
  name: string
  message: string
  stack?: string
  digest?: string
}

function normalizeError(error: unknown): NormalizedError {
  if (error instanceof Error) {
    const digest = (error as { digest?: unknown }).digest
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...(typeof digest === 'string' ? { digest } : {}),
    }
  }
  if (typeof error === 'string') return { name: 'Error', message: error }
  return { name: 'Error', message: 'Unknown error', stack: safeStringify(error) }
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function dsn(): string | null {
  // process.env.* references are statically inlined by Next; on the client the
  // server-only var resolves to undefined, leaving the public one.
  return (
    process.env.OBSERVABILITY_DSN ||
    process.env.NEXT_PUBLIC_OBSERVABILITY_DSN ||
    null
  )
}

function envelopeMeta(): Record<string, unknown> {
  return {
    ts: new Date().toISOString(),
    env: process.env.NODE_ENV ?? 'development',
    runtime: typeof window === 'undefined' ? 'server' : 'client',
    release: process.env.NEXT_PUBLIC_APP_VERSION || process.env.VERCEL_GIT_COMMIT_SHA || null,
  }
}

function forward(payload: Record<string, unknown>): void {
  const url = dsn()
  if (!url || typeof fetch !== 'function') return
  try {
    void fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      // survive page unload on the client; harmless on the server
      keepalive: true,
    }).catch(() => {})
  } catch {
    /* never let telemetry break the app */
  }
}

/** Report an exception. Always logged; forwarded when a DSN is configured. */
export function captureException(error: unknown, context?: CaptureContext): void {
  const normalized = normalizeError(error)
  log.error(normalized.message, { ...context, error: normalized })
  forward({ kind: 'exception', error: normalized, context: context ?? {}, ...envelopeMeta() })
}

/** Report a standalone message/event. */
export function captureMessage(
  message: string,
  level: LogLevel = 'info',
  context?: CaptureContext,
): void {
  if (level === 'error') log.error(message, context)
  else if (level === 'warn') log.warn(message, context)
  else log.info(message, context)
  forward({ kind: 'message', level, message, context: context ?? {}, ...envelopeMeta() })
}
