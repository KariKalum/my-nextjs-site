import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'

// Mark as dynamic since we use cookies() via createClient()
export const dynamic = 'force-dynamic'

/**
 * Auth callback route for Supabase magic link authentication (locale-prefixed)
 * Exchanges the code from the magic link for a session
 * 
 * This route handles callbacks from locale-prefixed URLs (e.g., /de/auth/callback, /en/auth/callback)
 * but redirects to non-locale-prefixed admin routes after successful authentication.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { locale: string } }
) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/admin'

  if (code) {
    const supabase = await createClient()
    
    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Error exchanging code for session:', error)
      // Redirect to login with error (non-locale-prefixed)
      const loginUrl = new URL('/login', requestUrl.origin)
      loginUrl.searchParams.set('error', 'auth_failed')
      return NextResponse.redirect(loginUrl)
    }

    // Success - redirect to admin (or next param)
    // Note: admin route is NOT locale-prefixed (/admin, not /de/admin)
    return NextResponse.redirect(new URL(next, requestUrl.origin))
  }

  // No code provided - redirect to login (non-locale-prefixed)
  return NextResponse.redirect(new URL('/login', requestUrl.origin))
}
