import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/src/lib/supabase/server'
import type { Cafe } from '@/src/lib/supabase/types'
import CafeDetailSEO from '@/components/CafeDetailSEO'
import { combineDescription } from '@/lib/utils/description-combiner'
import { getCafeHref, getDetailRouteQueryConfig } from '@/lib/cafeRouting'
import { devLog } from '@/lib/utils/devLog'
import { getLocaleFromParams, type Locale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/getDictionary'
import { t, tmpl } from '@/lib/i18n/t'
import { formatWorkScore } from '@/lib/utils/cafe-formatters'
import type { Dictionary } from '@/lib/i18n/getDictionary'

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
function CafeError({
  reason,
  locale,
  dict,
}: {
  reason: 'permission_error' | 'network_error'
  locale: Locale
  dict: Dictionary
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {reason === 'permission_error'
            ? t(dict, 'meta.cafe.errorAccessRestricted')
            : t(dict, 'meta.cafe.errorUnableToLoad')}
        </h1>
        <p className="text-gray-600 mb-6">
          {reason === 'permission_error'
            ? t(dict, 'meta.cafe.errorUnavailable')
            : t(dict, 'meta.cafe.errorTryAgain')}
        </p>
        <Link
          href={`/${locale}/cities`}
          className="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          {t(dict, 'meta.cafe.browseAllCafes')}
        </Link>
      </div>
    </div>
  )
}

export default async function CafeDetailPage({
  params,
}: {
  params: { id: string; locale: Locale }
}) {
  const locale = getLocaleFromParams(params)
  const dict = getDictionary(locale)
  const result = await getCafe(params.id)

  if (!result.success) {
    if (result.reason === 'not_found' || result.reason === 'invalid_param') {
      notFound()
    }
    return (
      <CafeError
        reason={result.reason === 'permission_error' ? 'permission_error' : 'network_error'}
        locale={locale}
        dict={dict}
      />
    )
  }

  const { cafe } = result

  if (!cafe.descriptionText) {
    cafe.descriptionText = combineDescription(cafe.description, cafe.ai_inference_notes)
  }

  const nearbyCafes = await getNearbyCafes(cafe)

  return <CafeDetailSEO cafe={cafe} nearbyCafes={nearbyCafes} dict={dict} locale={locale} />
}

/**
 * Build localized meta description for cafe (same structure as buildCafeMetaDescription, strings from dict)
 */
function buildLocalizedCafeDescription(cafe: Cafe, dict: Dictionary): string {
  const parts: string[] = []
  if (cafe.work_score != null) {
    const formatted = formatWorkScore(cafe.work_score)
    if (formatted) {
      parts.push(tmpl(t(dict, 'meta.cafe.descWorkScore'), { value: formatted }))
    }
  } else if (cafe.google_rating != null) {
    parts.push(tmpl(t(dict, 'meta.cafe.descRating'), { value: cafe.google_rating.toFixed(1) }))
  }
  if (cafe.ai_wifi_quality) {
    parts.push(tmpl(t(dict, 'meta.cafe.descWifi'), { value: cafe.ai_wifi_quality }))
  }
  if (cafe.ai_power_outlets) {
    parts.push(tmpl(t(dict, 'meta.cafe.descOutlets'), { value: cafe.ai_power_outlets }))
  }
  if (cafe.ai_noise_level) {
    parts.push(tmpl(t(dict, 'meta.cafe.descAtmosphere'), { value: cafe.ai_noise_level }))
  }
  const cityState = [cafe.city, cafe.state].filter(Boolean).join(', ')
  if (cityState) {
    parts.push(tmpl(t(dict, 'meta.cafe.descLocated'), { value: cityState }))
  }
  let description = parts.join('. ')
  if (description.length < 140 && cafe.description && description.length < 120) {
    const shortDesc = cafe.description.slice(0, 40)
    description = `${shortDesc}. ${description}`
  }
  if (description.length > 160) {
    description = description.slice(0, 157) + '...'
  }
  return (
    description ||
    tmpl(t(dict, 'meta.cafe.descDiscover'), {
      name: cafe.name || '',
      city: cafe.city || 'Germany',
    })
  )
}

/**
 * Generate metadata safely - never crashes even if cafe is missing
 */
export async function generateMetadata({
  params,
}: {
  params: { id: string; locale: Locale }
}): Promise<Metadata> {
  const locale = getLocaleFromParams(params)
  const dict = getDictionary(locale)
  const result = await getCafe(params.id)
  const { siteName, getAbsoluteUrl, getCafeOgImage } = await import('@/lib/seo/metadata')

  if (!result.success || !result.cafe) {
    const notFoundTitle = tmpl(t(dict, 'meta.cafe.notFoundTitle'), { siteName })
    const notFoundDesc = t(dict, 'meta.cafe.notFoundDescription')
    const { getHreflangAlternates } = await import('@/lib/seo/metadata')
    return {
      title: notFoundTitle,
      description: notFoundDesc,
      openGraph: {
        title: notFoundTitle,
        description: notFoundDesc,
        type: 'website',
        siteName,
      },
      ...getHreflangAlternates(`/cafe/${params.id}`, locale),
    }
  }

  const cafe = result.cafe
  const city = cafe.city || 'Germany'
  const label = t(
    dict,
    cafe.is_work_friendly === true ? 'meta.cafe.titleWorkFriendly' : 'meta.cafe.titleCoworking'
  )
  const title = `${cafe.name} — ${label} in ${city}`
  const fullTitle = `${title} | ${siteName}`
  const description = buildLocalizedCafeDescription(cafe, dict)
  const canonicalUrl = getAbsoluteUrl(getCafeHref(cafe, locale))

  let ogImage: string | undefined
  try {
    ogImage = await getCafeOgImage(cafe.id)
  } catch {
    /* OG image optional */
  }

  const ogAlt = cafe.city
    ? tmpl(t(dict, 'meta.cafe.ogAltCafe'), { city: cafe.city })
    : t(dict, 'meta.cafe.ogAltCafeFallback')

  // Get cafe identifier for path (place_id or id)
  const cafeId = cafe.place_id || cafe.id || params.id
  const pathWithoutLocale = `/cafe/${cafeId}`
  const { getHreflangAlternates } = await import('@/lib/seo/metadata')

  return {
    title: fullTitle,
    description,
    openGraph: {
      title: fullTitle,
      description,
      type: 'website',
      url: canonicalUrl,
      siteName,
      locale: locale === 'de' ? 'de_DE' : 'en_US',
      images: ogImage ? [{ url: ogImage, alt: `${cafe.name} - ${ogAlt}` }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
    ...getHreflangAlternates(pathWithoutLocale, locale),
  }
}
