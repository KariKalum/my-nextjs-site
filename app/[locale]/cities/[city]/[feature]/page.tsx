import { Metadata } from 'next'
import { getLocaleFromParams, type Locale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/getDictionary'
import { t, tmpl } from '@/lib/i18n/t'
import CityPageTemplate from '@/components/CityPageTemplate'
import { getCafesByCityAndDistrict } from '@/lib/cities/data'
import { getCityPageConfig, getCityNameForFetch, CITY_DISTRICT_MAP } from '@/lib/cities/city-config'
import { getAbsoluteUrl, getHreflangAlternates } from '@/lib/seo/metadata'
import { filterCafesByIntent, type Intent } from '@/lib/cities/intent'
import { redirect } from 'next/navigation'

/** Map localized slugs to Intent values */
const FEATURE_MAP: Record<string, Intent> = {
    'wifi': 'wifi',
    'wlan': 'wifi',
    'outlets': 'outlets',
    'steckdosen': 'outlets',
    'quiet': 'quiet',
    'ruhig': 'quiet',
    'time-limit': 'time-limit',
    'ohne-zeitlimit': 'time-limit',
    'work': 'work',
    'arbeiten': 'work',
    'laptop-friendly': 'laptop-friendly',
    'laptopfreundlich': 'laptop-friendly',
}

function getIntentFromFeature(feature: string): Intent {
    return FEATURE_MAP[feature.toLowerCase()]
}

function getDistrictFromSlug(city: string, slug: string): string | undefined {
    return CITY_DISTRICT_MAP[city.toLowerCase()]?.[slug.toLowerCase()]
}

export async function generateMetadata({
    params,
}: {
    params: { city: string; feature: string; locale: Locale }
}): Promise<Metadata> {
    const locale = getLocaleFromParams(params)
    const dict = getDictionary(locale)
    const citySlug = params.city.toLowerCase()
    const intent = getIntentFromFeature(params.feature)
    const districtName = getDistrictFromSlug(params.city, params.feature)

    if (!intent && !districtName) {
        return { title: 'Not Found' }
    }

    const config = getCityPageConfig(locale, dict, citySlug, 0, intent, districtName ? params.feature : undefined, districtName)
    const { siteName } = await import('@/lib/seo/metadata')
    const canonicalUrl = getAbsoluteUrl(`/${locale}/cities/${params.city}/${params.feature}`)
    const ogImage = getAbsoluteUrl('/og-default.jpg')
    const ogAlt = tmpl(t(dict, 'meta.city.ogAlt'), { city: districtName || config.cityDisplayName })

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
        ...getHreflangAlternates(`/cities/${params.city}/${params.feature}`, locale),
    }
}

export default async function FeatureOrDistrictCityPage({
    params,
}: {
    params: { city: string; feature: string; locale: Locale }
}) {
    const locale = getLocaleFromParams(params)
    const dict = getDictionary(locale)
    const citySlug = params.city.toLowerCase()
    const intent = getIntentFromFeature(params.feature)
    const districtName = getDistrictFromSlug(params.city, params.feature)

    if (!intent && !districtName) {
        redirect(`/${locale}/cities/${citySlug}`)
    }

    const cityNameForFetch = getCityNameForFetch(citySlug)
    const cafes = await getCafesByCityAndDistrict(cityNameForFetch, districtName, intent)
    const safeCafes = Array.isArray(cafes) ? cafes : []
    const config = getCityPageConfig(locale, dict, citySlug, safeCafes.length, intent, districtName ? params.feature : undefined, districtName)

    return (
        <CityPageTemplate
            cafes={safeCafes}
            config={config}
            extraCafes={safeCafes.length < 5 ? (await getCafesByCityAndDistrict(cityNameForFetch, undefined)).slice(0, 10) : undefined}
            extraCafesSectionTitle={safeCafes.length < 5 ? tmpl(t(dict, 'city.moreCafesIn'), { city: getCityPageConfig(locale, dict, citySlug, 0).cityDisplayName }) : undefined}
        />
    )
}
