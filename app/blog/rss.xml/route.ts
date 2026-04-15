import { listRssPosts } from '@/lib/blog/queries'

export const dynamic = 'force-dynamic'

const SITE_URL = 'https://chienluoc.org'
const FEED_TITLE = 'Blog — Hoshin Kanri OS'
const FEED_DESCRIPTION =
  'Hoshin Kanri, OKR, X-Matrix, SWOT và những bài học thực chiến cho SME Việt Nam.'

function escapeXml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function toRfc822(iso: string | null): string {
  const d = iso ? new Date(iso) : new Date()
  return d.toUTCString()
}

export async function GET() {
  let posts: Awaited<ReturnType<typeof listRssPosts>> = []
  try {
    posts = await listRssPosts(50)
  } catch (e) {
    console.error('/blog/rss.xml failed to load posts:', e)
  }

  const lastBuild = posts[0]?.published_at ?? new Date().toISOString()

  const items = posts
    .map((p) => {
      const url = `${SITE_URL}/blog/${p.slug}`
      return `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(p.excerpt)}</description>
      <pubDate>${toRfc822(p.published_at)}</pubDate>
    </item>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(FEED_TITLE)}</title>
    <link>${SITE_URL}/blog</link>
    <description>${escapeXml(FEED_DESCRIPTION)}</description>
    <language>vi-VN</language>
    <lastBuildDate>${toRfc822(lastBuild)}</lastBuildDate>
    <atom:link href="${SITE_URL}/blog/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    },
  })
}
