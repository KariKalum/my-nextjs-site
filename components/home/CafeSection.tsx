import Link from 'next/link'
import type { Cafe } from '@/lib/supabase'
import CafeCard from '@/components/CafeCard'

interface CafeSectionProps {
  title: string
  cafes: Cafe[]
  emptyMessage?: string
  showViewAll?: boolean
  viewAllLink?: string
}

export default function CafeSection({
  title,
  cafes,
  emptyMessage = 'No cafés found yet.',
  showViewAll = true,
  viewAllLink = '/cities',
}: CafeSectionProps) {
  if (cafes.length === 0) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
            {title}
          </h2>
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">{emptyMessage}</p>
            <Link
              href="/admin"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Add cafés in admin dashboard →
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            {title}
          </h2>
          {showViewAll && (
            <Link
              href={viewAllLink}
              className="text-primary-600 hover:text-primary-700 font-medium hidden md:block"
            >
              View all →
            </Link>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cafes.slice(0, 6).map((cafe) => (
            <CafeCard key={cafe.id} cafe={cafe} />
          ))}
        </div>
        {showViewAll && cafes.length > 6 && (
          <div className="text-center mt-8 md:hidden">
            <Link
              href={viewAllLink}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              View all cafés →
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
