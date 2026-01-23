import Link from 'next/link'
import Image from 'next/image'
import Section from '@/components/Section'
import { getTopCitiesWithImages } from '@/src/lib/cafes/cities'

export default async function FeaturedCities() {
  // Fetch top 5 cities with images from major_cities table
  const topCities = await getTopCitiesWithImages(5).catch(() => [])

  return (
    <>
      {/* Cities with Most Cafés Section */}
      {topCities.length > 0 && (
        <Section spacing="md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Cities with Most Cafés
              </h2>
              <p className="text-gray-600">
                Explore cities with the highest number of laptop-friendly cafés
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {topCities.map((city) => (
                <Link
                  key={city.slug}
                  href={`/cities/${city.slug}`}
                  className="bg-white rounded-lg p-4 md:p-6 text-center border border-gray-200 hover:shadow-lg hover:border-primary-300 transition-all group"
                >
                  <div className="relative w-full aspect-video mb-3 rounded overflow-hidden bg-gray-100">
                    <Image
                      src={city.imageUrl}
                      alt={city.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    />
                  </div>
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors mb-1">
                    {city.name}
                  </h3>
                  <div className="text-sm text-gray-600">
                    {city.cafeCount} {city.cafeCount === 1 ? 'café' : 'cafés'}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </Section>
      )}
    </>
  )
}
