import { NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { getCafeHref } from '@/lib/cafeRouting'
import { locales, type Locale } from '@/lib/i18n/config'

// Mark as dynamic since we use cookies() via createClient()
export const dynamic = 'force-dynamic'

// Supported major cities (fallback if database query fails)
const majorCities = ['berlin', 'hamburg', 'munich', 'cologne', 'frankfurt', 'leipzig']

interface SitemapUrl {
  loc: string
  lastmod?: string
  changefreq?: string
  priority?: string
}

/**
 * Format date for sitemap (YYYY-MM-DD format)
 */
function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toISOString().split('T')[0]
}

export async function GET() {
  // Get base URL from environment variable or infer from deployment
  // In production, set NEXT_PUBLIC_SITE_URL in your .env
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  
  const urls: SitemapUrl[] = []
  
  // Static pages with priorities and change frequencies (paths without locale)
  const staticPages: Array<{ path: string; priority: string; changefreq: string }> = [
    { path: '/', priority: '1.0', changefreq: 'daily' },
    { path: '/cities', priority: '0.9', changefreq: 'weekly' },
    { path: '/submit', priority: '0.8', changefreq: 'monthly' },
    { path: '/find/wifi', priority: '0.7', changefreq: 'monthly' },
    { path: '/find/outlets', priority: '0.7', changefreq: 'monthly' },
    { path: '/find/quiet', priority: '0.7', changefreq: 'monthly' },
    { path: '/find/time-limit', priority: '0.7', changefreq: 'monthly' },
  ]
  
  // Add static pages for each locale
  staticPages.forEach((page) => {
    locales.forEach((locale) => {
      urls.push({
        loc: `${baseUrl}/${locale}${page.path === '/' ? '' : page.path}`,
        changefreq: page.changefreq,
        priority: page.priority,
      })
    })
  })
  
  // Fetch cafes and cities from Supabase
  let cafes: Array<{ id: string; city: string | null; updated_at?: string; created_at?: string }> = []
  const citiesSet = new Set<string>()
  
  try {
    // Create Supabase client (validated at module load)
    const supabase = await createClient()

    // Fetch cafes with id, city, and timestamps (limit 5000)
    const { data, error } = await supabase
      .from('cafes')
      .select('id, city, updated_at, created_at')
      .or('is_active.is.null,is_active.eq.true')
      .order('updated_at', { ascending: false })
      .limit(5000)
      
    if (!error && data) {
      cafes = data
      
      // Collect unique cities from database
      data.forEach((cafe) => {
        if (cafe.city) {
          citiesSet.add(cafe.city.toLowerCase())
        }
      })
    }
  } catch (error) {
    console.error('Error fetching cafes for sitemap:', error)
  }
  
  // Generate city pages
  // Prefer cities from database, fallback to hardcoded list
  const citiesToInclude = citiesSet.size > 0 
    ? Array.from(citiesSet)
    : majorCities
  
  // Add city pages for each locale
  citiesToInclude.forEach((city) => {
    locales.forEach((locale) => {
      urls.push({
        loc: `${baseUrl}/${locale}/cities/${encodeURIComponent(city)}`,
        changefreq: 'weekly',
        priority: '0.8',
      })
    })
  })
  
  // Add cafe detail pages for each locale
  cafes.forEach((cafe) => {
    locales.forEach((locale) => {
      // Use canonical routing helper with locale
      const url: SitemapUrl = {
        loc: `${baseUrl}${getCafeHref(cafe, locale)}`,
        changefreq: 'monthly',
        priority: '0.7',
      }
      
      // Add lastmod if available (prefer updated_at, fallback to created_at)
      if (cafe.updated_at) {
        url.lastmod = formatDate(cafe.updated_at)
      } else if (cafe.created_at) {
        url.lastmod = formatDate(cafe.created_at)
      }
      
      urls.push(url)
    })
  })
  
  // Generate XML sitemap
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((url) => {
    const parts = [`    <loc>${url.loc}</loc>`]
    if (url.lastmod) {
      parts.push(`    <lastmod>${url.lastmod}</lastmod>`)
    }
    if (url.changefreq) {
      parts.push(`    <changefreq>${url.changefreq}</changefreq>`)
    }
    if (url.priority) {
      parts.push(`    <priority>${url.priority}</priority>`)
    }
    return `  <url>
${parts.join('\n')}
  </url>`
  })
  .join('\n')}
</urlset>`
  
  return new NextResponse(sitemap, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate',
    },
  })
}
