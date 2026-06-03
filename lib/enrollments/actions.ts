'use server'

import fs from 'node:fs/promises'
import path from 'node:path'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import {
  AuditAction,
  CourseStatus,
  EnrollmentStatus,
} from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { buildCertificateSvg } from '@/lib/enrollments/certificate-svg'
import { getServerT } from '@/lib/i18n/server-dictionary'

/**
 * Result envelope used by every action in this file. The generic T merges
 * extra success-path fields into the `{ ok: true }` shape. Use `void` (the
 * default) when the caller only needs to know success/failure.
 */
export type ActionResult<T = void> = T extends void
  ? { ok: true } | { ok: false; error: string; field?: string }
  : ({ ok: true } & T) | { ok: false; error: string; field?: string }

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

// ---------------------------------------------------------------------------
// enrollInCourse
// ---------------------------------------------------------------------------

const enrollSchema = z.object({
  courseSlug: z.string().min(1, 'Slug kursus wajib diisi.'),
})

/**
 * Enroll the signed-in user in a PUBLISHED course.
 *
 * Slug-uniqueness note: Course.slug is unique within a tenant only — we use
 * `findFirst({ slug, status: PUBLISHED })` to mirror `findCourse` in
 * lib/courses-data.ts (first-published-wins on cross-tenant collisions).
 */
export async function enrollInCourse(input: {
  courseSlug: string
}): Promise<ActionResult<{ enrollmentId: string }>> {
  const t = await getServerT()
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: t.srvScoring.enrollments.mustLoginEnroll }
  }
  const userId = session.user.id

  const parsed = enrollSchema.safeParse(input)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return {
      ok: false,
      error: first?.message ?? t.srvScoring.enrollments.inputInvalid,
      field: first?.path?.[0]?.toString(),
    }
  }
  const { courseSlug } = parsed.data

  try {
    const course = await prisma.course.findFirst({
      where: { slug: courseSlug, status: CourseStatus.PUBLISHED },
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
        tenantId: true,
      },
    })
    if (!course) {
      return { ok: false, error: t.srvScoring.enrollments.courseNotFound }
    }
    if (course.status !== CourseStatus.PUBLISHED) {
      return {
        ok: false,
        error: t.srvScoring.enrollments.courseNotPublished,
      }
    }

    // Duplicate-safe: return the existing enrollment instead of erroring.
    const existing = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: course.id } },
      select: { id: true },
    })
    if (existing) {
      return { ok: true, enrollmentId: existing.id }
    }

    const meta = getRequestMeta()
    const enrollment = await prisma.enrollment.create({
      data: {
        userId,
        courseId: course.id,
        status: EnrollmentStatus.IN_PROGRESS,
        progress: 0,
      },
      select: { id: true },
    })

    await prisma.auditLog.create({
      data: {
        tenantId: course.tenantId,
        userId,
        action: AuditAction.CREATE,
        resource: 'enrollment',
        resourceId: enrollment.id,
        metadata: {
          courseId: course.id,
          courseSlug: course.slug,
          courseTitle: course.title,
        },
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    revalidatePath(`/courses/${course.slug}`)
    revalidatePath('/dashboard/kursus')
    return { ok: true, enrollmentId: enrollment.id }
  } catch (err) {
    console.error('[enrollInCourse] failed', err)
    return { ok: false, error: t.srvScoring.enrollments.enrollFailed }
  }
}

// ---------------------------------------------------------------------------
// markLessonComplete
// ---------------------------------------------------------------------------

const markLessonSchema = z.object({
  enrollmentId: z.string().min(1, 'ID pendaftaran wajib diisi.'),
  lessonId: z.string().min(1, 'ID pelajaran wajib diisi.'),
})

/**
 * Mark a lesson as completed inside an enrollment owned by the caller.
 *
 * Verifies the lesson actually belongs to the enrollment's course (via
 * Module → Lesson). Upserts a LessonProgress row (idempotent — re-running
 * does NOT bump completedAt once set). Recomputes Enrollment.progress and
 * — when crossing 100% — flips status to COMPLETED, stamps completedAt,
 * and auto-issues a Certificate if none exists yet.
 */
export async function markLessonComplete(input: {
  enrollmentId: string
  lessonId: string
}): Promise<
  ActionResult<{
    progress: number
    completed: boolean
    certificateId?: string
  }>
> {
  const t = await getServerT()
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: t.srvScoring.enrollments.mustLogin }
  }
  const userId = session.user.id

  const parsed = markLessonSchema.safeParse(input)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return {
      ok: false,
      error: first?.message ?? t.srvScoring.enrollments.inputInvalid,
      field: first?.path?.[0]?.toString(),
    }
  }
  const { enrollmentId, lessonId } = parsed.data

  try {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      select: {
        id: true,
        userId: true,
        status: true,
        courseId: true,
        course: {
          select: {
            id: true,
            slug: true,
            title: true,
            tenantId: true,
            tenant: { select: { id: true, name: true } },
          },
        },
      },
    })
    if (!enrollment) {
      return { ok: false, error: t.srvScoring.enrollments.enrollmentNotFound }
    }
    if (enrollment.userId !== userId) {
      return { ok: false, error: t.srvScoring.enrollments.enrollmentForbidden }
    }

    // Verify the lesson belongs to a module of this enrollment's course.
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        module: { select: { courseId: true } },
      },
    })
    if (!lesson || lesson.module.courseId !== enrollment.courseId) {
      return {
        ok: false,
        error: t.srvScoring.enrollments.lessonNotInCourse,
      }
    }

    const now = new Date()

    // Upsert: only set completedAt the first time. Re-marking is a no-op.
    await prisma.lessonProgress.upsert({
      where: {
        enrollmentId_lessonId: { enrollmentId, lessonId },
      },
      create: {
        enrollmentId,
        lessonId,
        completedAt: now,
      },
      update: {
        // Idempotent — keep the original completedAt if it's already set.
        // Setting it again to now() would falsify history.
      },
    })

    // Recompute progress from total lesson count on the course.
    const [totalLessons, completedLessons] = await Promise.all([
      prisma.lesson.count({
        where: { module: { courseId: enrollment.courseId } },
      }),
      prisma.lessonProgress.count({
        where: { enrollmentId, completedAt: { not: null } },
      }),
    ])

    const progress =
      totalLessons === 0
        ? 0
        : Math.min(
            100,
            Math.round((completedLessons / totalLessons) * 100),
          )
    const completed = progress >= 100

    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        progress,
        ...(completed
          ? {
              status: EnrollmentStatus.COMPLETED,
              completedAt:
                enrollment.status === EnrollmentStatus.COMPLETED
                  ? undefined
                  : now,
            }
          : {}),
      },
    })

    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        tenantId: enrollment.course.tenantId,
        userId,
        action: AuditAction.UPDATE,
        resource: 'lesson.progress',
        resourceId: lessonId,
        metadata: {
          enrollmentId,
          courseId: enrollment.courseId,
          progress,
          completed,
        },
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    let certificateId: string | undefined
    if (completed) {
      // Auto-issue cert on first completion only — guard via existing lookup.
      const existingCert = await prisma.certificate.findFirst({
        where: { userId, courseId: enrollment.courseId },
        select: { id: true },
      })
      if (!existingCert) {
        const result = await issueCertificateInternal({
          userId,
          enrollmentId,
        })
        if (result.ok) certificateId = result.certificateId
      } else {
        certificateId = existingCert.id
      }
    }

    revalidatePath(`/dashboard/kursus/${enrollment.course.slug}`)
    revalidatePath('/dashboard/kursus')
    if (completed) revalidatePath('/dashboard/sertifikat')
    return { ok: true, progress, completed, certificateId }
  } catch (err) {
    console.error('[markLessonComplete] failed', err)
    return {
      ok: false,
      error: t.srvScoring.enrollments.progressFailed,
    }
  }
}

// ---------------------------------------------------------------------------
// issueCertificate
// ---------------------------------------------------------------------------

const issueSchema = z.object({
  enrollmentId: z.string().min(1, 'ID pendaftaran wajib diisi.'),
})

/**
 * Public entry point used by the dashboard course player ("Klaim sertifikat"
 * button). Verifies ownership + completion, then delegates to the internal
 * helper that does the actual file write + DB insert.
 *
 * Idempotent — if a certificate already exists for (userId, courseId) we
 * return its id instead of creating a duplicate.
 */
export async function issueCertificate(input: {
  enrollmentId: string
}): Promise<ActionResult<{ certificateId: string }>> {
  const t = await getServerT()
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: t.srvScoring.enrollments.mustLogin }
  }
  const userId = session.user.id

  const parsed = issueSchema.safeParse(input)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return {
      ok: false,
      error: first?.message ?? t.srvScoring.enrollments.inputInvalid,
      field: first?.path?.[0]?.toString(),
    }
  }
  const { enrollmentId } = parsed.data

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    select: {
      id: true,
      userId: true,
      status: true,
      courseId: true,
    },
  })
  if (!enrollment) {
    return { ok: false, error: t.srvScoring.enrollments.enrollmentNotFound }
  }
  if (enrollment.userId !== userId) {
    return { ok: false, error: t.srvScoring.enrollments.certForbidden }
  }
  if (enrollment.status !== EnrollmentStatus.COMPLETED) {
    return {
      ok: false,
      error: t.srvScoring.enrollments.certRequiresComplete,
    }
  }

  const existing = await prisma.certificate.findFirst({
    where: { userId, courseId: enrollment.courseId },
    select: { id: true },
  })
  if (existing) {
    return { ok: true, certificateId: existing.id }
  }

  const result = await issueCertificateInternal({ userId, enrollmentId })
  if (!result.ok) return result
  revalidatePath('/dashboard/sertifikat')
  return { ok: true, certificateId: result.certificateId }
}

/**
 * Internal helper — bypasses auth/ownership checks (callers must have done
 * them) and creates the SVG file + Certificate row in one shot. Used by
 * both `issueCertificate` (after explicit user request) and
 * `markLessonComplete` (auto-issue on 100%).
 */
async function issueCertificateInternal(opts: {
  userId: string
  enrollmentId: string
}): Promise<
  | { ok: true; certificateId: string }
  | { ok: false; error: string }
> {
  const t = await getServerT()
  try {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: opts.enrollmentId },
      select: {
        id: true,
        courseId: true,
        course: {
          select: {
            id: true,
            title: true,
            tenantId: true,
            tenant: { select: { id: true, name: true } },
          },
        },
        user: { select: { id: true, name: true, email: true } },
      },
    })
    if (!enrollment) {
      return { ok: false, error: t.srvScoring.enrollments.enrollmentNotFound }
    }

    const recipientName =
      enrollment.user.name ??
      enrollment.user.email?.split('@')[0] ??
      'Peserta RPI'
    const issuerName = enrollment.course.tenant.name

    // Create the row first so we have the cuid to embed in the SVG.
    const certificate = await prisma.certificate.create({
      data: {
        userId: opts.userId,
        courseId: enrollment.courseId,
        title: `Sertifikat: ${enrollment.course.title}`,
        issuer: issuerName,
        // Placeholder; updated below once the file is on disk.
        fileUrl: '',
      },
      select: { id: true, issuedAt: true },
    })

    const svg = buildCertificateSvg({
      recipientName,
      courseTitle: enrollment.course.title,
      issuerName,
      issuedAt: certificate.issuedAt,
      certificateId: certificate.id,
    })

    const baseDir = path.join(
      process.cwd(),
      'public',
      'uploads',
      'certificates',
      opts.userId,
    )
    await fs.mkdir(baseDir, { recursive: true })
    const filename = `${certificate.id}.svg`
    await fs.writeFile(path.join(baseDir, filename), svg, 'utf8')
    const fileUrl = `/uploads/certificates/${opts.userId}/${filename}`

    await prisma.certificate.update({
      where: { id: certificate.id },
      data: { fileUrl },
    })

    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        tenantId: enrollment.course.tenantId,
        userId: opts.userId,
        action: AuditAction.CREATE,
        resource: 'certificate',
        resourceId: certificate.id,
        metadata: {
          courseId: enrollment.courseId,
          enrollmentId: opts.enrollmentId,
          fileUrl,
        },
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    return { ok: true, certificateId: certificate.id }
  } catch (err) {
    console.error('[issueCertificateInternal] failed', err)
    return { ok: false, error: t.srvScoring.enrollments.certIssueFailed }
  }
}

// ---------------------------------------------------------------------------
// unenroll
// ---------------------------------------------------------------------------

const unenrollSchema = z.object({
  enrollmentId: z.string().min(1, 'ID pendaftaran wajib diisi.'),
})

/**
 * Cancel an in-progress enrollment owned by the caller. Refuses to delete
 * COMPLETED enrollments so we keep history (and any issued certificate
 * stays referenceable via Certificate.courseId).
 *
 * Cascades to LessonProgress via Prisma `onDelete: Cascade` on the schema.
 */
export async function unenroll(input: {
  enrollmentId: string
}): Promise<ActionResult> {
  const t = await getServerT()
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: t.srvScoring.enrollments.mustLogin }
  }
  const userId = session.user.id

  const parsed = unenrollSchema.safeParse(input)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return {
      ok: false,
      error: first?.message ?? t.srvScoring.enrollments.inputInvalid,
      field: first?.path?.[0]?.toString(),
    }
  }
  const { enrollmentId } = parsed.data

  try {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      select: {
        id: true,
        userId: true,
        status: true,
        courseId: true,
        course: { select: { slug: true, tenantId: true } },
      },
    })
    if (!enrollment) {
      return { ok: false, error: t.srvScoring.enrollments.enrollmentNotFound }
    }
    if (enrollment.userId !== userId) {
      return { ok: false, error: t.srvScoring.enrollments.unenrollForbidden }
    }
    if (enrollment.status === EnrollmentStatus.COMPLETED) {
      return {
        ok: false,
        error: t.srvScoring.enrollments.unenrollCompleted,
      }
    }

    const meta = getRequestMeta()
    await prisma.$transaction([
      // LessonProgress rows cascade via FK — we still wipe explicitly to be
      // robust if cascade behavior changes.
      prisma.lessonProgress.deleteMany({ where: { enrollmentId } }),
      prisma.enrollment.delete({ where: { id: enrollmentId } }),
      prisma.auditLog.create({
        data: {
          tenantId: enrollment.course.tenantId,
          userId,
          action: AuditAction.DELETE,
          resource: 'enrollment',
          resourceId: enrollment.id,
          metadata: {
            courseId: enrollment.courseId,
            previousStatus: enrollment.status,
          },
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      }),
    ])

    revalidatePath('/dashboard/kursus')
    revalidatePath(`/courses/${enrollment.course.slug}`)
    return { ok: true }
  } catch (err) {
    console.error('[unenroll] failed', err)
    return { ok: false, error: t.srvScoring.enrollments.unenrollFailed }
  }
}
