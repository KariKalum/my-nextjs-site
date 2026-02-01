import { Metadata } from 'next'
import Link from 'next/link'
import Logo from '@/components/Logo'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { prefixWithLocale } from '@/lib/i18n/routing'
import Hero from '@/components/home/Hero'
import ValueProps from '@/components/home/ValueProps'
import FeaturedCities from '@/components/home/FeaturedCities'
import NearbySection from '@/components/home/NearbySection'
import HomepageData from '@/components/home/HomepageData'
import HomepageFAQ from '@/components/home/HomepageFAQ'
import CommunityCTA from '@/components/home/CommunityCTA'
import { getLocaleFromParams, type Locale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/getDictionary'
import { t } from '@/lib/i18n/t'

export async function generateMetadata({
  params,
}: {
  params: { locale: Locale }
}): Promise<Metadata> {
  const locale = getLocaleFromParams(params)
  const { getHreflangAlternates } = await import('@/lib/seo/metadata')
  
  return {
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
    ...getHreflangAlternates('/', locale),
  }
}

export default function Home({
  searchParams,
  params,
}: {
  searchParams: { error?: string }
  params: { locale: Locale }
}) {
  const locale = getLocaleFromParams(params)
  const dict = getDictionary(locale)

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex flex-row h-[var(--header-row-height)] items-center w-full">
          <div className="flex-1 md:flex-initial min-w-0 flex justify-center md:justify-start">
            <Logo />
          </div>
          <div className="flex-1 md:flex-initial md:ml-auto flex justify-end items-center gap-2 md:gap-4 flex-shrink-0">
            <Link
              href={prefixWithLocale('/how-it-works', locale)}
              className="text-xs md:text-sm text-gray-600 hover:text-gray-900 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 rounded whitespace-nowrap"
              aria-label="How this works?"
            >
              <span className="md:hidden">?</span>
              <span className="hidden md:inline">How this works?</span>
            </Link>
            <LanguageSwitcher />
            <a
              href="https://www.buymeacoffee.com/uncialabs"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Buy me a coffee"
              className="inline-flex items-center justify-center text-xl md:text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 rounded transition-colors md:px-3 md:py-1.5 md:text-gray-600 md:hover:text-gray-800 md:border md:border-gray-200 md:hover:bg-gray-50"
            >
              <span className="md:hidden">🍵</span>
              <span className="hidden md:inline">☕ Buy me a coffee</span>
            </a>
          </div>
        </div>
      </header>

      {/* Error Message */}
      {searchParams?.error === 'unauthorized' && (
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 md:pt-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              <strong>{t(dict, 'home.error.unauthorizedTitle')}</strong>{' '}
              {t(dict, 'home.error.unauthorizedText')}
            </p>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <Hero dict={dict} />

      {/* Cafés near you */}
      <NearbySection dict={dict} locale={locale} />

      {/* Value Props */}
      <ValueProps dict={dict} />

      {/* Featured Cities */}
      <FeaturedCities params={{ locale }} dict={dict} />

      {/* Recently Added & Top Rated Cafés */}
      <HomepageData params={{ locale }} dict={dict} />

      {/* FAQ Section */}
      <HomepageFAQ dict={dict} />

      {/* Community CTA */}
      <CommunityCTA dict={dict} locale={locale} />
    </main>
  )
}
