import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabase, type Cafe } from '@/lib/supabase'
import CafeCard from '@/components/CafeCard'

// SEO intro paragraphs for major German cities
const cityIntros: Record<string, string> = {
  berlin: 'Berlin, Germany\'s vibrant capital, offers an incredible selection of laptop-friendly cafés perfect for remote workers, freelancers, and digital nomads. From trendy Kreuzberg coffee shops to quiet Prenzlauer Berg workspaces, find cafés with fast WiFi, power outlets, and comfortable seating throughout the city.',
  hamburg: 'Discover Hamburg\'s best laptop-friendly cafés, from the historic Speicherstadt to trendy Sternschanze. These cafés offer excellent WiFi, plenty of power outlets, and quiet workspaces ideal for productivity. Perfect for remote workers exploring Germany\'s second-largest city.',
  munich: 'Munich\'s laptop-friendly café scene combines traditional Bavarian charm with modern workspaces. Find cafés in Schwabing, Glockenbachviertel, and throughout the city center with high-speed WiFi, comfortable seating, and a welcoming atmosphere for remote work.',
  cologne: 'Cologne boasts a thriving café culture perfect for laptop users. Explore cafés in the Altstadt, Belgisches Viertel, and beyond, each offering fast internet, power outlets, and comfortable spaces for remote work and studying.',
  frankfurt: 'Frankfurt, Germany\'s financial hub, is home to numerous laptop-friendly cafés catering to professionals and remote workers. Find excellent WiFi, quiet workspaces, and modern amenities throughout the city center and surrounding neighborhoods.',
  leipzig: 'Leipzig\'s growing tech scene is matched by its excellent selection of laptop-friendly cafés. Discover workspaces in the city center and trendy neighborhoods with fast WiFi, power outlets, and inspiring environments for remote work and creativity.',
}

const majorCities = ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt', 'Leipzig']

async function getCafesByCity(cityName: string): Promise<Cafe[]> {
  try {
    // Fetch all active cafes
    const { data, error } = await supabase
      .from('cafes')
      .select('*')
      .eq('is_active', true)
      .order('overall_laptop_rating', { ascending: false })

    if (error) throw error

    // Filter by city name (case-insensitive)
    const filtered = (data || []).filter((cafe) =>
      cafe.city?.toLowerCase() === cityName.toLowerCase()
    ) as Cafe[]

    return filtered
  } catch (error) {
    console.error('Error fetching cafes by city:', error)
    return []
  }
}

function getCityNameFromSlug(slug: string): string {
  // Map common slugs to proper city names
  const cityMap: Record<string, string> = {
    berlin: 'Berlin',
    hamburg: 'Hamburg',
    munich: 'Munich',
    cologne: 'Cologne',
    frankfurt: 'Frankfurt',
    leipzig: 'Leipzig',
  }

  const lowerSlug = slug.toLowerCase()
  if (cityMap[lowerSlug]) {
    return cityMap[lowerSlug]
  }

  // Fallback: Convert slug to proper city name
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export async function generateMetadata({
  params,
}: {
  params: { city: string }
}): Promise<Metadata> {
  const cityName = getCityNameFromSlug(params.city)
  const cafes = await getCafesByCity(cityName)
  const count = cafes.length

  // Import SEO helpers
  const { siteName, getAbsoluteUrl } = await import('@/lib/seo/metadata')

  // Build title: "Laptop-friendly cafés in <City> | <SiteName>"
  const title = `Laptop-friendly cafés in ${cityName} | ${siteName}`

  // Build description mentioning working/studying, Wi-Fi, outlets, quiet spaces, Germany
  let description: string
  if (count > 0) {
    description = `Discover ${count} laptop-friendly cafés in ${cityName}, Germany. Perfect for remote work and studying with fast Wi-Fi, power outlets (Steckdosen), and quiet workspaces. Find your ideal café workspace.`
  } else {
    description = `Find laptop-friendly cafés in ${cityName}, Germany. Perfect for remote work and studying with fast Wi-Fi, power outlets, and quiet workspaces.`
  }

  // Get canonical URL
  const canonicalUrl = getAbsoluteUrl(`/cities/${params.city}`)

  // Get default OG image
  const ogImage = getAbsoluteUrl('/og-default.jpg')

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonicalUrl,
      siteName,
      images: [
        {
          url: ogImage,
          alt: `Laptop-friendly cafés in ${cityName}, Germany`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: canonicalUrl,
    },
  }
}

export default async function CityPage({
  params,
}: {
  params: { city: string }
}) {
  const cityName = getCityNameFromSlug(params.city)
  const cafes = await getCafesByCity(cityName)

  // Get intro text if available
  const cityKey = params.city.toLowerCase()
  const introText = cityIntros[cityKey] || null

  // Get other major cities for internal links
  const otherCities = majorCities
    .filter((city) => city.toLowerCase() !== cityName.toLowerCase())
    .slice(0, 5) // Show top 5 other cities

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 mb-3">
            <Link
              href="/"
              className="text-primary-600 hover:text-primary-700 font-medium text-sm"
            >
              ← Home
            </Link>
            <span className="text-gray-400">•</span>
            <Link
              href="/cities"
              className="text-primary-600 hover:text-primary-700 font-medium text-sm"
            >
              All Cities
            </Link>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            Laptop-friendly cafés in {cityName}
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            {cafes.length} {cafes.length === 1 ? 'café found' : 'cafés found'}
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* SEO Intro Paragraph */}
        {introText && (
          <section className="mb-12">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
              <p className="text-gray-700 leading-relaxed text-base md:text-lg">
                {introText}
              </p>
            </div>
          </section>
        )}

        {/* Internal Links to Other Cities */}
        {otherCities.length > 0 && (
          <section className="mb-12">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Explore Other Cities
            </h2>
            <div className="flex flex-wrap gap-2">
              {otherCities.map((city) => (
                <Link
                  key={city}
                  href={`/cities/${encodeURIComponent(city.toLowerCase())}`}
                  className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-primary-300 hover:text-primary-700 transition-colors"
                >
                  {city}
                </Link>
              ))}
              <Link
                href="/cities"
                className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-primary-300 hover:text-primary-700 transition-colors"
              >
                View All Cities →
              </Link>
            </div>
          </section>
        )}

        {/* Café Grid */}
        {cafes.length === 0 ? (
          <section>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="text-6xl mb-4">☕</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  No cafés found in {cityName} yet
                </h2>
                <p className="text-gray-600 mb-6">
                  Be the first to add a laptop-friendly café in {cityName}! Help the remote work community discover great workspaces.
                </p>
                <Link
                  href="/submit"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                >
                  Submit a café in {cityName}
                </Link>
              </div>
            </div>
          </section>
        ) : (
          <section>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cafes.map((cafe) => (
                <CafeCard key={cafe.id} cafe={cafe} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
