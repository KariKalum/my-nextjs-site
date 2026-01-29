import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'

// Mark as dynamic since we use cookies() via createClient()
export const dynamic = 'force-dynamic'

/**
 * Auth callback route for Supabase magic link authentication
 * Exchanges the code from the magic link for a session
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const nextParam = requestUrl.searchParams.get('next')
  
  // Validate next parameter: must start with / and not start with //
  // This prevents open-redirect vulnerabilities
  let next = '/admin' // default
  if (nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//')) {
    next = nextParam
  }

  if (code) {
    const supabase = await createClient()
    
    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Error exchanging code for session:', error)
      // Redirect to login with error
      const loginUrl = new URL('/login', requestUrl.origin)
      loginUrl.searchParams.set('error', 'auth_failed')
      return NextResponse.redirect(loginUrl)
    }

    // Success - redirect to admin (or validated next param)
    return NextResponse.redirect(new URL(next, requestUrl.origin))
  }

  // No code provided - redirect to login
  return NextResponse.redirect(new URL('/login', requestUrl.origin))
}
