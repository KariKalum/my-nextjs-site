'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Cafe } from '@/src/lib/supabase/types'
import CafeCard from '@/components/CafeCard'
import Section from '@/components/Section'
import { t } from '@/lib/i18n/t'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/getDictionary'

interface CafeSectionClientProps {
  title: string
  description?: string
  cafes: Cafe[]
  emptyMessage?: string
  showViewAll?: boolean
  viewAllLink?: string
  locale: Locale
  dict?: Dictionary
}

export default function CafeSectionClient({
  title,
  description,
  cafes,
  emptyMessage = 'No cafés found yet.',
  showViewAll = true,
  viewAllLink = '/cities',
  locale,
  dict,
}: CafeSectionClientProps) {
  const viewAll = dict ? t(dict, 'home.sections.viewAll') : 'View all →'
  const viewAllCafes = dict ? t(dict, 'home.sections.viewAllCafes') : 'View all cafés →'
  const addInAdmin = dict ? t(dict, 'home.sections.addInAdmin') : 'Add cafés in admin dashboard →'
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768) // md breakpoint
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (cafes.length === 0) {
    return (
      <Section spacing="md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {title}
            </h2>
            {description && (
              <p className="text-gray-600">
                {description}
              </p>
            )}
          </div>
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">{emptyMessage}</p>
            <Link
              href="/admin"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              {addInAdmin}
            </Link>
          </div>
        </div>
      </Section>
    )
  }

  const displayLimit = isMobile ? 5 : 10
  const displayedCafes = cafes.slice(0, displayLimit)
  const hasMore = cafes.length > displayLimit

  return (
    <Section spacing="md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {title}
              </h2>
              {description && (
                <p className="text-gray-600">
                  {description}
                </p>
              )}
            </div>
            {showViewAll && (
              <Link
                href={viewAllLink}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                {viewAll}
              </Link>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedCafes.map((cafe) => (
            <CafeCard key={cafe.id} cafe={cafe} locale={locale} dict={dict} />
          ))}
        </div>
        {showViewAll && hasMore && (
          <div className="text-center mt-6">
            <Link
              href={viewAllLink}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              {viewAllCafes}
            </Link>
          </div>
        )}
      </div>
    </Section>
  )
}
