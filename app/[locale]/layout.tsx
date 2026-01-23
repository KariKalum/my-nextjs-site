import { isValidLocale, type Locale } from '@/lib/i18n/config'
import { notFound } from 'next/navigation'
import LocaleLangSetter from '@/components/LocaleLangSetter'

export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'de' }]
}

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  // Validate locale
  if (!isValidLocale(params.locale)) {
    notFound()
  }

  return (
    <>
      <LocaleLangSetter locale={params.locale} />
      {children}
    </>
  )
}
