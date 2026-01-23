import Link from 'next/link'

export default function CafeNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="text-4xl mb-4" aria-hidden>
            🔍
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Café not found
          </h1>
          <p className="text-gray-600 mb-6">
            This café doesn&apos;t exist or has been removed. Explore others in our directory.
          </p>
          <Link
            href="/cities"
            className="inline-flex items-center justify-center w-full px-5 py-2.5 border border-transparent text-base font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
          >
            Browse cafés
          </Link>
        </div>
      </div>
    </div>
  )
}
