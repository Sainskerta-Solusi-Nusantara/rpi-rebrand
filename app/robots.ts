import type { MetadataRoute } from 'next'

const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/+$/, '')

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/jobs', '/courses', '/mitra', '/tentang'],
        disallow: ['/dashboard', '/admin', '/partner', '/api', '/lamaran', '/disimpan', '/lms', '/cv', '/sertifikat', '/profil'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}
