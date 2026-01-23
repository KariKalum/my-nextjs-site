'use client'

import { createClient } from '@/src/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

/**
 * Check if a user is an admin (client-side)
 * @param user - The user object from Supabase auth
 * @returns Promise<boolean> - True if user is an admin
 */
export async function isAdmin(user: User | null): Promise<boolean> {
  if (!user) return false

  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', user.id)
      .single()

    if (error || !data) return false
    return true
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}
