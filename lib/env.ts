import { z } from 'zod'

/**
 * Runtime environment-variable schema for the RPI SaaS.
 * Fails fast on boot when required values are missing or malformed.
 */
const optionalUrl = z.preprocess(
  (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
  z.string().url().optional(),
)
const optionalString = z.preprocess(
  (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
  z.string().optional(),
)

const envSchema = z.object({
  // ----- Core -----
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // ----- Database -----
  DATABASE_URL: z.string().url(),

  // ----- NextAuth -----
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url(),

  // ----- OAuth (optional) -----
  GOOGLE_CLIENT_ID: optionalString,
  GOOGLE_CLIENT_SECRET: optionalString,
  MICROSOFT_OAUTH_CLIENT_ID: optionalString,
  MICROSOFT_OAUTH_CLIENT_SECRET: optionalString,
  MICROSOFT_OAUTH_REDIRECT_URI: optionalUrl,

  // ----- Public -----
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_ROOT_DOMAIN: z.string().min(1),

  // ----- Storage -----
  STORAGE_PROVIDER: z.enum(['local', 'r2']).default('local'),
  R2_ACCOUNT_ID: optionalString,
  R2_ACCESS_KEY_ID: optionalString,
  R2_SECRET_ACCESS_KEY: optionalString,
  R2_BUCKET_NAME: optionalString,
  R2_PUBLIC_URL: optionalUrl,

  // ----- Cache -----
  REDIS_URL: optionalUrl,

  // ----- Email -----
  RESEND_API_KEY: optionalString,
  EMAIL_FROM: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().email().optional(),
  ),

  // ----- Cron / scheduled jobs -----
  CRON_SECRET: optionalString,

  // ----- Web Push (VAPID) -----
  // Generate via: npx web-push generate-vapid-keys
  // NEXT_PUBLIC_VAPID_PUBLIC_KEY is exposed to the browser (URL-safe base64)
  // VAPID_PRIVATE_KEY stays server-side
  // VAPID_SUBJECT must be a "mailto:..." or "https://..." URI per RFC 8292
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: optionalString,
  VAPID_PRIVATE_KEY: optionalString,
  VAPID_SUBJECT: optionalString,
})

const parsed = envSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  MICROSOFT_OAUTH_CLIENT_ID: process.env.MICROSOFT_OAUTH_CLIENT_ID,
  MICROSOFT_OAUTH_CLIENT_SECRET: process.env.MICROSOFT_OAUTH_CLIENT_SECRET,
  MICROSOFT_OAUTH_REDIRECT_URI: process.env.MICROSOFT_OAUTH_REDIRECT_URI,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_ROOT_DOMAIN: process.env.NEXT_PUBLIC_ROOT_DOMAIN,
  STORAGE_PROVIDER: process.env.STORAGE_PROVIDER,
  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
  R2_PUBLIC_URL: process.env.R2_PUBLIC_URL,
  REDIS_URL: process.env.REDIS_URL,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
  CRON_SECRET: process.env.CRON_SECRET,
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
  VAPID_SUBJECT: process.env.VAPID_SUBJECT,
})

if (!parsed.success) {
  // Skip build-time/test failures during `next build` lint pass when only public vars exist.
  const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build'
  // eslint-disable-next-line no-console
  console.error(
    '❌ Invalid environment variables:\n',
    JSON.stringify(parsed.error.flatten().fieldErrors, null, 2),
  )
  if (!isBuildPhase) {
    throw new Error('Invalid environment variables — see logs above.')
  }
}

export const env = (parsed.success ? parsed.data : ({} as z.infer<typeof envSchema>)) as Readonly<
  z.infer<typeof envSchema>
>

export type Env = z.infer<typeof envSchema>
