import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth/session'
import {
  MAX_WIZARD_STEP_INDEX,
  TOTAL_WIZARD_STEPS,
  WIZARD_STEPS,
} from '@/lib/onboarding/wizard-config'
import { OnboardingProgressBar } from '@/components/organisms/onboarding-progress-bar'
import { OnboardingSkipButton } from '@/components/organisms/onboarding-skip-button'
import { OnboardingStepWelcome } from '@/components/organisms/onboarding-step-welcome'
import { OnboardingStepVerifyEmail } from '@/components/organisms/onboarding-step-verify-email'
import { OnboardingStepProfile } from '@/components/organisms/onboarding-step-profile'
import { OnboardingStepResume } from '@/components/organisms/onboarding-step-resume'
import { OnboardingStepInterests } from '@/components/organisms/onboarding-step-interests'
import { OnboardingStepExplore } from '@/components/organisms/onboarding-step-explore'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: { step: string }
}

export default async function WelcomeStepPage({ params }: PageProps) {
  const session = await requireAuth(`/welcome/${params.step}`)

  const parsedStep = Number.parseInt(params.step, 10)
  if (
    !Number.isInteger(parsedStep) ||
    parsedStep < 0 ||
    parsedStep > MAX_WIZARD_STEP_INDEX
  ) {
    notFound()
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      headline: true,
      bio: true,
      location: true,
      onboardingStep: true,
      onboardingCompleted: true,
    },
  })

  if (!user) {
    redirect('/login')
  }

  if (user.onboardingCompleted) {
    redirect('/dashboard')
  }

  const stepDef = WIZARD_STEPS[parsedStep]
  if (!stepDef) notFound()

  // Determine where the "next" CTA inside each step should navigate to.
  const nextStepIndex = Math.min(parsedStep + 1, MAX_WIZARD_STEP_INDEX)
  const nextRoute = `/welcome/${nextStepIndex}`

  // Auto-skip the verify-email step if the user is already verified.
  if (stepDef.id === 'verify-email' && user.emailVerified != null) {
    redirect(nextRoute)
  }

  let stepContent: React.ReactNode = null
  switch (stepDef.id) {
    case 'welcome':
      stepContent = <OnboardingStepWelcome userName={user.name} />
      break
    case 'verify-email':
      stepContent = (
        <OnboardingStepVerifyEmail
          email={user.email}
          alreadyVerified={user.emailVerified != null}
          nextStep={nextStepIndex}
          nextRoute={nextRoute}
        />
      )
      break
    case 'profile':
      stepContent = (
        <OnboardingStepProfile
          initial={{
            name: user.name,
            headline: user.headline,
            bio: user.bio,
            location: user.location,
          }}
          nextStep={nextStepIndex}
          nextRoute={nextRoute}
        />
      )
      break
    case 'resume':
      stepContent = (
        <OnboardingStepResume nextStep={nextStepIndex} nextRoute={nextRoute} />
      )
      break
    case 'interests':
      stepContent = (
        <OnboardingStepInterests
          nextStep={nextStepIndex}
          nextRoute={nextRoute}
        />
      )
      break
    case 'explore':
      stepContent = <OnboardingStepExplore userName={user.name} />
      break
  }

  return (
    <div className="flex flex-1 flex-col gap-8">
      <header className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <Link
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            href={'/dashboard' as any}
            className="font-heading text-primary text-lg font-semibold"
          >
            RPI
          </Link>
          <OnboardingSkipButton />
        </div>
        <OnboardingProgressBar
          currentStep={parsedStep}
          totalSteps={TOTAL_WIZARD_STEPS}
          labels={WIZARD_STEPS.map((s) => s.title)}
        />
      </header>

      <section className="border-border bg-card flex-1 rounded-2xl border p-6 shadow-sm sm:p-8">
        <div className="mb-6 space-y-1">
          <h2 className="font-heading text-xl md:text-2xl">{stepDef.title}</h2>
          <p className="text-muted-foreground text-sm">{stepDef.description}</p>
        </div>
        {stepContent}
      </section>

      <footer className="text-muted-foreground flex items-center justify-between gap-3 pb-2 text-xs">
        <span>
          Langkah {parsedStep + 1} dari {TOTAL_WIZARD_STEPS}
        </span>
        {parsedStep > 0 ? (
          <Link
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            href={`/welcome/${parsedStep - 1}` as any}
            className="hover:text-foreground underline-offset-4 hover:underline"
          >
            Kembali
          </Link>
        ) : (
          <span />
        )}
      </footer>
    </div>
  )
}
