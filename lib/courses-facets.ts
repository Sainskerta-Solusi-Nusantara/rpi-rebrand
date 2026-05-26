import { cache } from 'react'
import { prisma } from '@/lib/db'

export const getCourseTenants = cache(
  async (): Promise<{ slug: string; name: string; count: number }[]> => {
    const rows = await prisma.tenant
      .findMany({
        where: {
          status: 'ACTIVE',
          courses: { some: { status: 'PUBLISHED' } },
        },
        select: {
          slug: true,
          name: true,
          _count: {
            select: { courses: { where: { status: 'PUBLISHED' } } },
          },
        },
      })
      .catch(() => [])

    return rows
      .map((t) => ({
        slug: t.slug,
        name: t.name,
        count: t._count.courses,
      }))
      .sort(
        (a, b) =>
          b.count - a.count || a.name.localeCompare(b.name, 'id'),
      )
  },
)

export const getCourseInstructors = cache(
  async (): Promise<{ id: string; name: string; count: number }[]> => {
    const rows = await prisma.user
      .findMany({
        where: {
          coursesTaught: { some: { status: 'PUBLISHED' } },
        },
        select: {
          id: true,
          name: true,
          _count: {
            select: { coursesTaught: { where: { status: 'PUBLISHED' } } },
          },
        },
      })
      .catch(() => [])

    const items: { id: string; name: string; count: number }[] = []
    for (const u of rows) {
      if (u.name === null) continue
      items.push({
        id: u.id,
        name: u.name,
        count: u._count.coursesTaught,
      })
    }
    return items.sort(
      (a, b) => b.count - a.count || a.name.localeCompare(b.name, 'id'),
    )
  },
)

export function sanitizeCourseTenant(
  value: string | undefined,
  validSlugs: string[],
): string | undefined {
  return value && validSlugs.includes(value) ? value : undefined
}

export function sanitizeCourseInstructor(
  value: string | undefined,
  validIds: string[],
): string | undefined {
  return value && validIds.includes(value) ? value : undefined
}
