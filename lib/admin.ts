import { createClient } from '@/src/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

/**
 * Check if a user is an admin
 * @param user - The user object from Supabase auth
 * @returns Promise<boolean> - True if user is an admin
 */
export async function isAdmin(user: User | null): Promise<boolean> {
  if (!user) return false

  try {
    const supabase = await createClient()
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

/**
 * Check if the current authenticated user is an admin (server-side)
 * @returns Promise<boolean> - True if current user is an admin
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return false

    return await isAdmin(user)
  } catch (error) {
    console.error('Error checking current user admin status:', error)
    return false
  }
}
