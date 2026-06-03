'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import {
  AuditAction,
  CourseLevel,
  CourseStatus,
  LessonContentType,
  Prisma,
} from '@prisma/client'
import { nanoid } from 'nanoid'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { hasTenantPermission, type Permission } from '@/lib/auth/rbac'
import { getServerT } from '@/lib/i18n/server-dictionary'

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; field?: string }

// =============================================================================
// Helpers
// =============================================================================

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

/**
 * Generate a slug fragment from `title`, then append a short nanoid-style
 * suffix to guarantee uniqueness within the tenant scope
 * (Course has @@unique([tenantId, slug])).
 */
function buildCourseSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  const suffix = nanoid(7).toLowerCase().replace(/[^a-z0-9]/g, '')
  return base ? `${base}-${suffix}` : `course-${suffix}`
}

// =============================================================================
// Validation schemas
// =============================================================================

const courseLevelSchema = z.nativeEnum(CourseLevel)
const courseStatusSchema = z.nativeEnum(CourseStatus)
const lessonContentTypeSchema = z.nativeEnum(LessonContentType)

const optionalText = z
  .string()
  .trim()
  .max(20_000, 'Teks terlalu panjang')
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined))

const optionalShortText = z
  .string()
  .trim()
  .max(2_048, 'Teks terlalu panjang')
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined))

const optionalInstructorId = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined))

const durationHoursNumber = z.preprocess(
  (v) => {
    if (v === '' || v === null || v === undefined) return undefined
    if (typeof v === 'string') {
      const cleaned = v.replace(/[^\d]/g, '')
      if (cleaned === '') return undefined
      const n = Number(cleaned)
      return Number.isFinite(n) ? n : undefined
    }
    return v
  },
  z
    .number({ invalid_type_error: 'Durasi harus berupa angka' })
    .int('Durasi harus bilangan bulat')
    .min(1, 'Durasi minimal 1 jam')
    .max(1000, 'Durasi maksimal 1000 jam'),
)

const baseCourseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, 'Judul minimal 5 karakter')
    .max(200, 'Judul maksimal 200 karakter'),
  description: z
    .string()
    .trim()
    .min(50, 'Deskripsi minimal 50 karakter'),
  level: courseLevelSchema,
  durationHours: durationHoursNumber,
  instructorId: optionalInstructorId,
  thumbnail: optionalShortText,
  status: courseStatusSchema,
})

function readCourseFormData(fd: FormData) {
  return {
    title: fd.get('title') ?? '',
    description: fd.get('description') ?? '',
    level: fd.get('level') ?? undefined,
    durationHours: fd.get('durationHours') ?? undefined,
    instructorId: fd.get('instructorId') ?? '',
    thumbnail: fd.get('thumbnail') ?? '',
    status: fd.get('status') ?? CourseStatus.DRAFT,
  }
}

// Module / Lesson schemas

const moduleTitleSchema = z
  .string()
  .trim()
  .min(2, 'Judul modul minimal 2 karakter')
  .max(200, 'Judul modul maksimal 200 karakter')

const lessonTitleSchema = z
  .string()
  .trim()
  .min(2, 'Judul pelajaran minimal 2 karakter')
  .max(200, 'Judul pelajaran maksimal 200 karakter')

const orderSchema = z
  .number({ invalid_type_error: 'Urutan tidak valid' })
  .int('Urutan harus bilangan bulat')
  .min(0, 'Urutan minimal 0')
  .max(10_000, 'Urutan terlalu besar')

const lessonDurationMinSchema = z
  .number({ invalid_type_error: 'Durasi tidak valid' })
  .int('Durasi harus bilangan bulat')
  .min(0, 'Durasi minimal 0 menit')
  .max(100_000, 'Durasi terlalu besar')

// =============================================================================
// Context loaders (mirror loadTenantForBranding / loadJobForAction)
// =============================================================================

type TenantLoadCtx =
  | { error: string }
  | { tenant: { id: string; slug: string }; actorId: string }

async function loadTenantForCourse(
  tenantSlug: string,
  permission: Permission,
  t: Awaited<ReturnType<typeof getServerT>>,
): Promise<TenantLoadCtx> {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: t.srvTenant2.course.mustSignIn }
  }
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true, slug: true },
  })
  if (!tenant) return { error: t.srvTenant2.course.tenantNotFound }
  const { globalRole, tenants, id: actorId } = session.user
  if (!hasTenantPermission(globalRole, tenants, tenant.id, permission)) {
    return { error: t.srvTenant2.course.noPermission }
  }
  return { tenant, actorId }
}

type CourseLoadCtx =
  | { error: string }
  | {
      course: {
        id: string
        tenantId: string
        slug: string
        title: string
        status: CourseStatus
        publishedAt: Date | null
      }
      tenant: { id: string; slug: string }
      actorId: string
    }

async function loadCourseForAction(
  courseId: string,
  permission: Permission,
  t: Awaited<ReturnType<typeof getServerT>>,
): Promise<CourseLoadCtx> {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: t.srvTenant2.course.mustSignIn }
  }
  if (!courseId) return { error: t.srvTenant2.course.courseIdInvalid }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      tenantId: true,
      slug: true,
      title: true,
      status: true,
      publishedAt: true,
      tenant: { select: { id: true, slug: true } },
    },
  })
  if (!course) return { error: t.srvTenant2.course.courseNotFound }

  const { globalRole, tenants, id: actorId } = session.user
  if (!hasTenantPermission(globalRole, tenants, course.tenantId, permission)) {
    return { error: t.srvTenant2.course.noPermission }
  }
  return {
    course: {
      id: course.id,
      tenantId: course.tenantId,
      slug: course.slug,
      title: course.title,
      status: course.status,
      publishedAt: course.publishedAt,
    },
    tenant: course.tenant,
    actorId,
  }
}

type ModuleLoadCtx =
  | { error: string }
  | {
      module: { id: string; courseId: string; title: string; order: number }
      course: { id: string; tenantId: string; slug: string; title: string }
      tenant: { id: string; slug: string }
      actorId: string
    }

async function loadModuleForAction(
  moduleId: string,
  permission: Permission,
  t: Awaited<ReturnType<typeof getServerT>>,
): Promise<ModuleLoadCtx> {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: t.srvTenant2.course.mustSignIn }
  }
  if (!moduleId) return { error: t.srvTenant2.course.moduleIdInvalid }

  const mod = await prisma.module.findUnique({
    where: { id: moduleId },
    select: {
      id: true,
      courseId: true,
      title: true,
      order: true,
      course: {
        select: {
          id: true,
          tenantId: true,
          slug: true,
          title: true,
          tenant: { select: { id: true, slug: true } },
        },
      },
    },
  })
  if (!mod) return { error: t.srvTenant2.course.moduleNotFound }

  const { globalRole, tenants, id: actorId } = session.user
  if (
    !hasTenantPermission(globalRole, tenants, mod.course.tenantId, permission)
  ) {
    return { error: t.srvTenant2.course.noPermission }
  }
  return {
    module: {
      id: mod.id,
      courseId: mod.courseId,
      title: mod.title,
      order: mod.order,
    },
    course: {
      id: mod.course.id,
      tenantId: mod.course.tenantId,
      slug: mod.course.slug,
      title: mod.course.title,
    },
    tenant: mod.course.tenant,
    actorId,
  }
}

type LessonLoadCtx =
  | { error: string }
  | {
      lesson: {
        id: string
        moduleId: string
        title: string
        contentType: LessonContentType
        order: number
      }
      course: { id: string; tenantId: string; slug: string; title: string }
      tenant: { id: string; slug: string }
      actorId: string
    }

async function loadLessonForAction(
  lessonId: string,
  permission: Permission,
  t: Awaited<ReturnType<typeof getServerT>>,
): Promise<LessonLoadCtx> {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: t.srvTenant2.course.mustSignIn }
  }
  if (!lessonId) return { error: t.srvTenant2.course.lessonIdInvalid }

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      moduleId: true,
      title: true,
      contentType: true,
      order: true,
      module: {
        select: {
          course: {
            select: {
              id: true,
              tenantId: true,
              slug: true,
              title: true,
              tenant: { select: { id: true, slug: true } },
            },
          },
        },
      },
    },
  })
  if (!lesson) return { error: t.srvTenant2.course.lessonNotFound }

  const { globalRole, tenants, id: actorId } = session.user
  if (
    !hasTenantPermission(
      globalRole,
      tenants,
      lesson.module.course.tenantId,
      permission,
    )
  ) {
    return { error: t.srvTenant2.course.noPermission }
  }
  return {
    lesson: {
      id: lesson.id,
      moduleId: lesson.moduleId,
      title: lesson.title,
      contentType: lesson.contentType,
      order: lesson.order,
    },
    course: {
      id: lesson.module.course.id,
      tenantId: lesson.module.course.tenantId,
      slug: lesson.module.course.slug,
      title: lesson.module.course.title,
    },
    tenant: lesson.module.course.tenant,
    actorId,
  }
}

// =============================================================================
// Verify instructor belongs to tenant
// =============================================================================

async function verifyInstructorInTenant(
  instructorId: string,
  tenantId: string,
): Promise<boolean> {
  const link = await prisma.userTenant.findUnique({
    where: { userId_tenantId: { userId: instructorId, tenantId } },
    select: { userId: true },
  })
  return Boolean(link)
}

// =============================================================================
// createCourse
// =============================================================================

export async function createCourse(input: {
  tenantSlug: string
  values: FormData
}): Promise<ActionResult<{ id: string; slug: string }>> {
  const t = await getServerT()
  const ctx = await loadTenantForCourse(input.tenantSlug, 'course.create', t)
  if ('error' in ctx) return { ok: false, error: ctx.error }

  const parsed = baseCourseSchema.safeParse(readCourseFormData(input.values))
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? t.srvTenant2.course.dataInvalid,
      field: issue?.path[0] as string | undefined,
    }
  }
  const d = parsed.data

  try {
    if (d.instructorId) {
      const ok = await verifyInstructorInTenant(d.instructorId, ctx.tenant.id)
      if (!ok) {
        return {
          ok: false,
          error: t.srvTenant2.course.instructorNotMember,
          field: 'instructorId',
        }
      }
    }

    const slug = buildCourseSlug(d.title)

    const created = await prisma.course.create({
      data: {
        tenantId: ctx.tenant.id,
        title: d.title,
        slug,
        description: d.description,
        thumbnail: d.thumbnail,
        level: d.level,
        durationHours: d.durationHours,
        instructorId: d.instructorId,
        status: d.status,
        publishedAt: d.status === CourseStatus.PUBLISHED ? new Date() : null,
      },
      select: { id: true, slug: true },
    })

    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        tenantId: ctx.tenant.id,
        userId: ctx.actorId,
        action: AuditAction.CREATE,
        resource: 'tenant.course',
        resourceId: created.id,
        metadata: {
          title: d.title,
          slug: created.slug,
          level: d.level,
          durationHours: d.durationHours,
          status: d.status,
        } as Prisma.InputJsonValue,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    revalidatePath(`/dashboard/tenants/${ctx.tenant.slug}/kursus`)
    return { ok: true, data: { id: created.id, slug: created.slug } }
  } catch (err) {
    console.error('[createCourse] failed', err)
    return { ok: false, error: t.srvTenant2.course.genericError }
  }
}

// =============================================================================
// updateCourse
// =============================================================================

export async function updateCourse(input: {
  courseId: string
  values: FormData
}): Promise<ActionResult> {
  const t = await getServerT()
  const ctx = await loadCourseForAction(input.courseId, 'course.update', t)
  if ('error' in ctx) return { ok: false, error: ctx.error }

  const parsed = baseCourseSchema.safeParse(readCourseFormData(input.values))
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? t.srvTenant2.course.dataInvalid,
      field: issue?.path[0] as string | undefined,
    }
  }
  const d = parsed.data

  try {
    if (d.instructorId) {
      const ok = await verifyInstructorInTenant(d.instructorId, ctx.tenant.id)
      if (!ok) {
        return {
          ok: false,
          error: t.srvTenant2.course.instructorNotMember,
          field: 'instructorId',
        }
      }
    }

    const willPublish =
      d.status === CourseStatus.PUBLISHED &&
      ctx.course.status !== CourseStatus.PUBLISHED

    const updateData: Prisma.CourseUpdateInput = {
      title: d.title,
      description: d.description,
      thumbnail: d.thumbnail ?? null,
      level: d.level,
      durationHours: d.durationHours,
      instructor: d.instructorId
        ? { connect: { id: d.instructorId } }
        : { disconnect: true },
      status: d.status,
    }

    if (willPublish && ctx.course.publishedAt === null) {
      updateData.publishedAt = new Date()
    }

    await prisma.course.update({
      where: { id: ctx.course.id },
      data: updateData,
    })

    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        tenantId: ctx.tenant.id,
        userId: ctx.actorId,
        action: AuditAction.UPDATE,
        resource: 'tenant.course',
        resourceId: ctx.course.id,
        metadata: {
          title: d.title,
          status: { from: ctx.course.status, to: d.status },
          willPublish,
        } as Prisma.InputJsonValue,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    revalidatePath(`/dashboard/tenants/${ctx.tenant.slug}/kursus`)
    revalidatePath(
      `/dashboard/tenants/${ctx.tenant.slug}/kursus/${ctx.course.id}/edit`,
    )
    return { ok: true }
  } catch (err) {
    console.error('[updateCourse] failed', err)
    return { ok: false, error: t.srvTenant2.course.genericError }
  }
}

// =============================================================================
// changeCourseStatus
// =============================================================================

export async function changeCourseStatus(input: {
  courseId: string
  status: CourseStatus
}): Promise<ActionResult> {
  const t = await getServerT()
  const statusParse = courseStatusSchema.safeParse(input.status)
  if (!statusParse.success) {
    return { ok: false, error: t.srvTenant2.course.statusInvalid }
  }
  const nextStatus = statusParse.data

  const ctx = await loadCourseForAction(input.courseId, 'course.update', t)
  if ('error' in ctx) return { ok: false, error: ctx.error }

  if (ctx.course.status === nextStatus) {
    return { ok: true }
  }

  try {
    const data: Prisma.CourseUpdateInput = { status: nextStatus }
    if (
      nextStatus === CourseStatus.PUBLISHED &&
      ctx.course.publishedAt === null
    ) {
      data.publishedAt = new Date()
    }

    await prisma.course.update({
      where: { id: ctx.course.id },
      data,
    })

    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        tenantId: ctx.tenant.id,
        userId: ctx.actorId,
        action: AuditAction.UPDATE,
        resource: 'tenant.course.status',
        resourceId: ctx.course.id,
        metadata: {
          title: ctx.course.title,
          status: { from: ctx.course.status, to: nextStatus },
        } as Prisma.InputJsonValue,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    revalidatePath(`/dashboard/tenants/${ctx.tenant.slug}/kursus`)
    return { ok: true }
  } catch (err) {
    console.error('[changeCourseStatus] failed', err)
    return { ok: false, error: t.srvTenant2.course.genericError }
  }
}

// =============================================================================
// deleteCourse
// =============================================================================

export async function deleteCourse(courseId: string): Promise<ActionResult> {
  const t = await getServerT()
  const ctx = await loadCourseForAction(courseId, 'course.delete', t)
  if ('error' in ctx) return { ok: false, error: ctx.error }

  try {
    const meta = getRequestMeta()
    await prisma.$transaction([
      prisma.course.delete({ where: { id: ctx.course.id } }),
      prisma.auditLog.create({
        data: {
          tenantId: ctx.tenant.id,
          userId: ctx.actorId,
          action: AuditAction.DELETE,
          resource: 'tenant.course',
          resourceId: ctx.course.id,
          metadata: {
            title: ctx.course.title,
            slug: ctx.course.slug,
            status: ctx.course.status,
          } as Prisma.InputJsonValue,
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      }),
    ])

    revalidatePath(`/dashboard/tenants/${ctx.tenant.slug}/kursus`)
    return { ok: true }
  } catch (err) {
    console.error('[deleteCourse] failed', err)
    return { ok: false, error: t.srvTenant2.course.genericError }
  }
}

// =============================================================================
// Module CRUD
// =============================================================================

export async function createModule(input: {
  courseId: string
  title: string
  order: number
}): Promise<ActionResult<{ id: string }>> {
  const t = await getServerT()
  const ctx = await loadCourseForAction(input.courseId, 'course.update', t)
  if ('error' in ctx) return { ok: false, error: ctx.error }

  const titleParse = moduleTitleSchema.safeParse(input.title)
  if (!titleParse.success) {
    return {
      ok: false,
      error: titleParse.error.issues[0]?.message ?? t.srvTenant2.course.titleInvalid,
      field: 'title',
    }
  }
  const orderParse = orderSchema.safeParse(input.order)
  if (!orderParse.success) {
    return {
      ok: false,
      error: orderParse.error.issues[0]?.message ?? t.srvTenant2.course.orderInvalid,
      field: 'order',
    }
  }

  try {
    const created = await prisma.module.create({
      data: {
        courseId: ctx.course.id,
        title: titleParse.data,
        order: orderParse.data,
      },
      select: { id: true },
    })

    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        tenantId: ctx.tenant.id,
        userId: ctx.actorId,
        action: AuditAction.CREATE,
        resource: 'tenant.course.module',
        resourceId: created.id,
        metadata: {
          courseId: ctx.course.id,
          courseTitle: ctx.course.title,
          title: titleParse.data,
          order: orderParse.data,
        } as Prisma.InputJsonValue,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    revalidatePath(
      `/dashboard/tenants/${ctx.tenant.slug}/kursus/${ctx.course.id}/edit`,
    )
    return { ok: true, data: { id: created.id } }
  } catch (err) {
    console.error('[createModule] failed', err)
    return { ok: false, error: t.srvTenant2.course.genericError }
  }
}

export async function updateModule(input: {
  moduleId: string
  title?: string
  order?: number
}): Promise<ActionResult> {
  const t = await getServerT()
  const ctx = await loadModuleForAction(input.moduleId, 'course.update', t)
  if ('error' in ctx) return { ok: false, error: ctx.error }

  const data: Prisma.ModuleUpdateInput = {}
  if (input.title !== undefined) {
    const titleParse = moduleTitleSchema.safeParse(input.title)
    if (!titleParse.success) {
      return {
        ok: false,
        error: titleParse.error.issues[0]?.message ?? t.srvTenant2.course.titleInvalid,
        field: 'title',
      }
    }
    data.title = titleParse.data
  }
  if (input.order !== undefined) {
    const orderParse = orderSchema.safeParse(input.order)
    if (!orderParse.success) {
      return {
        ok: false,
        error: orderParse.error.issues[0]?.message ?? t.srvTenant2.course.orderInvalid,
        field: 'order',
      }
    }
    data.order = orderParse.data
  }

  if (Object.keys(data).length === 0) {
    return { ok: true }
  }

  try {
    await prisma.module.update({
      where: { id: ctx.module.id },
      data,
    })

    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        tenantId: ctx.tenant.id,
        userId: ctx.actorId,
        action: AuditAction.UPDATE,
        resource: 'tenant.course.module',
        resourceId: ctx.module.id,
        metadata: {
          courseId: ctx.course.id,
          changes: {
            title:
              input.title !== undefined
                ? { from: ctx.module.title, to: data.title }
                : undefined,
            order:
              input.order !== undefined
                ? { from: ctx.module.order, to: data.order }
                : undefined,
          },
        } as Prisma.InputJsonValue,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    revalidatePath(
      `/dashboard/tenants/${ctx.tenant.slug}/kursus/${ctx.course.id}/edit`,
    )
    return { ok: true }
  } catch (err) {
    console.error('[updateModule] failed', err)
    return { ok: false, error: t.srvTenant2.course.genericError }
  }
}

export async function deleteModule(moduleId: string): Promise<ActionResult> {
  const t = await getServerT()
  const ctx = await loadModuleForAction(moduleId, 'course.update', t)
  if ('error' in ctx) return { ok: false, error: ctx.error }

  try {
    const meta = getRequestMeta()
    await prisma.$transaction([
      prisma.module.delete({ where: { id: ctx.module.id } }),
      prisma.auditLog.create({
        data: {
          tenantId: ctx.tenant.id,
          userId: ctx.actorId,
          action: AuditAction.DELETE,
          resource: 'tenant.course.module',
          resourceId: ctx.module.id,
          metadata: {
            courseId: ctx.course.id,
            title: ctx.module.title,
            order: ctx.module.order,
          } as Prisma.InputJsonValue,
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      }),
    ])

    revalidatePath(
      `/dashboard/tenants/${ctx.tenant.slug}/kursus/${ctx.course.id}/edit`,
    )
    return { ok: true }
  } catch (err) {
    console.error('[deleteModule] failed', err)
    return { ok: false, error: t.srvTenant2.course.genericError }
  }
}

// =============================================================================
// Lesson CRUD
// =============================================================================

export async function createLesson(input: {
  moduleId: string
  title: string
  contentType: LessonContentType
  contentUrl?: string
  contentBody?: string
  order: number
  durationMin: number
}): Promise<ActionResult<{ id: string }>> {
  const t = await getServerT()
  const ctx = await loadModuleForAction(input.moduleId, 'course.update', t)
  if ('error' in ctx) return { ok: false, error: ctx.error }

  const titleParse = lessonTitleSchema.safeParse(input.title)
  if (!titleParse.success) {
    return {
      ok: false,
      error: titleParse.error.issues[0]?.message ?? t.srvTenant2.course.titleInvalid,
      field: 'title',
    }
  }
  const contentTypeParse = lessonContentTypeSchema.safeParse(input.contentType)
  if (!contentTypeParse.success) {
    return {
      ok: false,
      error: t.srvTenant2.course.contentTypeInvalid,
      field: 'contentType',
    }
  }
  const orderParse = orderSchema.safeParse(input.order)
  if (!orderParse.success) {
    return {
      ok: false,
      error: orderParse.error.issues[0]?.message ?? t.srvTenant2.course.orderInvalid,
      field: 'order',
    }
  }
  const durationParse = lessonDurationMinSchema.safeParse(input.durationMin)
  if (!durationParse.success) {
    return {
      ok: false,
      error: durationParse.error.issues[0]?.message ?? t.srvTenant2.course.durationInvalid,
      field: 'durationMin',
    }
  }
  const contentUrlParse = optionalShortText.safeParse(input.contentUrl ?? '')
  const contentBodyParse = optionalText.safeParse(input.contentBody ?? '')
  if (!contentUrlParse.success || !contentBodyParse.success) {
    return { ok: false, error: t.srvTenant2.course.lessonContentInvalid }
  }

  try {
    const created = await prisma.lesson.create({
      data: {
        moduleId: ctx.module.id,
        title: titleParse.data,
        contentType: contentTypeParse.data,
        contentUrl: contentUrlParse.data,
        contentBody: contentBodyParse.data,
        order: orderParse.data,
        durationMin: durationParse.data,
      },
      select: { id: true },
    })

    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        tenantId: ctx.tenant.id,
        userId: ctx.actorId,
        action: AuditAction.CREATE,
        resource: 'tenant.course.lesson',
        resourceId: created.id,
        metadata: {
          courseId: ctx.course.id,
          moduleId: ctx.module.id,
          title: titleParse.data,
          contentType: contentTypeParse.data,
          order: orderParse.data,
          durationMin: durationParse.data,
        } as Prisma.InputJsonValue,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    revalidatePath(
      `/dashboard/tenants/${ctx.tenant.slug}/kursus/${ctx.course.id}/edit`,
    )
    return { ok: true, data: { id: created.id } }
  } catch (err) {
    console.error('[createLesson] failed', err)
    return { ok: false, error: t.srvTenant2.course.genericError }
  }
}

export async function updateLesson(input: {
  lessonId: string
  title?: string
  contentType?: LessonContentType
  contentUrl?: string
  contentBody?: string
  order?: number
  durationMin?: number
}): Promise<ActionResult> {
  const t = await getServerT()
  const ctx = await loadLessonForAction(input.lessonId, 'course.update', t)
  if ('error' in ctx) return { ok: false, error: ctx.error }

  const data: Prisma.LessonUpdateInput = {}

  if (input.title !== undefined) {
    const p = lessonTitleSchema.safeParse(input.title)
    if (!p.success) {
      return {
        ok: false,
        error: p.error.issues[0]?.message ?? t.srvTenant2.course.titleInvalid,
        field: 'title',
      }
    }
    data.title = p.data
  }
  if (input.contentType !== undefined) {
    const p = lessonContentTypeSchema.safeParse(input.contentType)
    if (!p.success) {
      return { ok: false, error: t.srvTenant2.course.contentTypeInvalid, field: 'contentType' }
    }
    data.contentType = p.data
  }
  if (input.contentUrl !== undefined) {
    const p = optionalShortText.safeParse(input.contentUrl)
    if (!p.success) {
      return { ok: false, error: t.srvTenant2.course.contentUrlInvalid, field: 'contentUrl' }
    }
    data.contentUrl = p.data ?? null
  }
  if (input.contentBody !== undefined) {
    const p = optionalText.safeParse(input.contentBody)
    if (!p.success) {
      return { ok: false, error: t.srvTenant2.course.contentBodyInvalid, field: 'contentBody' }
    }
    data.contentBody = p.data ?? null
  }
  if (input.order !== undefined) {
    const p = orderSchema.safeParse(input.order)
    if (!p.success) {
      return {
        ok: false,
        error: p.error.issues[0]?.message ?? t.srvTenant2.course.orderInvalid,
        field: 'order',
      }
    }
    data.order = p.data
  }
  if (input.durationMin !== undefined) {
    const p = lessonDurationMinSchema.safeParse(input.durationMin)
    if (!p.success) {
      return {
        ok: false,
        error: p.error.issues[0]?.message ?? t.srvTenant2.course.durationInvalid,
        field: 'durationMin',
      }
    }
    data.durationMin = p.data
  }

  if (Object.keys(data).length === 0) {
    return { ok: true }
  }

  try {
    await prisma.lesson.update({
      where: { id: ctx.lesson.id },
      data,
    })

    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        tenantId: ctx.tenant.id,
        userId: ctx.actorId,
        action: AuditAction.UPDATE,
        resource: 'tenant.course.lesson',
        resourceId: ctx.lesson.id,
        metadata: {
          courseId: ctx.course.id,
          moduleId: ctx.lesson.moduleId,
          title: ctx.lesson.title,
          changes: Object.keys(data),
        } as Prisma.InputJsonValue,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    revalidatePath(
      `/dashboard/tenants/${ctx.tenant.slug}/kursus/${ctx.course.id}/edit`,
    )
    return { ok: true }
  } catch (err) {
    console.error('[updateLesson] failed', err)
    return { ok: false, error: t.srvTenant2.course.genericError }
  }
}

export async function deleteLesson(lessonId: string): Promise<ActionResult> {
  const t = await getServerT()
  const ctx = await loadLessonForAction(lessonId, 'course.update', t)
  if ('error' in ctx) return { ok: false, error: ctx.error }

  try {
    const meta = getRequestMeta()
    await prisma.$transaction([
      prisma.lesson.delete({ where: { id: ctx.lesson.id } }),
      prisma.auditLog.create({
        data: {
          tenantId: ctx.tenant.id,
          userId: ctx.actorId,
          action: AuditAction.DELETE,
          resource: 'tenant.course.lesson',
          resourceId: ctx.lesson.id,
          metadata: {
            courseId: ctx.course.id,
            moduleId: ctx.lesson.moduleId,
            title: ctx.lesson.title,
            contentType: ctx.lesson.contentType,
            order: ctx.lesson.order,
          } as Prisma.InputJsonValue,
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      }),
    ])

    revalidatePath(
      `/dashboard/tenants/${ctx.tenant.slug}/kursus/${ctx.course.id}/edit`,
    )
    return { ok: true }
  } catch (err) {
    console.error('[deleteLesson] failed', err)
    return { ok: false, error: t.srvTenant2.course.genericError }
  }
}
