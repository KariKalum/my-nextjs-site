import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * Get Supabase environment variables with validation
 * @throws {Error} If required environment variables are missing
 */
function getSupabaseConfig(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL environment variable. ' +
        'Please add it to your .env.local file.'
    )
  }

  if (!anonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. ' +
        'Please add it to your .env.local file.'
    )
  }

  // Validate URL format
  try {
    new URL(url)
  } catch {
    throw new Error(
      `Invalid NEXT_PUBLIC_SUPABASE_URL format: "${url}". ` +
        'Expected a valid URL (e.g., https://your-project.supabase.co)'
    )
  }

  return { url, anonKey }
}

/**
 * Supabase client instance
 * 
 * @example
 * ```ts
 * import { supabaseClient } from '@/src/lib/supabaseClient'
 * 
 * const { data, error } = await supabaseClient
 *   .from('cafes')
 *   .select('*')
 * ```
 */
let supabaseClientInstance: SupabaseClient | null = null

/**
 * Initialize and return the Supabase client instance
 * Uses singleton pattern to ensure only one instance is created
 */
function createSupabaseClientInstance(): SupabaseClient {
  if (supabaseClientInstance) {
    return supabaseClientInstance
  }

  const { url, anonKey } = getSupabaseConfig()

  supabaseClientInstance = createSupabaseClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })

  return supabaseClientInstance
}

// Export the client instance
export const supabaseClient = createSupabaseClientInstance()

// Export a function to get a fresh client (useful for testing or special cases)
export function getSupabaseClient(): SupabaseClient {
  return createSupabaseClientInstance()
}

// Export types for better TypeScript support
export type { SupabaseClient } from '@supabase/supabase-js'
