import { Metadata } from 'next'
import Link from 'next/link'
import Logo from '@/components/Logo'
import BetaNotice from '@/components/BetaNotice'
import Hero from '@/components/home/Hero'
import ValueProps from '@/components/home/ValueProps'
import FeaturedCities from '@/components/home/FeaturedCities'
import HomepageData from '@/components/home/HomepageData'
import CommunityCTA from '@/components/home/CommunityCTA'
import CafeListing from '@/components/CafeListing'

export const metadata: Metadata = {
  title: 'Laptop Friendly Cafés in Germany | Find Your Perfect Workspace',
  description: 'Discover the best laptop-friendly cafés in Germany. Find cafés with fast WiFi, power outlets, quiet workspaces, and comfortable seating. Perfect for remote workers, freelancers, and digital nomads.',
  keywords: [
    'laptop friendly cafes Germany',
    'wifi cafes Germany',
    'coworking cafes Germany',
    'remote work cafes',
    'digital nomad cafes Germany',
    'quiet cafes to work',
    'cafes with power outlets Germany',
    'laptop friendly coffee shops',
  ],
  openGraph: {
    title: 'Laptop Friendly Cafés in Germany | Café Directory',
    description: 'Find the perfect laptop-friendly café in Germany. Browse cafés with excellent WiFi, power outlets, quiet workspaces, and all the amenities you need for productive remote work.',
    type: 'website',
    siteName: 'Café Directory',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Laptop Friendly Cafés in Germany',
    description: 'Discover the best laptop-friendly cafés in Germany for remote work, freelancing, and digital nomads.',
  },
  alternates: {
    canonical: '/',
  },
}

export default function Home({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Logo />
            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/submit"
                className="px-4 py-2 border border-primary-300 rounded-md text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100"
              >
                Suggest a Café
              </Link>
              <Link
                href="/cities"
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Browse by City →
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Beta Notice */}
      <BetaNotice />

      {/* Error Message */}
      {searchParams?.error === 'unauthorized' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              <strong>Access Denied:</strong> You do not have admin privileges. Only authorized administrators can access the admin dashboard.
            </p>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <Hero />

      {/* Value Props */}
      <ValueProps />

      {/* Featured Cities */}
      <FeaturedCities />

      {/* Recently Added & Top Rated Cafés */}
      <HomepageData />

      {/* Community CTA */}
      <CommunityCTA />

      {/* All Cafés Listing Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
            Browse All Cafés
          </h2>
          <CafeListing />
        </div>
      </section>
    </main>
  )
}
