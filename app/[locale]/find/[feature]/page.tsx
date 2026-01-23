import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import FeaturePageTemplate from '@/components/FeaturePageTemplate'
import { getLocaleFromParams, type Locale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/getDictionary'
import { t, tmpl } from '@/lib/i18n/t'

const FEATURE_META_KEYS: Record<string, { title: string; description: string }> = {
  wifi: { title: 'meta.find.wifiTitle', description: 'meta.find.wifiDescription' },
  outlets: { title: 'meta.find.outletsTitle', description: 'meta.find.outletsDescription' },
  quiet: { title: 'meta.find.quietTitle', description: 'meta.find.quietDescription' },
  'time-limit': { title: 'meta.find.timeLimitTitle', description: 'meta.find.timeLimitDescription' },
}

export async function generateMetadata({
  params,
}: {
  params: { feature: string; locale: Locale }
}): Promise<Metadata> {
  const locale = getLocaleFromParams(params)
  const dict = getDictionary(locale)
  const { siteName, getAbsoluteUrl } = await import('@/lib/seo/metadata')
  const config = FEATURE_META_KEYS[params.feature]

  if (!config) {
    const { getHreflangAlternates } = await import('@/lib/seo/metadata')
    return {
      title: tmpl(t(dict, 'meta.find.featureNotFoundTitle'), { siteName }),
      ...getHreflangAlternates(`/find/${params.feature}`, locale),
    }
  }

  const title = tmpl(t(dict, config.title), { siteName })
  const description = t(dict, config.description)
  const canonicalUrl = getAbsoluteUrl(`/${locale}/find/${params.feature}`)
  const { getHreflangAlternates } = await import('@/lib/seo/metadata')

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonicalUrl,
      siteName,
    },
    ...getHreflangAlternates(`/find/${params.feature}`, locale),
  }
}

export default function FeaturePage({
  params,
}: {
  params: { feature: string; locale: Locale }
}) {
  const validFeatures = ['wifi', 'outlets', 'quiet', 'time-limit']

  if (!validFeatures.includes(params.feature)) {
    notFound()
  }

  const locale = getLocaleFromParams(params)
  const dict = getDictionary(locale)
  return <FeaturePageTemplate feature={params.feature} dict={dict} locale={locale} />
}
