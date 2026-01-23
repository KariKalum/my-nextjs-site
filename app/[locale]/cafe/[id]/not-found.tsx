import Link from 'next/link'
import { type Locale } from '@/lib/i18n/config'

export default function CafeNotFound({ params }: { params: { locale: Locale } }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Café not found
        </h1>
        <p className="text-gray-600 mb-6">
          The café you're looking for doesn't exist or has been removed.
        </p>
        <Link
          href={`/${params.locale}/cities`}
          className="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Browse All Cafés
        </Link>
      </div>
    </div>
  )
}
