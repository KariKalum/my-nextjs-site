/**
 * Development-only healthcheck utility for Supabase connectivity
 * 
 * This utility helps validate Supabase configuration during development.
 * It should NOT be used in production builds.
 * 
 * USAGE (dev only):
 * ```ts
 * import { checkSupabaseHealth } from '@/src/lib/supabase/healthcheck'
 * 
 * // In a dev-only script or component
 * if (process.env.NODE_ENV === 'development') {
 *   const isHealthy = await checkSupabaseHealth()
 *   console.log('Supabase health:', isHealthy ? 'OK' : 'FAILED')
 * }
 * ```
 */

import { createClient } from './server'

/**
 * Check Supabase connectivity and configuration
 * Returns true if healthy, false otherwise
 * 
 * This performs a minimal query that doesn't leak sensitive data.
 * Only use in development environment.
 */
export async function checkSupabaseHealth(): Promise<boolean> {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    console.warn('[healthcheck] Healthcheck is only available in development')
    return false
  }

  try {
    const supabase = await createClient()
    
    // Perform a minimal query that doesn't expose data
    // Using a count query with limit 0 is safe and fast
    const { error } = await supabase
      .from('cafes')
      .select('id', { count: 'exact', head: true })
      .limit(0)

    if (error) {
      console.error('[healthcheck] Supabase connection failed:', error.message)
      return false
    }

    return true
  } catch (error: any) {
    console.error('[healthcheck] Healthcheck error:', error.message)
    return false
  }
}
