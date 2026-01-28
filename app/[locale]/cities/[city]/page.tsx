import { Metadata } from 'next'
import { getLocaleFromParams, type Locale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/getDictionary'
import { t, tmpl } from '@/lib/i18n/t'
import CityPageTemplate from '@/components/CityPageTemplate'
import { getCafesByCityAndDistrict } from '@/lib/cities/data'
import { buildBerlinCityConfig } from '@/lib/cities/berlin-config'
import { buildCityConfig, getCityDisplayName, getCityDbName } from '@/lib/cities/city-config'
import { getAbsoluteUrl, getHreflangAlternates } from '@/lib/seo/metadata'

export async function generateMetadata({
  params,
}: {
  params: { city: string; locale: Locale }
}): Promise<Metadata> {
  const locale = getLocaleFromParams(params)
  const dict = getDictionary(locale)
  const citySlug = params.city.toLowerCase()
  const isBerlin = citySlug === 'berlin'

  // For Berlin, use the Berlin config builder
  if (isBerlin) {
    const config = buildBerlinCityConfig(locale, dict)
    const { siteName } = await import('@/lib/seo/metadata')
    const canonicalUrl = getAbsoluteUrl(`/${locale}/cities/${params.city}`)
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
      ...getHreflangAlternates(`/cities/${params.city}`, locale),
    }
  }

  // For other cities, use generic city config
  const cityDbName = getCityDbName(citySlug) // Use DB name for filtering
  const cafes = await getCafesByCityAndDistrict(cityDbName, undefined)
  
  // Runtime guard: ensure cafes is always an array
  const safeCafes = Array.isArray(cafes) ? cafes : []
  const config = buildCityConfig(locale, dict, citySlug, safeCafes.length)
  const { siteName } = await import('@/lib/seo/metadata')
  const canonicalUrl = getAbsoluteUrl(`/${locale}/cities/${params.city}`)
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
    ...getHreflangAlternates(`/cities/${params.city}`, locale),
  }
}

export default async function CityPage({
  params,
}: {
  params: { city: string; locale: Locale }
}) {
  const locale = getLocaleFromParams(params)
  const dict = getDictionary(locale)
  const citySlug = params.city.toLowerCase()
  const isBerlin = citySlug === 'berlin'

  // For Berlin, use the Berlin config builder
  if (isBerlin) {
    const config = buildBerlinCityConfig(locale, dict)
    const cafes = await getCafesByCityAndDistrict('Berlin', undefined)
    
    // Runtime guard: ensure cafes is always an array
    const safeCafes = Array.isArray(cafes) ? cafes : []
    
    // Update trust paragraph with actual count (only if cafes exist)
    if (config.trustParagraph && safeCafes.length > 0) {
      const actualCount = safeCafes.length >= 40 ? '40+' : String(safeCafes.length)
      config.trustParagraph = tmpl(t(dict, 'meta.city.trustParagraph.berlin'), { count: actualCount })
    } else if (safeCafes.length === 0) {
      config.trustParagraph = undefined
    }

    return <CityPageTemplate cafes={safeCafes} config={config} />
  }

  // For all other cities, use the generic city config builder
  const cityDisplayName = getCityDisplayName(citySlug, locale)
  const cityDbName = getCityDbName(citySlug) // Use DB name for filtering
  const cafes = await getCafesByCityAndDistrict(cityDbName, undefined)
  
  // Runtime guard: ensure cafes is always an array
  const safeCafes = Array.isArray(cafes) ? cafes : []
  const config = buildCityConfig(locale, dict, citySlug, safeCafes.length)

  return <CityPageTemplate cafes={safeCafes} config={config} />
}
