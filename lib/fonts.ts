import { Inter, JetBrains_Mono, Playfair_Display } from 'next/font/google'

// Weights trimmed to those actually used in the UI (no font-light/extrabold/
// black anywhere). Fewer weights = fewer font files on the critical path.
export const heading = Playfair_Display({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  display: 'swap',
  variable: '--font-heading',
})

export const sans = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-sans',
})

export const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-mono',
})
