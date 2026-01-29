import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'

// Mark as dynamic since we check environment variables
export const dynamic = 'force-dynamic'

/**
 * GET /api/_debug/env
 * Debug endpoint to verify server environment variables in production
 * 
 * Protected: Admin only
 * Returns: { hasServiceRoleKey: boolean, hasSupabaseUrl: boolean, vercelEnv: string | undefined }
 * 
 * Security:
 * - Does NOT return actual key values
 * - Requires admin authentication
 * - Returns 401 if not authenticated
 * - Returns 403 if authenticated but not admin
 */
export async function GET(request: NextRequest) {
  try {
    // Step 1: Get authenticated user using server client
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required.' },
        { status: 401 }
      )
    }

    // Step 2: Check if user is admin
    // Try profiles table first (if it exists)
    let isAdmin = false
    
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (!profileError && profileData && profileData.role === 'admin') {
      isAdmin = true
    } else {
      // Fallback to RPC function (checks admin_users table)
      const { data: adminCheck, error: adminError } = await supabase
        .rpc('is_current_user_admin')
      
      if (!adminError && adminCheck === true) {
        isAdmin = true
      }
    }

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      )
    }

    // Step 3: Return environment variable status (without exposing values)
    return NextResponse.json({
      hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      vercelEnv: process.env.VERCEL_ENV,
    })
  } catch (err) {
    console.error('Error in GET /api/_debug/env:', err)
    const errorMessage =
      err instanceof Error
        ? err.message
        : 'An unknown error occurred'
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
