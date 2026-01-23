'use client'

import Link from 'next/link'
import { devLog } from '@/lib/utils/devLog'
import { useEffect } from 'react'
import { type Locale } from '@/lib/i18n/config'

export default function CafeError({
  error,
  reset,
  params,
}: {
  error: Error & { digest?: string }
  reset: () => void
  params: { locale: Locale }
}) {
  useEffect(() => {
    devLog('CafeError', {
      msg: error.message?.slice(0, 100) || 'unknown',
      digest: error.digest || 'none',
    })
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Something went wrong
        </h1>
        <p className="text-gray-600 mb-6">
          We encountered an error loading this café. Please try again.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Try again
          </button>
          <Link
            href={`/${params.locale}/cities`}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back to cafés
          </Link>
        </div>
        {process.env.NEXT_PUBLIC_DEBUG_LOGS === 'true' && (
          <details className="mt-6 text-left">
            <summary className="text-sm text-gray-500 cursor-pointer">Debug info</summary>
            <pre className="mt-2 text-xs text-gray-400 overflow-auto">
              {error.digest || 'No digest'}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}
