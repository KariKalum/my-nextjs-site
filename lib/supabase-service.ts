/**
 * Server-only Supabase client using SERVICE_ROLE_KEY
 * 
 * SECURITY WARNING: This client uses the SERVICE_ROLE_KEY which has ADMIN privileges.
 * 
 * DO NOT:
 * - Import this in client components ('use client')
 * - Expose this key to the browser
 * - Use this in any client-side code
 * - Commit the SERVICE_ROLE_KEY to git
 * 
 * ONLY USE IN:
 * - API routes (app/api routes)
 * - Server Components (app pages without 'use client')
 * - Server Actions
 * - Middleware (with caution)
 * 
 * The SERVICE_ROLE_KEY bypasses ALL Row Level Security (RLS) policies
 * and has full database access. Treat it like a database password.
 */

import { createClient } from '@supabase/supabase-js'

/**
 * Get Supabase service role configuration
 * @throws {Error} If SERVICE_ROLE_KEY is missing
 */
function getServiceRoleConfig(): { url: string; serviceRoleKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || url.trim() === '' || url.includes('placeholder')) {
    throw new Error(
      'Missing or invalid NEXT_PUBLIC_SUPABASE_URL environment variable.\n' +
      'Please add it to your .env.local file:\n' +
      'NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co\n\n' +
      'Get it from: Supabase Dashboard -> Settings -> API -> Project URL'
    )
  }

  if (!serviceRoleKey || serviceRoleKey.trim() === '') {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY environment variable.\n' +
      'This key is required for server-side operations.\n' +
      'Get it from: Supabase Dashboard -> Settings -> API -> service_role key.\n' +
      'NEVER expose this key to the browser or client-side code!'
    )
  }

  // Validate URL format
  try {
    new URL(url)
  } catch {
    throw new Error(
      `Invalid NEXT_PUBLIC_SUPABASE_URL format: "${url}".\n` +
      'Expected a valid URL (e.g., https://your-project.supabase.co)'
    )
  }

  return { url, serviceRoleKey }
}

/**
 * Supabase client with SERVICE_ROLE_KEY (server-only)
 * 
 * This client has ADMIN privileges and bypasses all RLS policies.
 * Use only in API routes and server components.
 * 
 * @example
 * ```ts
 * // In app/api/admin/route.ts
 * import { supabaseService } from '@/lib/supabase-service'
 * 
 * export async function POST() {
 *   // This bypasses RLS - use with caution!
 *   const { data, error } = await supabaseService
 *     .from('products')
 *     .select('*')
 * }
 * ```
 */
let supabaseServiceInstance: ReturnType<typeof createClient> | null = null

/**
 * Initialize and return the Supabase service role client instance
 * Uses singleton pattern to ensure only one instance is created
 * Lazy initialization - only creates client when first accessed
 */
function createSupabaseServiceInstance() {
  if (supabaseServiceInstance) {
    return supabaseServiceInstance
  }

  const { url, serviceRoleKey } = getServiceRoleConfig()

  supabaseServiceInstance = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return supabaseServiceInstance
}

// Export a getter function instead of creating instance at module load
// This allows the build to succeed even if SERVICE_ROLE_KEY is not set
export function getSupabaseService() {
  return createSupabaseServiceInstance()
}

// Export the client instance getter (lazy initialization)
export const supabaseService = new Proxy({} as ReturnType<typeof createClient>, {
  get(target, prop) {
    const instance = createSupabaseServiceInstance()
    const value = instance[prop as keyof typeof instance]
    return typeof value === 'function' ? value.bind(instance) : value
  },
})
