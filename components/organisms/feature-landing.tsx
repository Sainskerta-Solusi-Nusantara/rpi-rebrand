import * as React from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/atoms/button'

export interface FeatureItem {
  title: string
  desc: string
}

export interface LandingCta {
  label: string
  href: string
}

export interface FeatureLandingProps {
  eyebrow: string
  title: string
  subtitle: string
  primaryCta: LandingCta
  secondaryCta?: LandingCta
  featuresHeading: string
  features: FeatureItem[]
}

/**
 * Reusable marketing landing layout: hero with CTAs + a feature grid.
 * Server component shared by the public feature pages (CV builder,
 * community, employer post-a-job, employer talent search).
 */
export function FeatureLanding({
  eyebrow,
  title,
  subtitle,
  primaryCta,
  secondaryCta,
  featuresHeading,
  features,
}: FeatureLandingProps) {
  return (
    <>
      {/* Hero */}
      <section className="border-b border-border bg-muted/30 py-20 md:py-28">
        <div className="container mx-auto w-full max-w-3xl px-6 text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {eyebrow}
            </span>
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
          </div>
          <h1 className="font-heading text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            {title}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            {subtitle}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href={primaryCta.href as Route}>
                {primaryCta.label}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
            {secondaryCta && (
              <Button asChild size="lg" variant="outline">
                <Link href={secondaryCta.href as Route}>
                  {secondaryCta.label}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-background py-16 md:py-24" aria-labelledby="features-heading">
        <div className="container mx-auto w-full max-w-6xl px-6">
          <h2
            id="features-heading"
            className="mb-12 text-center font-heading text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
          >
            {featuresHeading}
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((f) => (
              <article
                key={f.title}
                className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-[color:var(--ring)]"
              >
                <h3 className="font-heading text-lg font-semibold text-foreground">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {f.desc}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

export default FeatureLanding
