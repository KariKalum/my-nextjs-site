import Link from 'next/link'
import { defaultLocale } from '@/lib/i18n/config'
import { withLocale } from '@/lib/i18n/path'

export default function NotFound() {
  // Root not-found is outside locale routes, so use default locale
  const homeHref = withLocale(defaultLocale, '/')
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Café Not Found</h2>
        <p className="text-gray-600 mb-8">
          The café you're looking for doesn't exist or has been removed.
        </p>
        <Link
          href={homeHref}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
        >
          Back to Directory
        </Link>
      </div>
    </div>
  )
}
