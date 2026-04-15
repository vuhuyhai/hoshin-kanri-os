import type { MetadataRoute } from 'next'
import { listAllPublishedSlugs } from '@/lib/blog/queries'

const SITE_URL = 'https://chienluoc.org'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/blog`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/x-ray`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/lien-he`, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${SITE_URL}/dieu-khoan`, changeFrequency: 'yearly', priority: 0.3 },
    {
      url: `${SITE_URL}/chinh-sach-bao-mat`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  try {
    const slugs = await listAllPublishedSlugs()
    const blogEntries: MetadataRoute.Sitemap = slugs.map((s) => ({
      url: `${SITE_URL}/blog/${s.slug}`,
      lastModified: new Date(s.updated_at),
      changeFrequency: 'monthly',
      priority: 0.7,
    }))
    return [...staticEntries, ...blogEntries]
  } catch (e) {
    console.error('sitemap: failed to list blog slugs', e)
    return staticEntries
  }
}
