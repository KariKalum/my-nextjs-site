import { Metadata } from 'next'
import { getLocaleFromParams, type Locale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/getDictionary'
import { t, tmpl } from '@/lib/i18n/t'
import SubmitPageForm from '@/components/SubmitPageForm'

export async function generateMetadata({
  params,
}: {
  params: { locale: Locale }
}): Promise<Metadata> {
  const locale = getLocaleFromParams(params)
  const dict = getDictionary(locale)
  const { siteName, getAbsoluteUrl, getHreflangAlternates } = await import('@/lib/seo/metadata')
  return {
    title: tmpl(t(dict, 'meta.submit.title'), { siteName }),
    description: t(dict, 'meta.submit.description'),
    openGraph: {
      title: t(dict, 'meta.submit.ogTitle'),
      description: t(dict, 'meta.submit.ogDescription'),
      type: 'website',
      url: getAbsoluteUrl(`/${locale}/submit`),
      siteName,
    },
    ...getHreflangAlternates('/submit', locale),
  }
}

export default async function SubmitPage({
  params,
}: {
  params: { locale: Locale }
}) {
  const locale = getLocaleFromParams(params)
  const dict = getDictionary(locale)
  return <SubmitPageForm dict={dict} locale={locale} />
}
