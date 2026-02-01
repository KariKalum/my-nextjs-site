/**
 * Berlin city laptop-friendly page: /[locale]/cities/berlin/laptop-friendly
 * Explicit route so it is not captured by [district] (which would 404 for district="laptop-friendly").
 */

export const dynamic = 'force-dynamic'

import { getLocaleFromParams, type Locale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/getDictionary'
import { t, tmpl } from '@/lib/i18n/t'
import CityPageTemplate from '@/components/CityPageTemplate'
import { getCafesByCityAndDistrict } from '@/lib/cities/data'
import { buildBerlinCityConfig } from '@/lib/cities/berlin-config'
import { getAbsoluteUrl, getHreflangAlternates } from '@/lib/seo/metadata'
import { MIN_RESULTS_THIN, EXTRA_CAFES_LIMIT } from '@/lib/location-constants'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: { locale: Locale }
}): Promise<Metadata> {
  const locale = getLocaleFromParams(params)
  const dict = getDictionary(locale)
  const config = buildBerlinCityConfig(locale, dict, undefined, undefined, 'laptop-friendly')
  const { siteName } = await import('@/lib/seo/metadata')
  const canonicalUrl = getAbsoluteUrl(`/${locale}/cities/berlin/laptop-friendly`)
  const ogImage = getAbsoluteUrl('/og-default.jpg')
  const ogAlt = tmpl(t(dict, 'meta.city.ogAlt'), { city: config.cityDisplayName })
  return {
    title: config.seoTitle,
    description: config.seoDescription,
    openGraph: {
      title: config.seoTitle,
      description: config.seoDescription,
      type: 'website',
      url: canonicalUrl,
      siteName,
      images: [{ url: ogImage, alt: ogAlt }],
    },
    twitter: {
      card: 'summary_large_image',
      title: config.seoTitle,
      description: config.seoDescription,
      images: [ogImage],
    },
    ...getHreflangAlternates('/cities/berlin/laptop-friendly', locale),
  }
}

export default async function BerlinLaptopFriendlyPage({
  params,
}: {
  params: { locale: Locale }
}) {
  const locale = getLocaleFromParams(params)
  const dict = getDictionary(locale)
  const config = buildBerlinCityConfig(locale, dict, undefined, undefined, 'laptop-friendly')
  const cafes = await getCafesByCityAndDistrict('Berlin', undefined, 'laptop-friendly')
  const safeCafes = Array.isArray(cafes) ? cafes : []
  let extraCafes: typeof safeCafes = []
  let extraCafesSectionTitle: string | undefined
  if (safeCafes.length < MIN_RESULTS_THIN) {
    const allBerlin = await getCafesByCityAndDistrict('Berlin', undefined)
    const mainIds = new Set(safeCafes.map((c) => c.id))
    extraCafes = (Array.isArray(allBerlin) ? allBerlin : [])
      .filter((c) => !mainIds.has(c.id))
      .slice(0, EXTRA_CAFES_LIMIT)
    extraCafesSectionTitle = tmpl(t(dict, 'city.moreCafesInCity'), { city: config.cityDisplayName })
  }
  return (
    <CityPageTemplate
      cafes={safeCafes}
      config={config}
      extraCafes={extraCafes.length > 0 ? extraCafes : undefined}
      extraCafesSectionTitle={extraCafesSectionTitle}
    />
  )
}
