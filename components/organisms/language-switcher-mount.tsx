// Server component wrapper for LanguageSwitcher.
//
// Resolves the effective server locale once via getServerLocale() and passes
// it down to the client switcher so the initial render matches what the rest
// of the server tree is using — avoiding a flash of the default locale.

import { LanguageSwitcher } from './language-switcher'
import { getServerLocale } from '@/lib/i18n/server-dictionary'

export interface LanguageSwitcherMountProps {
  variant?: 'dropdown' | 'inline'
  className?: string
}

export async function LanguageSwitcherMount({
  variant = 'dropdown',
  className,
}: LanguageSwitcherMountProps) {
  const locale = await getServerLocale()
  return (
    <LanguageSwitcher
      currentLocale={locale}
      variant={variant}
      className={className}
    />
  )
}

export default LanguageSwitcherMount
