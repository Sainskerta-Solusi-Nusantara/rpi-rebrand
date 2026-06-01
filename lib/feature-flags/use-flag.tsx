'use client'

import { useEffect, useState } from 'react'

export type UseFeatureFlagOptions = {
  userId?: string
  tenantId?: string
  environment?: 'dev' | 'staging' | 'prod'
}

export type UseFeatureFlagResult = {
  value: boolean | null
  loading: boolean
  error: string | null
}

/**
 * Session-scoped cache so repeated calls for the same (key, userId, tenantId,
 * environment) tuple don't re-hit the API. Cleared on full page reload.
 */
const cache = new Map<string, boolean>()
const inflight = new Map<string, Promise<boolean | null>>()

function cacheKey(key: string, opts: UseFeatureFlagOptions): string {
  return JSON.stringify({
    k: key,
    u: opts.userId ?? '',
    t: opts.tenantId ?? '',
    e: opts.environment ?? '',
  })
}

async function fetchFlag(key: string, opts: UseFeatureFlagOptions): Promise<boolean | null> {
  const params = new URLSearchParams({ key })
  if (opts.userId) params.set('userId', opts.userId)
  if (opts.tenantId) params.set('tenantId', opts.tenantId)
  if (opts.environment) params.set('environment', opts.environment)
  const res = await fetch(`/api/feature-flags/evaluate?${params.toString()}`, {
    method: 'GET',
    credentials: 'same-origin',
  })
  if (!res.ok) return null
  const body = (await res.json().catch(() => null)) as
    | { ok: true; data: { value: boolean } }
    | { ok: false }
    | null
  if (!body || !body.ok) return null
  return Boolean(body.data.value)
}

/**
 * Client-side React hook returning the evaluated boolean for a feature flag.
 * Returns `{ value: null, loading: true }` until the fetch resolves, then
 * `{ value, loading: false }`. On error, value is `false` (default deny).
 */
export function useFeatureFlag(
  key: string,
  opts: UseFeatureFlagOptions = {},
): UseFeatureFlagResult {
  const ck = cacheKey(key, opts)
  const cached = cache.get(ck)
  const [value, setValue] = useState<boolean | null>(cached ?? null)
  const [loading, setLoading] = useState<boolean>(cached === undefined)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let canceled = false
    if (cache.has(ck)) {
      setValue(cache.get(ck) ?? false)
      setLoading(false)
      return () => {
        canceled = true
      }
    }
    setLoading(true)
    const existing = inflight.get(ck)
    const promise = existing ?? fetchFlag(key, opts)
    if (!existing) inflight.set(ck, promise)
    promise
      .then((v) => {
        if (canceled) return
        const final = v ?? false
        cache.set(ck, final)
        inflight.delete(ck)
        setValue(final)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (canceled) return
        inflight.delete(ck)
        setError(err instanceof Error ? err.message : String(err))
        setValue(false)
        setLoading(false)
      })
    return () => {
      canceled = true
    }
    // ck is a stable string covering all opt fields → safe single dep
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ck])

  return { value, loading, error }
}

/** Test/debug helper: drop all cached evaluations from this session. */
export function clearFeatureFlagCache(): void {
  cache.clear()
  inflight.clear()
}
