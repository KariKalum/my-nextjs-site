'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface HeroProps {
  onSearchChange?: (query: string) => void
}

export default function Hero({ onSearchChange }: HeroProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    if (onSearchChange) {
      onSearchChange(query)
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Navigate to cities page with search or filter by query
      router.push(`/cities?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <section className="bg-gradient-to-br from-primary-50 via-white to-primary-50 py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Find laptop-friendly cafés in Germany
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8">
            Discover cafés with fast Wi-Fi, power outlets (Steckdosen), quiet workspaces, 
            and no time limits. Perfect for remote workers, freelancers, and digital nomads.
          </p>

          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="mb-8">
            <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search by city or café name..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
              >
                Search
              </button>
            </div>
          </form>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/cities"
              className="px-8 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
            >
              Browse cafés
            </Link>
            <Link
              href="/submit"
              className="px-8 py-3 bg-white text-primary-700 font-semibold rounded-lg border-2 border-primary-600 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
            >
              Submit a café
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
