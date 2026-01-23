/**
 * Client-side Supabase client for Next.js Client Components
 * 
 * This client uses @supabase/ssr for proper browser session management.
 * 
 * USAGE:
 * - Client Components ('use client')
 * - Browser-only code
 * 
 * DO NOT USE IN:
 * - Server Components
 * - API Routes
 * - Server Actions
 */

'use client'

import { createBrowserClient } from '@supabase/ssr'

/**
 * Validate Supabase environment variables at module initialization
 * Throws clear error if missing (prevents silent failures in production)
 */
function validateSupabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || url.trim() === '' || url.includes('placeholder')) {
    throw new Error(
      'Missing or invalid NEXT_PUBLIC_SUPABASE_URL environment variable.\n' +
      'Please add it to your .env.local file:\n' +
      'NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co\n\n' +
      'Get it from: Supabase Dashboard -> Settings -> API -> Project URL'
    )
  }

  if (!anonKey || anonKey.trim() === '' || anonKey.includes('placeholder')) {
    throw new Error(
      'Missing or invalid NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable.\n' +
      'Please add it to your .env.local file:\n' +
      'NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key\n\n' +
      'Get it from: Supabase Dashboard -> Settings -> API -> anon public key'
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

  return { url, anonKey }
}

// Validate at module load (fails fast if env vars missing)
const { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY } = validateSupabaseEnv()

/**
 * Create a Supabase client for client-side usage
 * 
 * @example
 * ```ts
 * // In components/MyComponent.tsx
 * 'use client'
 * import { createClient } from '@/src/lib/supabase/client'
 * 
 * export default function MyComponent() {
 *   const supabase = createClient()
 *   const { data } = await supabase.from('cafes').select('*')
 * }
 * ```
 */
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}
