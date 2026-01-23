'use client'

import { useState, useEffect, FormEvent } from 'react'
import { createClient } from '@/src/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'

export default function AuthExample() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Sign up state
  const [signUpEmail, setSignUpEmail] = useState('')
  const [signUpPassword, setSignUpPassword] = useState('')
  const [signUpLoading, setSignUpLoading] = useState(false)
  const [signUpError, setSignUpError] = useState<string | null>(null)
  const [signUpSuccess, setSignUpSuccess] = useState(false)
  
  // Sign in state
  const [signInEmail, setSignInEmail] = useState('')
  const [signInPassword, setSignInPassword] = useState('')
  const [signInLoading, setSignInLoading] = useState(false)
  const [signInError, setSignInError] = useState<string | null>(null)
  
  // Sign out state
  const [signOutLoading, setSignOutLoading] = useState(false)
  const [signOutError, setSignOutError] = useState<string | null>(null)

  // Check for existing session on mount
  useEffect(() => {
    const supabase = createClient()
    
    async function getSession() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          return
        }

        setSession(session)
        setUser(session?.user ?? null)
      } catch (err) {
        console.error('Error checking session:', err)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleSignUp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    try {
      setSignUpLoading(true)
      setSignUpError(null)
      setSignUpSuccess(false)

      const supabase = createClient()
      const { data, error } = await supabase.auth.signUp({
        email: signUpEmail,
        password: signUpPassword,
      })

      if (error) {
        throw error
      }

      setSignUpSuccess(true)
      setSignUpEmail('')
      setSignUpPassword('')
      
      // If email confirmation is not required, user is immediately signed in
      if (data.user) {
        setUser(data.user)
        setSession(data.session)
      }
      
      console.log('Sign up successful:', data)
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'An unknown error occurred while signing up'
      setSignUpError(errorMessage)
      console.error('Error signing up:', err)
    } finally {
      setSignUpLoading(false)
    }
  }

  const handleSignIn = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    try {
      setSignInLoading(true)
      setSignInError(null)

      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: signInEmail,
        password: signInPassword,
      })

      if (error) {
        throw error
      }

      setUser(data.user)
      setSession(data.session)
      setSignInEmail('')
      setSignInPassword('')
      
      console.log('Sign in successful:', data)
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'An unknown error occurred while signing in'
      setSignInError(errorMessage)
      console.error('Error signing in:', err)
    } finally {
      setSignInLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      setSignOutLoading(true)
      setSignOutError(null)

      const supabase = createClient()
      const { error } = await supabase.auth.signOut()

      if (error) {
        throw error
      }

      setUser(null)
      setSession(null)
      
      console.log('Sign out successful')
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'An unknown error occurred while signing out'
      setSignOutError(errorMessage)
      console.error('Error signing out:', err)
    } finally {
      setSignOutLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="text-gray-600">Loading authentication state...</div>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Authentication Example</h2>

      {/* Current User Display */}
      {user && session ? (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <h3 className="text-lg font-semibold mb-2 text-green-800">
            Logged In
          </h3>
          <div className="space-y-1 text-sm">
            <div>
              <span className="font-medium text-green-700">Email:</span>{' '}
              <span className="text-green-600">{user.email}</span>
            </div>
            <div>
              <span className="font-medium text-green-700">User ID:</span>{' '}
              <span className="text-green-600 text-xs">{user.id}</span>
            </div>
            {user.email_confirmed_at && (
              <div className="text-green-600 text-xs">
                ✓ Email confirmed
              </div>
            )}
          </div>

          {signOutError && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs">
              <div className="text-red-600 font-semibold">Sign Out Error:</div>
              <div className="text-red-500 mt-1">{signOutError}</div>
            </div>
          )}

          <button
            onClick={handleSignOut}
            disabled={signOutLoading}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {signOutLoading ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
          <p className="text-gray-600">Not logged in</p>
        </div>
      )}

      {/* Sign Up Form */}
      {!user && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="text-lg font-semibold mb-3">Sign Up</h3>
          
          {signUpError && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded text-sm">
              <div className="text-red-600 font-semibold">Error:</div>
              <div className="text-red-500 mt-1">{signUpError}</div>
            </div>
          )}

          {signUpSuccess && (
            <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded text-sm">
              <div className="text-green-600 font-semibold">Success!</div>
              <div className="text-green-500 mt-1">
                Account created. {session ? 'You are now signed in.' : 'Please check your email to confirm your account.'}
              </div>
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={signUpEmail}
                onChange={(e) => setSignUpEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                placeholder="your.email@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={signUpPassword}
                onChange={(e) => setSignUpPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                minLength={6}
                placeholder="Minimum 6 characters"
              />
            </div>
            <button
              type="submit"
              disabled={signUpLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {signUpLoading ? 'Signing up...' : 'Sign Up'}
            </button>
          </form>
        </div>
      )}

      {/* Sign In Form */}
      {!user && (
        <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-md">
          <h3 className="text-lg font-semibold mb-3">Sign In</h3>
          
          {signInError && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded text-sm">
              <div className="text-red-600 font-semibold">Error:</div>
              <div className="text-red-500 mt-1">{signInError}</div>
            </div>
          )}

          <form onSubmit={handleSignIn} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={signInEmail}
                onChange={(e) => setSignInEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
                placeholder="your.email@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={signInPassword}
                onChange={(e) => setSignInPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
                placeholder="Enter your password"
              />
            </div>
            <button
              type="submit"
              disabled={signInLoading}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {signInLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      )}

      {/* Session Info (Debug) */}
      {session && (
        <details className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
          <summary className="cursor-pointer text-sm font-medium text-gray-700">
            Session Details (JSON)
          </summary>
          <pre className="mt-3 text-xs bg-gray-100 p-3 rounded overflow-auto">
            {JSON.stringify(session, null, 2)}
          </pre>
        </details>
      )}
    </div>
  )
}
