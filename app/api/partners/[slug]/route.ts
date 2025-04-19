/**
 * GET /api/partners/[slug]
 *
 * Public partner profile endpoint. Returns tenant identity + light brand
 * info + counts. Never exposes private fields (custom domain config,
 * subscription IDs, owner email, etc.).
 */

import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { apiError, apiSuccess, handleRouteError } from '@/lib/api-helpers'

type Ctx = { params: { slug: string } }

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: params.slug },
      select: {
        id: true,
        slug: true,
        name: true,
        planTier: true,
        status: true,
        createdAt: true,
        branding: {
          select: {
            logoLight: true,
            logoDark: true,
            favicon: true,
            primaryColor: true,
            secondaryColor: true,
            accentColor: true,
          },
        },
        _count: {
          select: {
            jobs: { where: { status: 'PUBLISHED' } },
            courses: { where: { status: 'PUBLISHED' } },
          },
        },
      },
    })

    if (!tenant || tenant.status !== 'ACTIVE') {
      return apiError('NOT_FOUND', 'Partner not found.', 404)
    }

    return apiSuccess(tenant)
  } catch (err) {
    return handleRouteError(err)
  }
}
