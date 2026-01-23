'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { devLog } from '@/lib/utils/devLog'

export default function CafeDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    devLog('cafe-detail-error', {
      digest: error.digest ?? null,
      name: error.name,
      message: error.message?.slice(0, 80) ?? null,
    })
  }, [error])

  const debugCode = error.digest ?? 'CAFE_ERR'

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="text-4xl mb-4" aria-hidden>
            ☕
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Something went wrong
          </h1>
          <p className="text-gray-600 mb-6">
            We couldn&apos;t load this café. Please try again or browse other cafés.
          </p>
          <div className="flex flex-col gap-3 mb-6">
            <button
              onClick={() => reset()}
              className="w-full inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-base font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              Try again
            </button>
            <Link
              href="/cities"
              className="w-full inline-flex items-center justify-center px-5 py-2.5 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              Back to cafés
            </Link>
          </div>
          <p className="text-xs text-gray-400 font-mono" aria-label="Debug code">
            {debugCode}
          </p>
        </div>
      </div>
    </div>
  )
}
