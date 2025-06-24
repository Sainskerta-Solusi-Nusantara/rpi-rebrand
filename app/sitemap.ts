import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/db'

const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/+$/, '')

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/jobs`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE_URL}/courses`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/mitra`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE_URL}/tentang`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ]

  const [jobs, courses] = await Promise.all([
    prisma.job
      .findMany({
        where: { status: 'PUBLISHED' },
        select: { slug: true, updatedAt: true, publishedAt: true },
        orderBy: { publishedAt: 'desc' },
        take: 5000,
      })
      .catch(() => []),
    prisma.course
      .findMany({
        where: { status: 'PUBLISHED' },
        select: { slug: true, updatedAt: true },
        orderBy: { publishedAt: 'desc' },
        take: 2000,
      })
      .catch(() => []),
  ])

  const jobRoutes: MetadataRoute.Sitemap = jobs.map((j) => ({
    url: `${BASE_URL}/jobs/${j.slug}`,
    lastModified: j.updatedAt ?? j.publishedAt ?? now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const courseRoutes: MetadataRoute.Sitemap = courses.map((c) => ({
    url: `${BASE_URL}/courses/${c.slug}`,
    lastModified: c.updatedAt ?? now,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  return [...staticRoutes, ...jobRoutes, ...courseRoutes]
}
