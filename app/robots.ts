import type { MetadataRoute } from 'next'

const SITE_URL = 'https://chienluoc.org'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/', '/dashboard', '/api', '/onboarding'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
