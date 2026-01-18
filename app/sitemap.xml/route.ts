import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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
  
  // Static pages with priorities and change frequencies
  const staticPages: Array<{ path: string; priority: string; changefreq: string }> = [
    { path: '/', priority: '1.0', changefreq: 'daily' },
    { path: '/cities', priority: '0.9', changefreq: 'weekly' },
    { path: '/submit', priority: '0.8', changefreq: 'monthly' },
    // Optional pages (add if they exist in your project)
    // { path: '/about', priority: '0.7', changefreq: 'monthly' },
    // { path: '/faq', priority: '0.7', changefreq: 'monthly' },
    // { path: '/contact', priority: '0.7', changefreq: 'monthly' },
    // { path: '/privacy', priority: '0.5', changefreq: 'yearly' },
    // { path: '/terms', priority: '0.5', changefreq: 'yearly' },
    // { path: '/imprint', priority: '0.5', changefreq: 'yearly' },
  ]
  
  // Add static pages
  staticPages.forEach((page) => {
    urls.push({
      loc: `${baseUrl}${page.path}`,
      changefreq: page.changefreq,
      priority: page.priority,
    })
  })
  
  // Fetch cafes and cities from Supabase
  let cafes: Array<{ id: string; city: string | null; updated_at?: string; created_at?: string }> = []
  const citiesSet = new Set<string>()
  
  try {
    // Fetch cafes with id, city, and timestamps (limit 5000)
    const { data, error } = await supabase
      .from('cafes')
      .select('id, city, updated_at, created_at')
      .eq('is_active', true)
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
  
  citiesToInclude.forEach((city) => {
    urls.push({
      loc: `${baseUrl}/cities/${encodeURIComponent(city)}`,
      changefreq: 'weekly',
      priority: '0.8',
    })
  })
  
  // Add cafe detail pages
  cafes.forEach((cafe) => {
    // Use /cafe/[id] pattern (detected from existing route)
    const url: SitemapUrl = {
      loc: `${baseUrl}/cafe/${cafe.id}`,
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
