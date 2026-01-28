/**
 * Berlin district pages
 * Handles all Berlin districts: mitte, charlottenburg, prenzlauer-berg, neukoelln, kreuzberg, friedrichshain, hbf
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

// Valid district slugs
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
  return VALID_DISTRICTS.includes(slug as DistrictSlug)
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
  const config = buildBerlinCityConfig(locale, dict, params.district, districtDisplayName)
  const { siteName } = await import('@/lib/seo/metadata')
  const canonicalUrl = getAbsoluteUrl(`/${locale}/cities/berlin/${params.district}`)
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
    ...getHreflangAlternates(`/cities/berlin/${params.district}`, locale),
  }
}

export default async function BerlinDistrictPage({
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
  const config = buildBerlinCityConfig(locale, dict, params.district, districtDisplayName)

  // Fetch cafes filtered by district
  // Use district display name for filtering (handles variations like "Prenzlauer Berg" vs "prenzlauer-berg")
  // For HBF, use "Hauptbahnhof" for filtering as that's what appears in addresses
  const filterName = districtDisplayName === 'HBF' ? 'Hauptbahnhof' : districtDisplayName
  const cafes = await getCafesByCityAndDistrict('Berlin', filterName)
  
  // Runtime guard: ensure cafes is always an array
  const safeCafes = Array.isArray(cafes) ? cafes : []

  return <CityPageTemplate cafes={safeCafes} config={config} />
}
