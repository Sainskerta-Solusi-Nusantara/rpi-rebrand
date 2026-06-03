'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { MotionConfig } from 'framer-motion'
import { I18nProvider } from '@/lib/i18n/i18n-provider'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {/* reducedMotion="user" makes every framer-motion animation respect the
          OS "reduce motion" setting (disables transform/layout animations for
          users with vestibular sensitivity). CSS animations/transitions are
          handled by the prefers-reduced-motion block in globals.css. */}
      <MotionConfig reducedMotion="user">
        <I18nProvider>{children}</I18nProvider>
      </MotionConfig>
    </NextThemesProvider>
  )
}
