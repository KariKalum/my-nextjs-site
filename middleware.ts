import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { defaultLocale, isValidLocale } from '@/lib/i18n/config'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Handle locale redirects for public routes (not admin, api, or _next)
  if (
    !pathname.startsWith('/admin') &&
    !pathname.startsWith('/api') &&
    !pathname.startsWith('/_next') &&
    !pathname.startsWith('/login') &&
    pathname !== '/robots.txt' &&
    pathname !== '/sitemap.xml'
  ) {
    // Check if pathname already has a locale
    const pathnameParts = pathname.split('/').filter(Boolean)
    const firstSegment = pathnameParts[0]

    // If first segment is a valid locale, continue
    if (isValidLocale(firstSegment)) {
      // Valid locale in path, continue to next middleware logic
    } else {
      // No locale in path - redirect to default locale
      // Normalize path to avoid redirect chains caused by trailing slashes
      let normalizedPath = pathname
      if (normalizedPath !== '/' && normalizedPath.endsWith('/')) {
        normalizedPath = normalizedPath.slice(0, -1)
      }

      const newPath = `/${defaultLocale}${normalizedPath === '/' ? '' : normalizedPath}`
      const url = request.nextUrl.clone()
      url.pathname = newPath
      return NextResponse.redirect(url, 308)
    }
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Helper function to check authentication
  const checkAuth = async (pathname: string): Promise<{ user: any; supabase: any } | null> => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return null
    }
    
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value,
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value: '',
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value: '',
              ...options,
            })
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    return { user, supabase }
  }

  // Protect /admin routes - require authentication
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const authResult = await checkAuth(request.nextUrl.pathname)
    
    if (!authResult) {
      // If no Supabase config, redirect to login (they can't authenticate anyway)
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }

    // If no user and trying to access admin, redirect to login
    if (!authResult.user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }
  }

  // Protect /{locale}/submit routes - require authentication
  const pathnameParts = pathname.split('/').filter(Boolean)
  if (pathnameParts.length === 2 && pathnameParts[1] === 'submit' && isValidLocale(pathnameParts[0])) {
    const locale = pathnameParts[0]
    const authResult = await checkAuth(pathname)
    
    if (!authResult) {
      // If no Supabase config, allow access (for development)
      // In production, this should redirect to login
    } else if (!authResult.user) {
      // User not authenticated - redirect to login with locale-preserved redirect
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', `/${locale}/submit`)
      return NextResponse.redirect(url)
    }
  }

  // Redirect authenticated users away from /login to /admin
  // BUT only if there's no redirect query param (let them complete the flow)
  if (request.nextUrl.pathname === '/login') {
    const hasRedirectParam = request.nextUrl.searchParams.has('redirect')
    
    // If redirect param exists, let logged-in users stay on login page
    // (they might be completing a redirect flow)
    if (!hasRedirectParam) {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return request.cookies.get(name)?.value
            },
            set(name: string, value: string, options: CookieOptions) {
              request.cookies.set({
                name,
                value,
                ...options,
              })
              response = NextResponse.next({
                request: {
                  headers: request.headers,
                },
              })
              response.cookies.set({
                name,
                value,
                ...options,
              })
            },
            remove(name: string, options: CookieOptions) {
              request.cookies.set({
                name,
                value: '',
                ...options,
              })
              response = NextResponse.next({
                request: {
                  headers: request.headers,
                },
              })
              response.cookies.set({
                name,
                value: '',
                ...options,
              })
            },
          },
        }
      )

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const url = request.nextUrl.clone()
        url.pathname = '/admin'
        return NextResponse.redirect(url)
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
