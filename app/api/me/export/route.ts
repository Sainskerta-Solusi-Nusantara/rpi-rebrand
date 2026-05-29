import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

/**
 * GET /api/me/export
 * Returns a JSON dump of the signed-in user's data, suitable for download.
 * Includes profile, memberships, applications, enrollments, certificates,
 * saved jobs, audit log, and a metadata header.
 */
export async function GET(_req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 })
  }
  const userId = session.user.id

  try {
    const [
      user,
      memberships,
      applications,
      enrollments,
      certificates,
      savedJobs,
      resumes,
      notifications,
      auditLogs,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          phone: true,
          bio: true,
          headline: true,
          location: true,
          globalRole: true,
          status: true,
          emailVerified: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.userTenant.findMany({
        where: { userId },
        select: {
          tenantId: true,
          role: true,
          status: true,
          joinedAt: true,
          tenant: { select: { slug: true, name: true } },
        },
      }),
      prisma.application
        .findMany({
          where: { userId },
          orderBy: { appliedAt: 'desc' },
          take: 500,
          select: {
            id: true,
            jobId: true,
            status: true,
            appliedAt: true,
            updatedAt: true,
            job: { select: { title: true, slug: true } },
          },
        })
        .catch(() => []),
      prisma.enrollment
        .findMany({
          where: { userId },
          orderBy: { enrolledAt: 'desc' },
          take: 500,
          select: {
            id: true,
            courseId: true,
            status: true,
            progress: true,
            enrolledAt: true,
            course: { select: { title: true, slug: true } },
          },
        })
        .catch(() => []),
      prisma.certificate
        .findMany({
          where: { userId },
          select: {
            id: true,
            courseId: true,
            issuedAt: true,
            course: { select: { title: true, slug: true } },
          },
        })
        .catch(() => []),
      prisma.savedJob
        .findMany({
          where: { userId },
          select: {
            jobId: true,
            savedAt: true,
            job: { select: { title: true, slug: true } },
          },
        })
        .catch(() => []),
      prisma.resume
        .findMany({
          where: { userId },
          select: {
            id: true,
            name: true,
            fileUrl: true,
            isPrimary: true,
            createdAt: true,
          },
        })
        .catch(() => []),
      prisma.notification
        .findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 200,
          select: {
            id: true,
            type: true,
            title: true,
            body: true,
            link: true,
            isRead: true,
            createdAt: true,
          },
        })
        .catch(() => []),
      prisma.auditLog
        .findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 200,
          select: {
            id: true,
            action: true,
            resource: true,
            resourceId: true,
            tenantId: true,
            metadata: true,
            ip: true,
            userAgent: true,
            createdAt: true,
          },
        })
        .catch(() => []),
    ])

    if (!user) {
      return NextResponse.json({ error: 'USER_NOT_FOUND' }, { status: 404 })
    }

    const payload = {
      meta: {
        exportedAt: new Date().toISOString(),
        format: 'rpi-user-export@v1',
        note: 'Personal data export. Lihat profile, memberships, applications, dst.',
      },
      profile: user,
      memberships,
      applications,
      enrollments,
      certificates,
      savedJobs,
      resumes,
      notifications,
      auditLogs,
    }

    const json = JSON.stringify(payload, null, 2)
    const dateTag = new Date().toISOString().slice(0, 10)
    const filename = `rpi-export-${user.email.replace(/[^a-z0-9]/gi, '_')}-${dateTag}.json`

    return new NextResponse(json, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, must-revalidate',
      },
    })
  } catch (err) {
    console.error('[/api/me/export] failed', err)
    return NextResponse.json({ error: 'EXPORT_FAILED' }, { status: 500 })
  }
}
