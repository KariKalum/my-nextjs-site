'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/src/lib/supabase/client'
import { getCafeHref } from '@/lib/cafeRouting'
import { getLocaleFromPathname } from '@/lib/i18n/routing'
import { t } from '@/lib/i18n/t'
import type { Dictionary } from '@/lib/i18n/getDictionary'

interface HeroProps {
  dict: Dictionary
  onSearchChange?: (query: string) => void
}

interface Suggestion {
  type: 'city' | 'cafe'
  label: string
  value: string
  slug?: string
}

export default function Hero({ dict, onSearchChange }: HeroProps) {
  const router = useRouter()
  const pathname = usePathname()
  const locale = getLocaleFromPathname(pathname)
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    const timeoutId = setTimeout(async () => {
      await fetchSuggestions(searchQuery.trim())
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const fetchSuggestions = async (query: string) => {
    setLoading(true)
    try {
      const supabase = createClient()

      const queryLower = query.toLowerCase()
      const results: Suggestion[] = []

      // Fetch cities (distinct)
      const { data: citiesData } = await supabase
        .from('cafes')
        .select('city')
        .or('is_active.is.null,is_active.eq.true')
        .ilike('city', `%${query}%`)
        .limit(5)

      const uniqueCities = new Set<string>()
      citiesData?.forEach((item) => {
        if (item.city && !uniqueCities.has(item.city)) {
          uniqueCities.add(item.city)
          results.push({
            type: 'city',
            label: item.city,
            value: item.city,
            slug: item.city.toLowerCase(),
          })
        }
      })

      // Fetch cafes by name
      const { data: cafesData } = await supabase
        .from('cafes')
        .select('id, name, city, place_id')
        .or('is_active.is.null,is_active.eq.true')
        .ilike('name', `%${query}%`)
        .limit(5)

      cafesData?.forEach((cafe) => {
        results.push({
          type: 'cafe',
          label: cafe.name,
          value: cafe.name,
          slug: cafe.place_id || cafe.id,
        })
      })

      // Sort: cities first, then cafes, limit to 8 total
      const sorted = results
        .sort((a, b) => {
          if (a.type !== b.type) return a.type === 'city' ? -1 : 1
          return a.label.localeCompare(b.label)
        })
        .slice(0, 8)

      setSuggestions(sorted)
      setShowSuggestions(sorted.length > 0)
      setSelectedIndex(-1)
    } catch (error) {
      console.error('Error fetching suggestions:', error)
      setSuggestions([])
      setShowSuggestions(false)
    } finally {
      setLoading(false)
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    if (onSearchChange) {
      onSearchChange(query)
    }
  }

  const handleSelectSuggestion = (suggestion: Suggestion) => {
    setSearchQuery(suggestion.value)
    setShowSuggestions(false)
    setSelectedIndex(-1)

    if (suggestion.type === 'city') {
      router.push(`/${locale}/cities/${suggestion.slug}`)
    } else {
      // suggestion.slug is place_id || id from the cafe
      router.push(getCafeHref({ place_id: suggestion.slug || null, id: suggestion.slug }, locale))
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter' && searchQuery.trim()) {
        handleSearchSubmit(e as any)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[selectedIndex])
        } else if (searchQuery.trim()) {
          handleSearchSubmit(e as any)
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
      handleSelectSuggestion(suggestions[selectedIndex])
    } else if (searchQuery.trim()) {
      router.push(`/${locale}/cities?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleInputBlur = () => {
    // Delay to allow click events on suggestions
    setTimeout(() => {
      setShowSuggestions(false)
      setSelectedIndex(-1)
    }, 200)
  }

  const handleUseLocation = () => {
    setLocationError(null)
    setLocationLoading(true)

    if (!navigator.geolocation) {
      setLocationError(t(dict, 'home.hero.locationDenied'))
      setLocationLoading(false)
      setTimeout(() => setLocationError(null), 5000)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        setLocationLoading(false)
        // Scroll to nearby section on homepage
        const nearbySection = document.getElementById('nearby-section')
        if (nearbySection) {
          nearbySection.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      },
      (error) => {
        setLocationError(t(dict, 'home.hero.locationDenied'))
        setLocationLoading(false)
        // Clear error after 5 seconds
        setTimeout(() => setLocationError(null), 5000)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <section className="bg-gradient-to-br from-primary-50 via-white to-primary-50 pt-10 md:pt-16 pb-12 md:pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
            {t(dict, 'home.hero.title')}
          </h1>
          <p className="text-lg md:text-xl font-normal text-gray-600 mb-6">
            {t(dict, 'home.hero.subtitle')}
          </p>

          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="mb-8">
            <div className="relative max-w-2xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative w-full sm:w-auto">
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                      if (suggestions.length > 0) {
                        setShowSuggestions(true)
                      }
                    }}
                    onBlur={handleInputBlur}
                    placeholder={t(dict, 'home.hero.placeholder')}
                    className="w-full px-6 pr-14 py-4 md:py-5 text-base border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                  />
                  <button
                    type="button"
                    onClick={handleUseLocation}
                    disabled={locationLoading}
                    aria-label="Use my location"
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-5 h-5"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                  </button>
                  {locationError && (
                    <div className="absolute left-0 right-0 top-full mt-2 z-50">
                      <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-800 shadow-sm">
                        {locationError}
                      </div>
                    </div>
                  )}
                  {loading && searchQuery.trim() && (
                    <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
                      <div className="flex items-center gap-3 text-gray-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                        <span className="text-sm">{t(dict, 'home.hero.searching')}</span>
                      </div>
                    </div>
                  )}
                  {showSuggestions && suggestions.length > 0 && (
                    <div
                      ref={suggestionsRef}
                      className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto"
                    >
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={`${suggestion.type}-${index}`}
                          type="button"
                          onClick={() => handleSelectSuggestion(suggestion)}
                          className={`w-full px-6 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                            index === selectedIndex ? 'bg-primary-50' : ''
                          }`}
                          onMouseEnter={() => setSelectedIndex(index)}
                        >
                          <span className="text-gray-400 text-sm">
                            {suggestion.type === 'city' ? '🏙️' : '☕'}
                          </span>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {suggestion.label}
                            </div>
                            <div className="text-sm text-gray-500">
                              {suggestion.type === 'city'
                                ? 'City'
                                : 'Café'}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-4 md:py-5 text-base bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors touch-manipulation"
                >
                  {t(dict, 'home.hero.searchButton')}
                </button>
              </div>
            </div>
          </form>

          {/* Popular Searches */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            <span className="text-sm text-gray-500 mr-1">{t(dict, 'home.hero.popular')}</span>
            {['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt'].map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => {
                  setSearchQuery(city)
                  router.push(`/${locale}/cities/${city.toLowerCase()}`)
                }}
                className="px-4 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-full hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
              >
                {city}
              </button>
            ))}
          </div>

          {/* Secondary CTA */}
          <div className="flex justify-center">
            <Link
              href={`/${locale}/submit`}
              className="px-6 py-2.5 text-sm text-gray-600 hover:text-gray-900 font-medium border border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
            >
              {t(dict, 'home.hero.submitCafe')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
