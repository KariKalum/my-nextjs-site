import type { Cafe } from '@/src/lib/supabase/types'
import CafeSectionClient from './CafeSectionClient'
import { getTopRatedCafes, getRecentlyAddedCafes } from '@/src/lib/cafes/homepage'
import { prefixWithLocale } from '@/lib/i18n/routing'
import { type Locale } from '@/lib/i18n/config'
import { t } from '@/lib/i18n/t'
import type { Dictionary } from '@/lib/i18n/getDictionary'

export default async function HomepageData({
  params,
  dict,
}: {
  params: { locale: Locale }
  dict: Dictionary
}) {
  const locale = params.locale
  const [topRated, recentlyAdded] = await Promise.all([
    getTopRatedCafes(10),
    getRecentlyAddedCafes(10),
  ])

  return (
    <>
      <CafeSectionClient
        title={t(dict, 'home.sections.topRatedTitle')}
        description={t(dict, 'home.sections.topRatedDesc')}
        cafes={topRated}
        emptyMessage={t(dict, 'home.sections.topRatedEmpty')}
        viewAllLink={prefixWithLocale('/cities', locale)}
        locale={locale}
        dict={dict}
      />
      <CafeSectionClient
        title={t(dict, 'home.sections.recentlyAddedTitle')}
        description={t(dict, 'home.sections.recentlyAddedDesc')}
        cafes={recentlyAdded}
        emptyMessage={t(dict, 'home.sections.recentlyAddedEmpty')}
        viewAllLink={prefixWithLocale('/cities', locale)}
        locale={locale}
        dict={dict}
      />
    </>
  )
}
