import { NextResponse } from 'next/server'

export async function GET() {
  // Get base URL from environment variable or infer from deployment
  // Prefer explicit production domain, fallback to NEXT_PUBLIC_SITE_URL, then hardcoded production URL
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://workfrom.cafe'
  const sitemapUrl = `${baseUrl}/sitemap.xml`
  
  // Generate robots.txt
  // Allow all crawlers to access public pages
  // Disallow admin and API routes
  const robotsTxt = `User-agent: *
Allow: /

# Disallow admin routes (require authentication)
Disallow: /admin

# Disallow API routes (not meant for crawling)
Disallow: /api

# Sitemap location
Sitemap: ${sitemapUrl}
`
  
  return new NextResponse(robotsTxt, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate',
    },
  })
}
