'use client'

import * as React from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  Mail,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  BellRing,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/i18n-provider'

export interface NewsletterSignupProps {
  className?: string
}

type SubmissionStatus = 'idle' | 'submitting' | 'success'

const FLOATING_SHAPES = [
  {
    className:
      'left-[6%] top-[12%] h-16 w-16 bg-secondary/30 blur-2xl',
    duration: 6,
    delay: 0,
    distance: 14,
  },
  {
    className:
      'right-[8%] top-[20%] h-20 w-20 bg-indigo-400/30 blur-3xl',
    duration: 7.5,
    delay: 0.6,
    distance: 18,
  },
  {
    className:
      'left-[12%] bottom-[14%] h-24 w-24 bg-secondary/20 blur-3xl',
    duration: 8,
    delay: 1.2,
    distance: 20,
  },
  {
    className:
      'right-[14%] bottom-[10%] h-14 w-14 bg-primary-foreground/20 blur-2xl',
    duration: 6.5,
    delay: 0.3,
    distance: 12,
  },
] as const

export function NewsletterSignup(props: NewsletterSignupProps): JSX.Element {
  const { className } = props
  const { t } = useI18n()
  const tn = t.formsMarketing.newsletter

  const [email, setEmail] = React.useState('')
  const [name, setName] = React.useState('')
  const [status, setStatus] = React.useState<SubmissionStatus>('idle')

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (status === 'submitting') return
    setStatus('submitting')
    setTimeout(() => {
      setStatus('success')
    }, 800)
  }

  const isSubmitting = status === 'submitting'
  const isSuccess = status === 'success'

  return (
    <section
      className={cn(
        'relative bg-background py-20 md:py-28',
        className,
      )}
      aria-labelledby="newsletter-signup-heading"
    >
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.005 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={cn(
            'relative overflow-hidden rounded-3xl border border-secondary/30 shadow-2xl',
            'bg-gradient-to-br from-primary via-primary/95 to-[#061a30]',
            'ring-1 ring-secondary/20',
          )}
        >
          {/* Decorative background image (lg+) */}
          <div
            className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 lg:block"
            aria-hidden="true"
          >
            <Image
              src="https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=900&q=80"
              alt=""
              fill
              sizes="(min-width: 1024px) 50vw, 0vw"
              className="object-cover opacity-20 mix-blend-overlay"
              priority={false}
            />
            <div
              className="absolute inset-0 bg-gradient-to-r from-primary via-primary/60 to-transparent"
              aria-hidden="true"
            />
          </div>

          {/* Floating decorative shapes */}
          {FLOATING_SHAPES.map((shape, index) => (
            <motion.div
              key={index}
              aria-hidden="true"
              className={cn(
                'pointer-events-none absolute rounded-full',
                shape.className,
              )}
              animate={{ y: [0, -shape.distance, 0] }}
              transition={{
                duration: shape.duration,
                delay: shape.delay,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}

          <div className="relative grid gap-10 p-8 md:p-12 lg:grid-cols-2 lg:gap-12 lg:p-16">
            {/* LEFT: Copy */}
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-secondary/40 bg-secondary/15 px-3 py-1.5 text-xs font-medium text-secondary">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{tn.badge}</span>
              </div>

              <h2
                id="newsletter-signup-heading"
                className="mt-5 font-heading text-3xl text-primary-foreground md:text-4xl"
              >
                {tn.heading}
              </h2>

              <p className="mt-4 max-w-lg text-base text-primary-foreground/80">
                {tn.body}
              </p>

              <ul className="mt-6 space-y-3" role="list">
                {tn.benefits.map((benefit) => (
                  <li
                    key={benefit}
                    className="flex items-start gap-3 text-sm text-primary-foreground/90"
                  >
                    <CheckCircle2
                      className="mt-0.5 h-5 w-5 shrink-0 text-secondary"
                      aria-hidden="true"
                    />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* RIGHT: Form */}
            <div className="relative">
              {isSuccess ? (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="flex items-start gap-3 rounded-xl bg-secondary/15 p-6 text-secondary"
                  role="status"
                  aria-live="polite"
                >
                  <CheckCircle2
                    className="mt-0.5 h-6 w-6 shrink-0"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="font-semibold">
                      {tn.successTitle}
                    </p>
                    <p className="mt-1 text-sm text-secondary/90">
                      {tn.successBody}
                    </p>
                  </div>
                </motion.div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="rounded-2xl border border-primary-foreground/20 bg-background/10 p-6 backdrop-blur"
                  noValidate
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label
                        htmlFor="newsletter-email"
                        className="text-sm text-primary-foreground/80"
                      >
                        {tn.emailLabel}
                      </label>
                      <Input
                        id="newsletter-email"
                        type="email"
                        required
                        autoComplete="email"
                        placeholder={tn.emailPlaceholder}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isSubmitting}
                        prefix={<Mail className="h-4 w-4" aria-hidden="true" />}
                        containerClassName="h-12 rounded-xl bg-background text-foreground border border-input px-4"
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="newsletter-name"
                        className="text-sm text-primary-foreground/80"
                      >
                        {tn.nameLabel}
                      </label>
                      <Input
                        id="newsletter-name"
                        type="text"
                        autoComplete="name"
                        placeholder={tn.namePlaceholder}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isSubmitting}
                        containerClassName="h-12 rounded-xl bg-background text-foreground border border-input px-4"
                        className="h-12 rounded-xl border border-input bg-background px-4 text-foreground"
                      />
                    </div>

                    <Button
                      type="submit"
                      variant="secondary"
                      size="lg"
                      disabled={isSubmitting}
                      className="w-full"
                      aria-label={tn.ariaSubmit}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2
                            className="h-4 w-4 animate-spin"
                            aria-hidden="true"
                          />
                          <span>{tn.submitBusy}</span>
                        </>
                      ) : (
                        <>
                          <span>{tn.submitIdle}</span>
                          <ArrowRight
                            className="h-4 w-4"
                            aria-hidden="true"
                          />
                        </>
                      )}
                    </Button>

                    <p className="flex items-center justify-center gap-2 text-xs text-primary-foreground/70">
                      <BellRing className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{tn.antiSpam}</span>
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default NewsletterSignup
