import * as React from 'react'

export interface LegalSection {
  heading: string
  paragraphs?: string[]
  bullets?: string[]
}

export interface LegalDocLayoutProps {
  eyebrow: string
  title: string
  intro: string
  lastUpdated: string
  sections: LegalSection[]
}

/**
 * Shared prose layout for static legal pages (Privacy, Terms, Cookies).
 * Server component — no interactivity, just typeset content using the
 * shared design tokens so every legal document reads consistently.
 */
export function LegalDocLayout({
  eyebrow,
  title,
  intro,
  lastUpdated,
  sections,
}: LegalDocLayoutProps) {
  return (
    <>
      {/* Hero */}
      <section className="border-b border-border bg-muted/30 py-16 md:py-20">
        <div className="container mx-auto w-full max-w-3xl px-6">
          <div className="mb-4 flex items-center gap-3">
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {eyebrow}
            </span>
          </div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            {title}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
            {intro}
          </p>
          <p className="mt-6 text-xs text-muted-foreground">
            Terakhir diperbarui: {lastUpdated}
          </p>
        </div>
      </section>

      {/* Body */}
      <section className="bg-background py-16 md:py-20">
        <div className="container mx-auto w-full max-w-3xl px-6">
          <div className="space-y-10">
            {sections.map((section, i) => (
              <article key={section.heading} aria-labelledby={`legal-section-${i}`}>
                <h2
                  id={`legal-section-${i}`}
                  className="font-heading text-xl font-semibold tracking-tight text-foreground md:text-2xl"
                >
                  {section.heading}
                </h2>
                {section.paragraphs?.map((p, pi) => (
                  <p
                    key={pi}
                    className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base"
                  >
                    {p}
                  </p>
                ))}
                {section.bullets && section.bullets.length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {section.bullets.map((b, bi) => (
                      <li
                        key={bi}
                        className="flex gap-3 text-sm leading-relaxed text-muted-foreground md:text-base"
                      >
                        <span
                          aria-hidden
                          className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--ring)]"
                        />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

export default LegalDocLayout
