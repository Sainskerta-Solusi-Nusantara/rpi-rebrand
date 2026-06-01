import * as React from 'react'

export const metadata = { title: 'Onboarding' }

/**
 * Minimal shell for the onboarding wizard. Does NOT include the public site
 * header/footer or the dashboard chrome — the wizard owns the full viewport
 * to keep users focused on the flow.
 */
export default function WelcomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-6 sm:px-6 sm:py-10">
        {children}
      </main>
    </div>
  )
}
