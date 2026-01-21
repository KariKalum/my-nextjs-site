import Link from 'next/link'
import NearbyMapClient from '@/components/home/NearbyMapClient'
import Section from '@/components/Section'

export default function NearbySection() {
  return (
    <Section id="nearby-section" spacing="md">
      {/* Header - constrained width */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Cafés near you</h2>
            <p className="text-gray-600">
              Find laptop-friendly spots within walking distance. We only show cafés from our directory.
            </p>
          </div>
          <Link
            href="/cities"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Browse all cities →
          </Link>
        </div>
      </div>

      {/* Map + Results - full width container */}
      <div className="w-full">
        <NearbyMapClient />
      </div>
    </Section>
  )
}
