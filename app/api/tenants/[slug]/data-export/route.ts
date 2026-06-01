import { NextResponse, type NextRequest } from 'next/server'
import { headers as nextHeaders } from 'next/headers'
import { AuditAction } from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { buildTenantExportPayload } from '@/lib/tenants/data-export'

export const dynamic = 'force-dynamic'

/**
 * GET /api/tenants/:slug/data-export
 *
 * Streams a full JSON export of every tenant-scoped record (jobs, applicants,
 * courses, audit logs, etc). OWNER-only — strictly checked against
 * tenant.ownerUserId. Records an audit entry tagged `tenant.data_export`
 * (action CREATE) with metadata: size_bytes + per-resource counts.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 })
  }
  const actorId = session.user.id

  const tenant = await prisma.tenant
    .findUnique({
      where: { slug: params.slug },
      select: { id: true, slug: true, ownerUserId: true },
    })
    .catch(() => null)
  if (!tenant) {
    return NextResponse.json({ error: 'TENANT_NOT_FOUND' }, { status: 404 })
  }
  if (tenant.ownerUserId !== actorId) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  }

  try {
    const payload = await buildTenantExportPayload(tenant.id)
    const json = JSON.stringify(payload, null, 2)
    const sizeBytes = Buffer.byteLength(json, 'utf8')

    // Best-effort request metadata for audit.
    let ip: string | null = null
    let userAgent: string | null = null
    try {
      const h = nextHeaders()
      ip =
        h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        h.get('x-real-ip') ??
        null
      userAgent = h.get('user-agent') ?? null
    } catch {
      // ignore
    }

    try {
      await prisma.auditLog.create({
        data: {
          tenantId: tenant.id,
          userId: actorId,
          action: AuditAction.CREATE,
          resource: 'tenant.data_export',
          resourceId: tenant.id,
          metadata: {
            size_bytes: sizeBytes,
            resource_counts: payload.meta.counts,
          },
          ip,
          userAgent,
        },
      })
    } catch (err) {
      console.error('[/api/tenants/:slug/data-export] audit failed', err)
      // Non-fatal — still send the file.
    }

    const dateTag = new Date().toISOString().slice(0, 10)
    const filename = `rpi-tenant-${tenant.slug}-export-${dateTag}.json`

    return new NextResponse(json, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, must-revalidate',
      },
    })
  } catch (err) {
    console.error('[/api/tenants/:slug/data-export] failed', err)
    return NextResponse.json({ error: 'EXPORT_FAILED' }, { status: 500 })
  }
}
