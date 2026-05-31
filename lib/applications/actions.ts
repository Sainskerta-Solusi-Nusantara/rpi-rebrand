'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { AuditAction, ApplicationStatus } from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { env } from '@/lib/env'
import {
  sendEmail,
  applicationReceivedEmail,
  applicationNotifyEmail,
} from '@/lib/mailer'

export type ActionResult = { ok: true } | { ok: false; error: string; field?: string }

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

const submitApplicationSchema = z.object({
  jobSlug: z.string().min(1, 'Slug lowongan wajib diisi.'),
  resumeId: z
    .string()
    .min(1)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  coverLetter: z
    .string()
    .max(5000, 'Cover letter maksimal 5000 karakter.')
    .optional()
    .or(z.literal('').transform(() => undefined)),
})

/**
 * Submit an application to a published Job.
 *
 * Slug-uniqueness note:
 * Job.slug is unique only within a tenant, not globally. We mirror the existing
 * `findJob` helper in lib/jobs-data.ts which uses `findFirst({ slug, status:
 * PUBLISHED })`. Public detail pages already rely on first-published-wins for
 * slug collisions, so this stays consistent.
 */
export async function submitApplication(input: {
  jobSlug: string
  resumeId?: string
  coverLetter?: string
}): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: 'Anda harus masuk untuk melamar.' }
  }
  const userId = session.user.id

  const parsed = submitApplicationSchema.safeParse(input)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return {
      ok: false,
      error: first?.message ?? 'Input tidak valid.',
      field: first?.path?.[0]?.toString(),
    }
  }
  const { jobSlug, resumeId } = parsed.data
  const coverLetter = parsed.data.coverLetter?.trim() || undefined

  try {
    const job = await prisma.job.findFirst({
      where: { slug: jobSlug, status: 'PUBLISHED' },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        tenantId: true,
        tenant: {
          select: {
            id: true,
            slug: true,
            name: true,
            ownerUserId: true,
          },
        },
      },
    })

    if (!job) {
      return { ok: false, error: 'Lowongan tidak ditemukan.' }
    }
    if (job.status !== 'PUBLISHED') {
      return { ok: false, error: 'Lowongan ini sudah tidak menerima lamaran.' }
    }

    const existing = await prisma.application.findUnique({
      where: { jobId_userId: { jobId: job.id, userId } },
      select: { id: true, status: true },
    })
    if (existing) {
      return {
        ok: false,
        error: 'Anda sudah pernah melamar lowongan ini.',
      }
    }

    let resumeUrl: string | null = null
    if (resumeId) {
      const resume = await prisma.resume.findFirst({
        where: { id: resumeId, userId },
        select: { id: true, fileUrl: true },
      })
      if (!resume) {
        return {
          ok: false,
          error: 'CV tidak ditemukan atau bukan milik Anda.',
          field: 'resumeId',
        }
      }
      resumeUrl = resume.fileUrl ?? null
    }

    const meta = getRequestMeta()

    const application = await prisma.application.create({
      data: {
        tenantId: job.tenantId,
        jobId: job.id,
        userId,
        resumeUrl,
        coverLetter: coverLetter ?? null,
      },
      select: { id: true },
    })

    await prisma.auditLog.create({
      data: {
        tenantId: job.tenantId,
        userId,
        action: AuditAction.CREATE,
        resource: 'application',
        resourceId: application.id,
        metadata: {
          jobId: job.id,
          jobSlug: job.slug,
          tenantSlug: job.tenant.slug,
          hasResume: Boolean(resumeUrl),
          hasCoverLetter: Boolean(coverLetter),
        },
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    // Best-effort notifications — never fail the submission on email errors.
    const baseUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
    const applicantUser = await prisma.user
      .findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      })
      .catch(() => null)

    if (applicantUser?.email) {
      try {
        const tpl = applicationReceivedEmail({
          name: applicantUser.name,
          jobTitle: job.title,
          tenantName: job.tenant.name,
          applicationUrl: `${baseUrl}/dashboard/lamaran`,
        })
        await sendEmail({
          to: applicantUser.email,
          subject: tpl.subject,
          text: tpl.text,
          html: tpl.html,
        })
      } catch (err) {
        console.error('[submitApplication] applicant notify failed', err)
      }
    }

    if (job.tenant.ownerUserId) {
      try {
        const owner = await prisma.user.findUnique({
          where: { id: job.tenant.ownerUserId },
          select: { email: true, name: true },
        })
        if (owner?.email) {
          const tpl = applicationNotifyEmail({
            recipientName: owner.name,
            applicantName: applicantUser?.name ?? 'Kandidat',
            applicantEmail: applicantUser?.email ?? '-',
            jobTitle: job.title,
            dashboardUrl: `${baseUrl}/dashboard/tenants/${job.tenant.slug}/lowongan/${job.slug}/lamaran`,
          })
          await sendEmail({
            to: owner.email,
            subject: tpl.subject,
            text: tpl.text,
            html: tpl.html,
          })
        }
      } catch (err) {
        console.error('[submitApplication] recruiter notify failed', err)
      }
    }

    // TODO: dispatchTenantEvent('application.submitted', …) — event not yet in
    // the WEBHOOK_EVENTS allowlist (lib/webhooks/events.ts). Skipped until that
    // catalogue is extended; webhook subscribers cannot receive it yet.

    // -----------------------------------------------------------------
    // BEGIN: Referral viral hook — best-effort. Never block submission.
    // -----------------------------------------------------------------
    try {
      const { recordReferralApplication } = await import('@/lib/referrals/actions')
      await recordReferralApplication({ applicationId: application.id })
    } catch (err) {
      console.error('[submitApplication] referral record failed', err)
    }
    // -----------------------------------------------------------------
    // END: Referral viral hook
    // -----------------------------------------------------------------

    revalidatePath(`/jobs/${job.slug}`)
    revalidatePath('/dashboard/lamaran')
    return { ok: true }
  } catch (err) {
    console.error('[submitApplication] failed', err)
    return { ok: false, error: 'Gagal mengirim lamaran. Coba lagi sebentar.' }
  }
}

const WITHDRAWABLE_STATUSES: ApplicationStatus[] = [
  ApplicationStatus.APPLIED,
  ApplicationStatus.REVIEWED,
  ApplicationStatus.SHORTLISTED,
  ApplicationStatus.INTERVIEW,
]

/**
 * Withdraw an application owned by the signed-in user.
 *
 * Only allowed while the application is in an early stage (APPLIED → INTERVIEW).
 * Refuses once the application reaches OFFERED / HIRED / REJECTED / WITHDRAWN.
 */
export async function withdrawApplication(
  applicationId: string,
): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: 'Anda harus masuk.' }
  }
  const userId = session.user.id

  if (!applicationId || typeof applicationId !== 'string') {
    return { ok: false, error: 'ID lamaran tidak valid.' }
  }

  try {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      select: {
        id: true,
        userId: true,
        status: true,
        tenantId: true,
        jobId: true,
        job: { select: { slug: true } },
      },
    })
    if (!application) {
      return { ok: false, error: 'Lamaran tidak ditemukan.' }
    }
    if (application.userId !== userId) {
      return { ok: false, error: 'Anda tidak berhak menarik lamaran ini.' }
    }
    if (!WITHDRAWABLE_STATUSES.includes(application.status)) {
      return {
        ok: false,
        error:
          'Lamaran ini tidak dapat ditarik pada tahap saat ini.',
      }
    }

    const meta = getRequestMeta()

    await prisma.$transaction([
      prisma.application.update({
        where: { id: application.id },
        data: { status: ApplicationStatus.WITHDRAWN },
      }),
      prisma.auditLog.create({
        data: {
          tenantId: application.tenantId,
          userId,
          action: AuditAction.UPDATE,
          resource: 'application',
          resourceId: application.id,
          metadata: {
            previousStatus: application.status,
            newStatus: ApplicationStatus.WITHDRAWN,
            jobId: application.jobId,
          },
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      }),
    ])

    revalidatePath('/dashboard/lamaran')
    if (application.job?.slug) {
      revalidatePath(`/jobs/${application.job.slug}`)
    }
    return { ok: true }
  } catch (err) {
    console.error('[withdrawApplication] failed', err)
    return { ok: false, error: 'Gagal menarik lamaran. Coba lagi sebentar.' }
  }
}
