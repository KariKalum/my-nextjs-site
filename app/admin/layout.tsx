'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-client'
import type { User } from '@supabase/supabase-js'
import { ReactNode } from 'react'

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)

      // If no user, redirect to login (middleware should catch this, but double-check)
      if (!user) {
        router.push('/login?redirect=' + encodeURIComponent(window.location.pathname))
        return
      }

      setLoading(false)
    }

    checkUser()

    // Listen for auth changes
    const supabase = createClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) {
        router.push('/login?redirect=' + encodeURIComponent(window.location.pathname))
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-2xl font-bold text-primary-600">
                ☕ Café Directory
              </Link>
              <nav className="hidden md:flex space-x-4">
                <Link
                  href="/admin"
                  className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/cafes/new"
                  className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Add Café
                </Link>
                <Link
                  href="/admin/submissions"
                  className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Submissions
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              {user && (
                <span className="text-sm text-gray-600">
                  {user.email}
                </span>
              )}
              <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                Admin
              </span>
              <Link
                href="/"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                View Site
              </Link>
              {user && (
                <button
                  onClick={handleSignOut}
                  className="text-sm text-gray-600 hover:text-red-600 px-3 py-2 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  )
}
