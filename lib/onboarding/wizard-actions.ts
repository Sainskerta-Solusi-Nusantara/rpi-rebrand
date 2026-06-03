'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { AuditAction } from '@prisma/client'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth/session'
import { MAX_WIZARD_STEP_INDEX } from '@/lib/onboarding/wizard-config'
import { getServerT } from '@/lib/i18n/server-dictionary'

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; field?: string }

function getRequestMeta() {
  try {
    const h = headers()
    return {
      ip:
        h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        h.get('x-real-ip') ??
        null,
      userAgent: h.get('user-agent') ?? null,
    }
  } catch {
    return { ip: null, userAgent: null }
  }
}

const advanceSchema = z.object({
  step: z
    .number({ required_error: 'Step wajib diisi' })
    .int('Step harus bilangan bulat')
    .min(0, 'Step minimal 0')
    .max(MAX_WIZARD_STEP_INDEX, `Step maksimal ${MAX_WIZARD_STEP_INDEX}`),
})

/**
 * Set the authenticated user's onboarding step to the given index. If `step`
 * equals the final step index, also marks onboardingCompleted = true.
 */
export async function advanceOnboardingStep(input: {
  step: number
}): Promise<ActionResult<{ step: number; completed: boolean }>> {
  const t = await getServerT()
  const session = await requireAuth()

  const parsed = advanceSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? t.srvAuth4.onboarding.invalidData,
      field: issue?.path[0] as string | undefined,
    }
  }
  const { step } = parsed.data
  const completed = step >= MAX_WIZARD_STEP_INDEX

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        onboardingStep: step,
        ...(completed ? { onboardingCompleted: true } : {}),
      },
    })

    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: AuditAction.UPDATE,
        resource: 'user.onboarding',
        resourceId: session.user.id,
        metadata: { step, completed, kind: 'advance' },
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    revalidatePath('/dashboard')
    revalidatePath('/welcome/[step]', 'page')

    return { ok: true, data: { step, completed } }
  } catch (err) {
    console.error('[advanceOnboardingStep] failed', err)
    return { ok: false, error: t.srvAuth4.onboarding.saveError }
  }
}

/**
 * Mark the wizard as fully completed. Sets onboardingStep = 99 (sentinel for
 * "past the last screen") and onboardingCompleted = true.
 */
export async function completeOnboarding(): Promise<ActionResult> {
  const t = await getServerT()
  const session = await requireAuth()

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        onboardingStep: 99,
        onboardingCompleted: true,
      },
    })

    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: AuditAction.UPDATE,
        resource: 'user.onboarding',
        resourceId: session.user.id,
        metadata: { step: 99, completed: true, kind: 'complete' },
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    revalidatePath('/dashboard')
    return { ok: true }
  } catch (err) {
    console.error('[completeOnboarding] failed', err)
    return { ok: false, error: t.srvAuth4.onboarding.completeError }
  }
}

/**
 * Skip the wizard entirely without progressing through the steps. Leaves
 * onboardingStep as-is so resuming later restarts from where the user was.
 */
export async function skipOnboarding(): Promise<ActionResult> {
  const t = await getServerT()
  const session = await requireAuth()

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { onboardingCompleted: true },
    })

    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: AuditAction.UPDATE,
        resource: 'user.onboarding',
        resourceId: session.user.id,
        metadata: { completed: true, kind: 'skip' },
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    revalidatePath('/dashboard')
    return { ok: true }
  } catch (err) {
    console.error('[skipOnboarding] failed', err)
    return { ok: false, error: t.srvAuth4.onboarding.skipError }
  }
}
