import Link from 'next/link'

const cities = [
  { name: 'Berlin', slug: 'berlin' },
  { name: 'Hamburg', slug: 'hamburg' },
  { name: 'Munich', slug: 'munich' },
  { name: 'Cologne', slug: 'cologne' },
  { name: 'Frankfurt', slug: 'frankfurt' },
  { name: 'Leipzig', slug: 'leipzig' },
]

export default function FeaturedCities() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Explore by City
          </h2>
          <p className="text-lg text-gray-600">
            Discover laptop-friendly cafés in Germany's major cities
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {cities.map((city) => (
            <Link
              key={city.slug}
              href={`/cities/${city.slug}`}
              className="bg-white rounded-lg p-6 text-center border border-gray-200 hover:shadow-lg hover:border-primary-300 transition-all group"
            >
              <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">
                🏙️
              </div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                {city.name}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
