import 'server-only'

import Anthropic from '@anthropic-ai/sdk'
import { env } from '@/lib/env'

/**
 * Thin, server-only wrapper around the Anthropic (Claude) SDK.
 *
 * Design goals:
 *  - **Graceful degradation.** When `ANTHROPIC_API_KEY` is absent the client is
 *    simply unavailable; callers detect this via `isAiConfigured()` and fall
 *    back to their deterministic template/heuristic path. This keeps `next
 *    build` green and the app fully functional with no key configured.
 *  - **Never leak the key.** `import 'server-only'` makes a build fail loudly if
 *    this module is ever pulled into a client bundle.
 *  - **Single source of truth** for the model id and a small JSON helper used by
 *    the AI-backed features (JD generator, future screening, etc.).
 */

// Default to the current fast+capable Sonnet tier — a good balance of quality
// and cost for short generation tasks. Overridable via ANTHROPIC_MODEL.
const DEFAULT_MODEL = 'claude-sonnet-4-6'

let cached: Anthropic | null | undefined

/** Returns a memoized client, or null when no API key is configured. */
export function getAnthropic(): Anthropic | null {
  if (cached !== undefined) return cached
  const apiKey = env.ANTHROPIC_API_KEY
  cached = apiKey ? new Anthropic({ apiKey }) : null
  return cached
}

/** True when a real LLM call is possible. Callers branch on this to decide
 *  whether to attempt AI or go straight to their fallback. */
export function isAiConfigured(): boolean {
  return Boolean(env.ANTHROPIC_API_KEY)
}

export function aiModel(): string {
  return env.ANTHROPIC_MODEL || DEFAULT_MODEL
}

/** Concatenate all text blocks of a Claude response into a single string. */
function extractText(message: Anthropic.Message): string {
  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
}

/** Strip ```json … ``` / ``` … ``` fences a model may wrap JSON in. */
function stripCodeFences(s: string): string {
  const trimmed = s.trim()
  const fence = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmed)
  return fence?.[1]?.trim() ?? trimmed
}

export class AiError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message)
    this.name = 'AiError'
  }
}

/**
 * Ask Claude for a single JSON object and return it parsed.
 *
 * Throws `AiError` when AI is not configured, the call fails, or the response
 * is not valid JSON. Callers are expected to catch and fall back. The prompt
 * MUST instruct the model to return only a JSON object.
 */
export async function generateJson<T = unknown>(opts: {
  system: string
  prompt: string
  maxTokens?: number
  temperature?: number
}): Promise<T> {
  const client = getAnthropic()
  if (!client) throw new AiError('Anthropic API key not configured')

  let text: string
  try {
    const message = await client.messages.create({
      model: aiModel(),
      max_tokens: opts.maxTokens ?? 2048,
      temperature: opts.temperature ?? 0.7,
      system: opts.system,
      messages: [{ role: 'user', content: opts.prompt }],
    })
    text = extractText(message)
  } catch (err) {
    throw new AiError('Anthropic request failed', err)
  }

  try {
    return JSON.parse(stripCodeFences(text)) as T
  } catch (err) {
    throw new AiError('Anthropic response was not valid JSON', err)
  }
}
