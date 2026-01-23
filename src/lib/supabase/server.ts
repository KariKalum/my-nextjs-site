/**
 * Server-side Supabase client for Next.js Server Components and API routes
 * 
 * This client uses @supabase/ssr for proper cookie handling and session management.
 * 
 * USAGE:
 * - Server Components (app pages without 'use client')
 * - API Routes (app/api routes)
 * - Server Actions
 * 
 * DO NOT USE IN:
 * - Client Components ('use client')
 * - Browser-only code
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

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
// #region agent log
try {
  const validationResult = validateSupabaseEnv()
  const { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY } = validationResult
  fetch('http://127.0.0.1:7242/ingest/24a24cf4-1961-4c08-bb87-a79a77563728',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/lib/supabase/server.ts:59',message:'Env validation success',data:{urlLength:SUPABASE_URL?.length,keyLength:SUPABASE_ANON_KEY?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
} catch (validationError: any) {
  fetch('http://127.0.0.1:7242/ingest/24a24cf4-1961-4c08-bb87-a79a77563728',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/lib/supabase/server.ts:59',message:'Env validation failed',data:{error:validationError?.message?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  throw validationError
}
const { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY } = validateSupabaseEnv()
// #endregion

/**
 * Create a Supabase client for server-side usage
 * Handles cookies properly for Next.js Server Components
 * 
 * @example
 * ```ts
 * // In app/cafe/[id]/page.tsx (Server Component)
 * import { createClient } from '@/src/lib/supabase/server'
 * 
 * export default async function Page() {
 *   const supabase = await createClient()
 *   const { data } = await supabase.from('cafes').select('*')
 * }
 * ```
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {
          // The `set` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options })
        } catch (error) {
          // The `delete` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}
