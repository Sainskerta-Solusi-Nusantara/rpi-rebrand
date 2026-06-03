// Structured, isomorphic logger. Works on the server (Node/edge) and the
// client. Emits one JSON line per record in production (parseable by Vercel /
// log drains) and a readable line in development.
//
// Usage:
//   const log = createLogger('billing')
//   log.info('checkout started', { tenantId, plan })
//   log.error('stripe call failed', { err })   // Error values are expanded
//
// Level is controlled by LOG_LEVEL (debug|info|warn|error); defaults to
// `info` in production and `debug` otherwise.

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
}

const REDACT_KEYS = [
  'password',
  'token',
  'secret',
  'authorization',
  'cookie',
  'apikey',
  'api_key',
  'accesstoken',
  'refreshtoken',
  'totpsecret',
]

function isProd(): boolean {
  return process.env.NODE_ENV === 'production'
}

function configuredLevel(): LogLevel {
  const raw = (process.env.LOG_LEVEL || '').toLowerCase()
  if (raw === 'debug' || raw === 'info' || raw === 'warn' || raw === 'error') {
    return raw
  }
  return isProd() ? 'info' : 'debug'
}

/** Expand Error instances and redact obviously-sensitive keys. */
function sanitize(value: unknown, depth = 0): unknown {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
      ...(typeof (value as { digest?: unknown }).digest === 'string'
        ? { digest: (value as { digest?: string }).digest }
        : {}),
    }
  }
  if (value === null || typeof value !== 'object' || depth > 4) return value
  if (Array.isArray(value)) return value.map((v) => sanitize(v, depth + 1))
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = REDACT_KEYS.includes(k.toLowerCase()) ? '[redacted]' : sanitize(v, depth + 1)
  }
  return out
}

export interface LogFields {
  [key: string]: unknown
}

export interface Logger {
  debug(msg: string, fields?: LogFields): void
  info(msg: string, fields?: LogFields): void
  warn(msg: string, fields?: LogFields): void
  error(msg: string, fields?: LogFields): void
  /** Derive a child logger with extra default fields. */
  child(fields: LogFields): Logger
}

function runtime(): 'server' | 'client' {
  return typeof window === 'undefined' ? 'server' : 'client'
}

function emit(level: LogLevel, scope: string, msg: string, fields: LogFields): void {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[configuredLevel()]) return

  const record = {
    ts: new Date().toISOString(),
    level,
    scope,
    msg,
    runtime: runtime(),
    ...(sanitize(fields) as Record<string, unknown>),
  }

  const sink =
    level === 'error' ? console.error : level === 'warn' ? console.warn : console.log

  if (isProd()) {
    // eslint-disable-next-line no-console
    sink(JSON.stringify(record))
  } else {
    const { ts, msg: m, ...rest } = record
    // eslint-disable-next-line no-console
    sink(`${ts} ${level.toUpperCase()} [${scope}] ${m}`, rest)
  }
}

export function createLogger(scope: string, defaults: LogFields = {}): Logger {
  const make = (extra: LogFields): Logger => ({
    debug: (msg, fields) => emit('debug', scope, msg, { ...extra, ...fields }),
    info: (msg, fields) => emit('info', scope, msg, { ...extra, ...fields }),
    warn: (msg, fields) => emit('warn', scope, msg, { ...extra, ...fields }),
    error: (msg, fields) => emit('error', scope, msg, { ...extra, ...fields }),
    child: (fields) => make({ ...extra, ...fields }),
  })
  return make(defaults)
}

/** Default app-scoped logger. */
export const logger = createLogger('app')
