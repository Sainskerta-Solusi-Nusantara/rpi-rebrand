'use client'

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'
import type { Session } from 'next-auth'
import type { ReactNode } from 'react'

/**
 * Client wrapper around next-auth's SessionProvider so it can be rendered from
 * the (server) dashboard layout. next-auth/react's provider relies on React
 * Context, which is unavailable in Server Components — this 'use client'
 * boundary is what makes it safe to mount there.
 */
export function SessionProvider({
  children,
  session,
}: {
  children: ReactNode
  session?: Session | null
}) {
  return (
    <NextAuthSessionProvider session={session}>
      {children}
    </NextAuthSessionProvider>
  )
}
