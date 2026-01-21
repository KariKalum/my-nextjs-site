import Link from 'next/link'

interface SearchResultsProps {
  cafes: Array<{ id: string; name: string }>
  cityName?: string
  children: React.ReactNode
}

export default function SearchResults({ cafes, cityName, children }: SearchResultsProps) {
  // Show empty state if no results
  if (cafes.length === 0) {
    return (
      <section>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="text-6xl mb-4">☕</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              No cafés found
            </h2>
            <p className="text-gray-600 mb-6">
              {cityName 
                ? `No cafés found in ${cityName}. Try a nearby city or submit a café.`
                : 'No cafés found. Try a nearby city or submit a café.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/cities"
                className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Browse all cities
              </Link>
              <Link
                href="/submit"
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 transition-colors"
              >
                Submit a café
              </Link>
            </div>
          </div>
        </div>
      </section>
    )
  }

  // Show results
  return <>{children}</>
}
