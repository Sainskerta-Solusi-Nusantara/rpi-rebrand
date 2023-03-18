import { z } from 'zod'

/**
 * Runtime environment-variable schema for the RPI SaaS.
 * Fails fast on boot when required values are missing or malformed.
 */
const envSchema = z.object({
  // ----- Core -----
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // ----- Database -----
  DATABASE_URL: z.string().url(),

  // ----- NextAuth -----
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url(),

  // ----- OAuth (optional) -----
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // ----- Public -----
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_ROOT_DOMAIN: z.string().min(1),

  // ----- Storage -----
  STORAGE_PROVIDER: z.enum(['local', 'r2']).default('local'),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_PUBLIC_URL: z.string().url().optional(),

  // ----- Cache -----
  REDIS_URL: z.string().url().optional(),

  // ----- Email -----
  RESEND_API_KEY: z.string().optional(),
})

const parsed = envSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
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
