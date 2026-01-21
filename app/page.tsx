import { Metadata } from 'next'
import Link from 'next/link'
import Logo from '@/components/Logo'
import BetaNotice from '@/components/BetaNotice'
import Hero from '@/components/home/Hero'
import ValueProps from '@/components/home/ValueProps'
import FeaturedCities from '@/components/home/FeaturedCities'
import NearbySection from '@/components/home/NearbySection'
import HomepageData from '@/components/home/HomepageData'
import CommunityCTA from '@/components/home/CommunityCTA'

export const metadata: Metadata = {
  title: 'Laptop-Friendly Cafés in Germany | Fast Wi-Fi, Power Outlets & Quiet Workspaces',
  description: 'Discover the best laptop-friendly cafés in Germany with fast Wi-Fi, power outlets, quiet spaces, and time-limit friendly seating—perfect for remote work and studying.',
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

      {/* Cafés near you */}
      <NearbySection />

      {/* Value Props */}
      <ValueProps />

      {/* Featured Cities */}
      <FeaturedCities />

      {/* Recently Added & Top Rated Cafés */}
      <HomepageData />

      {/* Community CTA */}
      <CommunityCTA />
    </main>
  )
}
