import { Metadata } from 'next'
import { getLocaleFromParams, type Locale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/getDictionary'
import { t, tmpl } from '@/lib/i18n/t'
import CityPageTemplate from '@/components/CityPageTemplate'
import { getCafesByCityAndDistrict } from '@/lib/cities/data'
import { buildBerlinCityConfig } from '@/lib/cities/berlin-config'
import { buildCityConfig, getCityDbName } from '@/lib/cities/city-config'
import { getAbsoluteUrl, getHreflangAlternates } from '@/lib/seo/metadata'
import { MIN_RESULTS_THIN, EXTRA_CAFES_LIMIT } from '@/lib/location-constants'

export async function generateMetadata({
  params,
}: {
  params: { city: string; locale: Locale }
}): Promise<Metadata> {
  const locale = getLocaleFromParams(params)
  const dict = getDictionary(locale)
  const citySlug = params.city.toLowerCase()
  const isBerlin = citySlug === 'berlin'

  if (isBerlin) {
    const config = buildBerlinCityConfig(locale, dict, undefined, undefined, 'work')
    const { siteName } = await import('@/lib/seo/metadata')
    const canonicalUrl = getAbsoluteUrl(`/${locale}/cities/${params.city}/work`)
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
      ...getHreflangAlternates(`/cities/${params.city}/work`, locale),
    }
  }

  const cityDbName = getCityDbName(citySlug)
  const cafes = await getCafesByCityAndDistrict(cityDbName, undefined, 'work')
  const safeCafes = Array.isArray(cafes) ? cafes : []
  const config = buildCityConfig(locale, dict, citySlug, safeCafes.length, 'work')
  const { siteName } = await import('@/lib/seo/metadata')
  const canonicalUrl = getAbsoluteUrl(`/${locale}/cities/${params.city}/work`)
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
    ...getHreflangAlternates(`/cities/${params.city}/work`, locale),
  }
}

export default async function CityWorkPage({
  params,
}: {
  params: { city: string; locale: Locale }
}) {
  const locale = getLocaleFromParams(params)
  const dict = getDictionary(locale)
  const citySlug = params.city.toLowerCase()
  const isBerlin = citySlug === 'berlin'

  if (isBerlin) {
    const config = buildBerlinCityConfig(locale, dict, undefined, undefined, 'work')
    const cafes = await getCafesByCityAndDistrict('Berlin', undefined, 'work')
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
    return <CityPageTemplate cafes={safeCafes} config={config} extraCafes={extraCafes.length > 0 ? extraCafes : undefined} extraCafesSectionTitle={extraCafesSectionTitle} />
  }

  const cityDbName = getCityDbName(citySlug)
  const cafes = await getCafesByCityAndDistrict(cityDbName, undefined, 'work')
  const safeCafes = Array.isArray(cafes) ? cafes : []
  const config = buildCityConfig(locale, dict, citySlug, safeCafes.length, 'work')
  let extraCafes: typeof safeCafes = []
  let extraCafesSectionTitle: string | undefined
  if (safeCafes.length < MIN_RESULTS_THIN) {
    const allCity = await getCafesByCityAndDistrict(cityDbName, undefined)
    const mainIds = new Set(safeCafes.map((c) => c.id))
    extraCafes = (Array.isArray(allCity) ? allCity : [])
      .filter((c) => !mainIds.has(c.id))
      .slice(0, EXTRA_CAFES_LIMIT)
    extraCafesSectionTitle = tmpl(t(dict, 'city.moreCafesInCity'), { city: config.cityDisplayName })
  }
  return <CityPageTemplate cafes={safeCafes} config={config} extraCafes={extraCafes.length > 0 ? extraCafes : undefined} extraCafesSectionTitle={extraCafesSectionTitle} />
}
