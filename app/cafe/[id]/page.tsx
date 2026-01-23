import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { createClient } from '@/src/lib/supabase/server'
import type { Cafe } from '@/src/lib/supabase/types'
import CafeDetailSEO from '@/components/CafeDetailSEO'
import { combineDescription } from '@/lib/utils/description-combiner'
import { getCafeHref, getDetailRouteQueryConfig } from '@/lib/cafeRouting'
import { devLog } from '@/lib/utils/devLog'

/**
 * Production-safe cafe loader that never returns false 404s.
 * Distinguishes between permission errors, network errors, and actual not-found.
 */
type CafeLoadResult =
  | { success: true; cafe: Cafe }
  | { success: false; reason: 'not_found' | 'permission_error' | 'network_error' | 'invalid_param'; error?: any }

async function getCafe(id: string): Promise<CafeLoadResult> {
  const config = getDetailRouteQueryConfig(id)
  if (!config) {
    devLog('getCafe', { msg: 'invalid_param', param: (id ?? 'null').toString().slice(0, 20) })
    return { success: false, reason: 'invalid_param' }
  }

  const { param: trimmedId, queriedColumn, isPlaceId } = config
  const logContext = {
    param: trimmedId.substring(0, 30),
    queriedColumn,
    isPlaceId,
  }

  try {
    // Create Supabase client (validated at module load)
    const supabase = await createClient()

    // Query with safe is_active handling: true OR NULL
    // Use .or() to allow rows where is_active is true OR NULL
    let query = supabase
      .from('cafes')
      .select('*')
      .eq(queriedColumn, trimmedId)
      .or('is_active.is.null,is_active.eq.true')

    const { data, error } = await query.single()

    // Handle Supabase errors
    if (error) {
      const errorCode = error.code || 'UNKNOWN'
      const sanitizedCode = typeof errorCode === 'string' ? errorCode : 'UNKNOWN'

      // PGRST116 = no rows found (actual 404)
      if (sanitizedCode === 'PGRST116') {
        devLog('getCafe', { ...logContext, code: sanitizedCode, msg: 'not_found' })
        return { success: false, reason: 'not_found' }
      }

      // PGRST301 = permission denied / RLS violation
      if (sanitizedCode === 'PGRST301' || sanitizedCode.includes('permission') || sanitizedCode.includes('403')) {
        devLog('getCafe', { ...logContext, code: sanitizedCode, msg: 'permission_error' })
        return { success: false, reason: 'permission_error', error }
      }

      // Network/connection errors
      if (
        sanitizedCode.includes('network') ||
        sanitizedCode.includes('ECONNREFUSED') ||
        sanitizedCode.includes('ETIMEDOUT') ||
        sanitizedCode.includes('401')
      ) {
        devLog('getCafe', { ...logContext, code: sanitizedCode, msg: 'network_error' })
        return { success: false, reason: 'network_error', error }
      }

      // Other known Supabase errors
      devLog('getCafe', { ...logContext, code: sanitizedCode, msg: 'query_error' })
      return { success: false, reason: 'network_error', error }
    }

    // If no data found (shouldn't happen with .single() but be safe)
    if (!data) {
      devLog('getCafe', { ...logContext, msg: 'no_data' })
      return { success: false, reason: 'not_found' }
    }

    // Success - combine descriptions and return
    const descriptionText = combineDescription(data.description, data.ai_inference_notes)
    const cafe = { ...data, descriptionText } as Cafe

    devLog('getCafe', { ...logContext, cafeId: cafe.id?.slice(0, 20) ?? null })

    return { success: true, cafe }
  } catch (err: unknown) {
    // Unexpected errors: rethrow so error boundary handles them (not swallowed)
    devLog('getCafe', {
      ...logContext,
      msg: 'unexpected',
      err: err instanceof Error ? err.message?.slice(0, 60) : String(err).slice(0, 60),
    })
    throw err
  }
}

/**
 * Fetch nearby cafes efficiently (single query, no N+1)
 */
async function getNearbyCafes(cafe: Cafe, limit: number = 3): Promise<Cafe[]> {
  try {
    if (!cafe.latitude || !cafe.longitude || !cafe.city) {
      return []
    }

    // Create Supabase client (validated at module load)
    const supabase = await createClient()

    // Single query with safe is_active handling
    const { data, error } = await supabase
      .from('cafes')
      .select('id, place_id, name, city, address, work_score, google_rating')
      .eq('city', cafe.city)
      .neq('id', cafe.id)
      .or('is_active.is.null,is_active.eq.true')
      .order('work_score', { ascending: false, nullsFirst: false })
      .limit(limit)

    if (error || !data) {
      return []
    }

    return data as Cafe[]
  } catch (error) {
    return []
  }
}

/**
 * Error component for permission/network errors (not 404)
 */
function CafeError({ reason }: { reason: 'permission_error' | 'network_error' }) {
  const { siteName } = require('@/lib/seo/metadata')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {reason === 'permission_error' ? 'Access Restricted' : 'Unable to Load Café'}
        </h1>
        <p className="text-gray-600 mb-6">
          {reason === 'permission_error'
            ? 'This café listing is currently unavailable.'
            : 'We encountered an issue loading this café. Please try again later.'}
        </p>
        <a
          href="/cities"
          className="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Browse All Cafés
        </a>
      </div>
    </div>
  )
}

export default async function CafeDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const result = await getCafe(params.id)

  // Handle different error types
  if (!result.success) {
    if (result.reason === 'not_found' || result.reason === 'invalid_param') {
      notFound()
    }
    // Permission or network errors - show error UI, not 404
    return <CafeError reason={result.reason === 'permission_error' ? 'permission_error' : 'network_error'} />
  }

  const { cafe } = result

  // Ensure descriptionText is set
  if (!cafe.descriptionText) {
    cafe.descriptionText = combineDescription(cafe.description, cafe.ai_inference_notes)
  }

  // Fetch nearby cafes (single query, efficient)
  const nearbyCafes = await getNearbyCafes(cafe)

  return <CafeDetailSEO cafe={cafe} nearbyCafes={nearbyCafes} />
}

/**
 * Generate metadata safely - never crashes even if cafe is missing
 */
export async function generateMetadata({
  params,
}: {
  params: { id: string }
}): Promise<Metadata> {
  const result = await getCafe(params.id)

  // Import SEO helpers
  const { siteName, getAbsoluteUrl } = await import('@/lib/seo/metadata')

  // If cafe not found or error, return safe defaults
  if (!result.success || !result.cafe) {
    return {
      title: `Café not found | ${siteName}`,
      description: 'The café you are looking for could not be found.',
      openGraph: {
        title: `Café not found | ${siteName}`,
        description: 'The café you are looking for could not be found.',
        type: 'website',
        siteName,
      },
      alternates: {
        canonical: getAbsoluteUrl(`/cafe/${params.id}`),
      },
    }
  }

  const cafe = result.cafe

  // Build SEO metadata
  const {
    buildCafeTitle,
    buildCafeMetaDescription,
  } = await import('@/lib/seo/cafe-seo')

  const { getCafeOgImage } = await import('@/lib/seo/metadata')

  const title = buildCafeTitle(cafe)
  const fullTitle = `${title} | ${siteName}`
  const description = buildCafeMetaDescription(cafe)
  const canonicalUrl = getAbsoluteUrl(getCafeHref(cafe))

  // Get OG image (safe - may be null)
  let ogImage: string | undefined
  try {
    ogImage = await getCafeOgImage(cafe.id)
  } catch (error) {
    // Silently fail - OG image is optional
  }

  return {
    title: fullTitle,
    description,
    openGraph: {
      title: fullTitle,
      description,
      type: 'website',
      url: canonicalUrl,
      siteName,
      locale: 'en_US',
      images: ogImage
        ? [
            {
              url: ogImage,
              alt: `${cafe.name} - ${cafe.city ? `Laptop-friendly café in ${cafe.city}` : 'Cafe'}`,
            },
          ]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
    alternates: {
      canonical: canonicalUrl,
    },
  }
}
