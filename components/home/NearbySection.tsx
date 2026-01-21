import Link from 'next/link'
import NearbyMapClient from '@/components/home/NearbyMapClient'

export default function NearbySection() {
  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Cafés near you</h2>
            <p className="text-gray-600 mt-2">
              Find laptop-friendly spots within walking distance. We only show cafés from our directory.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/cities"
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Browse all cities →
            </Link>
          </div>
        </div>

        {/* Map + controls (client-side only) */}
        <NearbyMapClient />
      </div>
    </section>
  )
}
