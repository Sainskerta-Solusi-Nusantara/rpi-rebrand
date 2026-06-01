'use server'

/**
 * Blog / Article admin server actions.
 *
 * Permission model:
 *   Only SUPERADMIN or ADMIN global users can mutate Articles. This mirrors
 *   the `requireAdmin(...)` helper used in `lib/admin/actions.ts`. Articles
 *   are platform-wide content (not tenant-scoped), so there is no per-tenant
 *   permission grid involved.
 *
 * Audit:
 *   resource = "article"
 *   action   = CREATE | UPDATE | DELETE  (publish/archive are UPDATE with
 *              status transition metadata).
 *
 * Slug strategy:
 *   kebab-case fragment from the title (max 60 chars) + `-` + 7-char nanoid
 *   suffix, mirroring `buildCourseSlug` / `buildJobSlug`. Article.slug is a
 *   unique key in the schema.
 */

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { AuditAction, Prisma } from '@prisma/client'
import { nanoid } from 'nanoid'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; field?: string }

// Article.status is a String column (DRAFT | PUBLISHED | ARCHIVED).
export type ArticleStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
const ARTICLE_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
 * suffix to guarantee uniqueness (Article.slug is @unique).
 */
function buildArticleSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  const suffix = nanoid(7).toLowerCase().replace(/[^a-z0-9]/g, '')
  return base ? `${base}-${suffix}` : `article-${suffix}`
}

async function requireAdminActor(): Promise<
  | { error: string }
  | { actorId: string; actorName: string | null }
> {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Anda harus masuk.' }
  const role = session.user.globalRole
  if (role !== 'SUPERADMIN' && role !== 'ADMIN') {
    return { error: 'Akses ditolak.' }
  }
  return { actorId: session.user.id, actorName: session.user.name ?? null }
}

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const tagSchema = z
  .string()
  .trim()
  .min(1)
  .max(40, 'Tag terlalu panjang')
  .regex(/^[a-z0-9](?:[a-z0-9- ]*[a-z0-9])?$/i, 'Tag hanya boleh huruf, angka, atau tanda hubung')

const baseTagsSchema = z
  .array(tagSchema)
  .max(10, 'Maksimal 10 tag')
  .optional()
  .transform((v) => (v ?? []).map((t) => t.trim().toLowerCase()))

const createArticleSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, 'Judul minimal 5 karakter')
    .max(200, 'Judul maksimal 200 karakter'),
  summary: z
    .string()
    .trim()
    .max(500, 'Ringkasan maksimal 500 karakter')
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  body: z
    .string()
    .trim()
    .min(50, 'Isi artikel minimal 50 karakter'),
  coverImage: z
    .string()
    .trim()
    .max(2048, 'URL gambar terlalu panjang')
    .url('URL gambar tidak valid')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  tags: baseTagsSchema,
})

const updateArticleSchema = z.object({
  articleId: z.string().min(1),
  title: createArticleSchema.shape.title.optional(),
  summary: createArticleSchema.shape.summary,
  body: createArticleSchema.shape.body.optional(),
  coverImage: createArticleSchema.shape.coverImage,
  tags: baseTagsSchema,
  status: z.enum(ARTICLE_STATUSES).optional(),
})

// ---------------------------------------------------------------------------
// Context loader
// ---------------------------------------------------------------------------

async function loadArticleForAction(articleId: string): Promise<
  | { error: string }
  | {
      article: {
        id: string
        slug: string
        title: string
        status: string
        publishedAt: Date | null
      }
      actorId: string
    }
> {
  const actor = await requireAdminActor()
  if ('error' in actor) return { error: actor.error }
  if (!articleId) return { error: 'ID artikel tidak valid.' }
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      publishedAt: true,
    },
  })
  if (!article) return { error: 'Artikel tidak ditemukan.' }
  return { article, actorId: actor.actorId }
}

function revalidateArticlePaths(slug?: string | null) {
  revalidatePath('/admin/articles')
  revalidatePath('/blog')
  revalidatePath('/feed.xml')
  if (slug) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    revalidatePath(`/blog/${slug}` as any)
  }
}

// ---------------------------------------------------------------------------
// createArticle
// ---------------------------------------------------------------------------

export async function createArticle(input: {
  title: string
  summary?: string
  body: string
  coverImage?: string
  tags?: string[]
}): Promise<ActionResult<{ id: string; slug: string }>> {
  const actor = await requireAdminActor()
  if ('error' in actor) return { ok: false, error: actor.error }

  const parsed = createArticleSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? 'Data tidak valid',
      field: issue?.path[0] as string | undefined,
    }
  }
  const d = parsed.data

  try {
    const slug = buildArticleSlug(d.title)
    const created = await prisma.article.create({
      data: {
        slug,
        title: d.title,
        summary: d.summary ?? null,
        body: d.body,
        coverImage: d.coverImage ?? null,
        status: 'DRAFT',
        tags: d.tags,
        authorId: actor.actorId,
      },
      select: { id: true, slug: true },
    })

    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        userId: actor.actorId,
        action: AuditAction.CREATE,
        resource: 'article',
        resourceId: created.id,
        metadata: {
          title: d.title,
          slug: created.slug,
          tags: d.tags,
        } as Prisma.InputJsonValue,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    revalidateArticlePaths(created.slug)
    return { ok: true, data: { id: created.id, slug: created.slug } }
  } catch (err) {
    console.error('[createArticle] failed', err)
    return { ok: false, error: 'Terjadi kesalahan. Coba lagi sebentar.' }
  }
}

// ---------------------------------------------------------------------------
// updateArticle
// ---------------------------------------------------------------------------

export async function updateArticle(input: {
  articleId: string
  title?: string
  summary?: string
  body?: string
  coverImage?: string
  tags?: string[]
  status?: ArticleStatus
}): Promise<ActionResult> {
  const parsed = updateArticleSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? 'Data tidak valid',
      field: issue?.path[0] as string | undefined,
    }
  }
  const d = parsed.data

  const ctx = await loadArticleForAction(d.articleId)
  if ('error' in ctx) return { ok: false, error: ctx.error }

  try {
    const data: Prisma.ArticleUpdateInput = {}
    const changed: string[] = []

    if (d.title !== undefined) {
      data.title = d.title
      changed.push('title')
    }
    if (input.summary !== undefined) {
      data.summary = d.summary ?? null
      changed.push('summary')
    }
    if (d.body !== undefined) {
      data.body = d.body
      changed.push('body')
    }
    if (input.coverImage !== undefined) {
      data.coverImage = d.coverImage ?? null
      changed.push('coverImage')
    }
    if (input.tags !== undefined) {
      data.tags = d.tags
      changed.push('tags')
    }
    if (d.status !== undefined && d.status !== ctx.article.status) {
      data.status = d.status
      changed.push('status')
      if (d.status === 'PUBLISHED' && ctx.article.publishedAt === null) {
        data.publishedAt = new Date()
      }
    }

    if (changed.length === 0) {
      return { ok: true }
    }

    const updated = await prisma.article.update({
      where: { id: ctx.article.id },
      data,
      select: { slug: true },
    })

    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        userId: ctx.actorId,
        action: AuditAction.UPDATE,
        resource: 'article',
        resourceId: ctx.article.id,
        metadata: {
          title: ctx.article.title,
          changes: changed,
          status:
            d.status !== undefined
              ? { from: ctx.article.status, to: d.status }
              : undefined,
        } as Prisma.InputJsonValue,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    revalidateArticlePaths(updated.slug)
    return { ok: true }
  } catch (err) {
    console.error('[updateArticle] failed', err)
    return { ok: false, error: 'Terjadi kesalahan. Coba lagi sebentar.' }
  }
}

// ---------------------------------------------------------------------------
// publishArticle / archiveArticle
// ---------------------------------------------------------------------------

export async function publishArticle(articleId: string): Promise<ActionResult> {
  const ctx = await loadArticleForAction(articleId)
  if ('error' in ctx) return { ok: false, error: ctx.error }

  if (ctx.article.status === 'PUBLISHED') return { ok: true }

  try {
    const data: Prisma.ArticleUpdateInput = { status: 'PUBLISHED' }
    if (ctx.article.publishedAt === null) {
      data.publishedAt = new Date()
    }

    await prisma.article.update({
      where: { id: ctx.article.id },
      data,
    })

    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        userId: ctx.actorId,
        action: AuditAction.UPDATE,
        resource: 'article',
        resourceId: ctx.article.id,
        metadata: {
          title: ctx.article.title,
          status: { from: ctx.article.status, to: 'PUBLISHED' },
        } as Prisma.InputJsonValue,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    revalidateArticlePaths(ctx.article.slug)
    return { ok: true }
  } catch (err) {
    console.error('[publishArticle] failed', err)
    return { ok: false, error: 'Terjadi kesalahan. Coba lagi sebentar.' }
  }
}

export async function archiveArticle(articleId: string): Promise<ActionResult> {
  const ctx = await loadArticleForAction(articleId)
  if ('error' in ctx) return { ok: false, error: ctx.error }

  if (ctx.article.status === 'ARCHIVED') return { ok: true }

  try {
    await prisma.article.update({
      where: { id: ctx.article.id },
      data: { status: 'ARCHIVED' },
    })

    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        userId: ctx.actorId,
        action: AuditAction.UPDATE,
        resource: 'article',
        resourceId: ctx.article.id,
        metadata: {
          title: ctx.article.title,
          status: { from: ctx.article.status, to: 'ARCHIVED' },
        } as Prisma.InputJsonValue,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    revalidateArticlePaths(ctx.article.slug)
    return { ok: true }
  } catch (err) {
    console.error('[archiveArticle] failed', err)
    return { ok: false, error: 'Terjadi kesalahan. Coba lagi sebentar.' }
  }
}

// ---------------------------------------------------------------------------
// deleteArticle
// ---------------------------------------------------------------------------

export async function deleteArticle(articleId: string): Promise<ActionResult> {
  const ctx = await loadArticleForAction(articleId)
  if ('error' in ctx) return { ok: false, error: ctx.error }

  try {
    const meta = getRequestMeta()
    await prisma.$transaction([
      prisma.article.delete({ where: { id: ctx.article.id } }),
      prisma.auditLog.create({
        data: {
          userId: ctx.actorId,
          action: AuditAction.DELETE,
          resource: 'article',
          resourceId: ctx.article.id,
          metadata: {
            title: ctx.article.title,
            slug: ctx.article.slug,
            status: ctx.article.status,
          } as Prisma.InputJsonValue,
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      }),
    ])

    revalidateArticlePaths(ctx.article.slug)
    return { ok: true }
  } catch (err) {
    console.error('[deleteArticle] failed', err)
    return { ok: false, error: 'Terjadi kesalahan. Coba lagi sebentar.' }
  }
}
