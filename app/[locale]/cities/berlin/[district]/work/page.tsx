/**
 * Berlin district work intent pages
 * /[locale]/cities/berlin/[district]/work
 */

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getLocaleFromParams, type Locale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/getDictionary'
import { t, tmpl } from '@/lib/i18n/t'
import CityPageTemplate from '@/components/CityPageTemplate'
import { getCafesByCityAndDistrict, getDistrictDisplayName } from '@/lib/cities/data'
import { buildBerlinCityConfig } from '@/lib/cities/berlin-config'
import { getAbsoluteUrl, getHreflangAlternates } from '@/lib/seo/metadata'
import { MIN_RESULTS_THIN, EXTRA_CAFES_LIMIT } from '@/lib/location-constants'

const VALID_DISTRICTS = [
  'mitte',
  'charlottenburg',
  'prenzlauer-berg',
  'neukoelln',
  'kreuzberg',
  'friedrichshain',
  'hbf',
] as const

type DistrictSlug = (typeof VALID_DISTRICTS)[number]

function isValidDistrict(slug: string): slug is DistrictSlug {
  return (VALID_DISTRICTS as readonly string[]).includes(slug)
}

export async function generateMetadata({
  params,
}: {
  params: { district: string; locale: Locale }
}): Promise<Metadata> {
  const locale = getLocaleFromParams(params)
  const dict = getDictionary(locale)

  if (!isValidDistrict(params.district)) {
    notFound()
  }

  const districtDisplayName = getDistrictDisplayName(params.district)
  const config = buildBerlinCityConfig(locale, dict, params.district, districtDisplayName, 'work')
  const { siteName } = await import('@/lib/seo/metadata')
  const canonicalUrl = getAbsoluteUrl(`/${locale}/cities/berlin/${params.district}/work`)
  const ogImage = getAbsoluteUrl('/og-default.jpg')
  const ogAlt = tmpl(t(dict, 'meta.city.ogAlt'), { city: `Berlin ${districtDisplayName}` })

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
    ...getHreflangAlternates(`/cities/berlin/${params.district}/work`, locale),
  }
}

export default async function BerlinDistrictWorkPage({
  params,
}: {
  params: { district: string; locale: Locale }
}) {
  const locale = getLocaleFromParams(params)
  const dict = getDictionary(locale)

  if (!isValidDistrict(params.district)) {
    notFound()
  }

  const districtDisplayName = getDistrictDisplayName(params.district)
  const config = buildBerlinCityConfig(locale, dict, params.district, districtDisplayName, 'work')

  let cafes = await getCafesByCityAndDistrict('Berlin', districtDisplayName, 'work')
  // TODO: If dataset has no district in address, district filter may return empty; fallback to all Berlin work cafes.
  if (!Array.isArray(cafes) || cafes.length === 0) {
    cafes = await getCafesByCityAndDistrict('Berlin', undefined, 'work')
  }
  const safeCafes = Array.isArray(cafes) ? cafes : []

  let extraCafes: typeof safeCafes = []
  let extraCafesSectionTitle: string | undefined
  if (safeCafes.length < MIN_RESULTS_THIN) {
    const allBerlin = await getCafesByCityAndDistrict('Berlin', undefined)
    const mainIds = new Set(safeCafes.map((c) => c.id))
    extraCafes = (Array.isArray(allBerlin) ? allBerlin : [])
      .filter((c) => !mainIds.has(c.id))
      .slice(0, EXTRA_CAFES_LIMIT)
    extraCafesSectionTitle = tmpl(t(dict, 'city.moreCafesInCity'), { city: `Berlin ${districtDisplayName}` })
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
