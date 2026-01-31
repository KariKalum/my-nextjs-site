/**
 * Generic city page configuration builder
 * Used to generate city pages for all German cities
 */

import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/getDictionary'
import type { CityPageConfig, CityPageFAQ } from './types'
import type { Intent } from './intent'
import { t, tmpl } from '@/lib/i18n/t'

// TODO: Add meta.city.intent.* keys to en.json and de.json for work / laptop-friendly variants.
// Until then, English fallbacks are used when the key is missing.
function intentFallback(dict: Dictionary, key: string, fallback: string): string {
  const v = t(dict, key)
  return v === key ? fallback : v
}

/**
 * City slug to display name mapping
 * dbName is the name as it appears in the database
 */
const CITY_DISPLAY_NAMES: Record<string, { de: string; en: string; dbName: string }> = {
  muenchen: { de: 'München', en: 'Munich', dbName: 'Munich' },
  hamburg: { de: 'Hamburg', en: 'Hamburg', dbName: 'Hamburg' },
  koeln: { de: 'Köln', en: 'Cologne', dbName: 'Cologne' },
  frankfurt: { de: 'Frankfurt', en: 'Frankfurt', dbName: 'Frankfurt' },
  leipzig: { de: 'Leipzig', en: 'Leipzig', dbName: 'Leipzig' },
  duesseldorf: { de: 'Düsseldorf', en: 'Düsseldorf', dbName: 'Düsseldorf' },
  potsdam: { de: 'Potsdam', en: 'Potsdam', dbName: 'Potsdam' },
  oldenburg: { de: 'Oldenburg', en: 'Oldenburg', dbName: 'Oldenburg' },
  osnabrueck: { de: 'Osnabrück', en: 'Osnabrück', dbName: 'Osnabrück' },
  stuttgart: { de: 'Stuttgart', en: 'Stuttgart', dbName: 'Stuttgart' },
  dresden: { de: 'Dresden', en: 'Dresden', dbName: 'Dresden' },
  hannover: { de: 'Hannover', en: 'Hannover', dbName: 'Hannover' },
  nuernberg: { de: 'Nürnberg', en: 'Nuremberg', dbName: 'Nuremberg' },
  bremen: { de: 'Bremen', en: 'Bremen', dbName: 'Bremen' },
  dortmund: { de: 'Dortmund', en: 'Dortmund', dbName: 'Dortmund' },
  essen: { de: 'Essen', en: 'Essen', dbName: 'Essen' },
  mannheim: { de: 'Mannheim', en: 'Mannheim', dbName: 'Mannheim' },
  bonn: { de: 'Bonn', en: 'Bonn', dbName: 'Bonn' },
  karlsruhe: { de: 'Karlsruhe', en: 'Karlsruhe', dbName: 'Karlsruhe' },
  freiburg: { de: 'Freiburg', en: 'Freiburg', dbName: 'Freiburg' },
  muenster: { de: 'Münster', en: 'Münster', dbName: 'Münster' },
  heidelberg: { de: 'Heidelberg', en: 'Heidelberg', dbName: 'Heidelberg' },
}

/**
 * Get city display name for locale
 */
export function getCityDisplayName(citySlug: string, locale: Locale): string {
  const city = CITY_DISPLAY_NAMES[citySlug.toLowerCase()]
  if (city) {
    return locale === 'de' ? city.de : city.en
  }
  
  // Fallback: convert slug to display name
  return citySlug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Get database city name (for filtering)
 */
export function getCityDbName(citySlug: string): string {
  const city = CITY_DISPLAY_NAMES[citySlug.toLowerCase()]
  if (city) {
    return city.dbName
  }
  
  // Fallback: use display name
  return citySlug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Build city page configuration.
 * Optional intent ('work' | 'laptop-friendly') adjusts H1/SEO copy and related links (e.g. /find/work-hubs).
 */
export function buildCityConfig(
  locale: Locale,
  dict: Dictionary,
  citySlug: string,
  cafeCount: number,
  intent?: Intent
): CityPageConfig {
  const cityDisplayName = getCityDisplayName(citySlug, locale)
  const siteName = t(dict, 'meta.siteName')

  let h1Title: string
  let seoTitle: string
  let seoDescription: string

  if (intent === 'work') {
    h1Title = intentFallback(
      dict,
      'meta.city.intent.work.h1Title',
      locale === 'de'
        ? `Cafés zum Arbeiten in ${cityDisplayName} (WLAN & Steckdosen)`
        : `Best Cafés to Work From in ${cityDisplayName} (WiFi & Power Outlets)`
    )
    if (h1Title.includes('{city}')) h1Title = tmpl(h1Title, { city: cityDisplayName })
    seoTitle = intentFallback(
      dict,
      'meta.city.intent.work.seoTitle',
      `Cafés to Work From in ${cityDisplayName} – WiFi, Power Outlets & Laptop-Friendly | ${siteName}`
    )
    if (seoTitle.includes('{city}')) seoTitle = tmpl(seoTitle, { city: cityDisplayName, siteName })
    seoDescription = intentFallback(
      dict,
      'meta.city.intent.work.seoDescription',
      `Find the best cafés to work from in ${cityDisplayName} with reliable WiFi, power outlets, and laptop-friendly spaces. Perfect for remote work, studying, and meetings.`
    )
    if (seoDescription.includes('{city}')) seoDescription = tmpl(seoDescription, { city: cityDisplayName })
  } else if (intent === 'laptop-friendly') {
    h1Title = intentFallback(
      dict,
      'meta.city.intent.laptopFriendly.h1Title',
      locale === 'de'
        ? `Laptopfreundliche Cafés in ${cityDisplayName}`
        : `Laptop-Friendly Cafés in ${cityDisplayName}`
    )
    if (h1Title.includes('{city}')) h1Title = tmpl(h1Title, { city: cityDisplayName })
    seoTitle = intentFallback(
      dict,
      'meta.city.intent.laptopFriendly.seoTitle',
      `Laptop-Friendly Cafés in ${cityDisplayName} – WiFi & Power Outlets | ${siteName}`
    )
    if (seoTitle.includes('{city}')) seoTitle = tmpl(seoTitle, { city: cityDisplayName, siteName })
    seoDescription = intentFallback(
      dict,
      'meta.city.intent.laptopFriendly.seoDescription',
      `Find laptop-friendly cafés in ${cityDisplayName} with WiFi, power outlets, and work-friendly policies. Ideal for remote work and studying.`
    )
    if (seoDescription.includes('{city}')) seoDescription = tmpl(seoDescription, { city: cityDisplayName })
  } else {
    h1Title =
      locale === 'de'
        ? `Cafés zum Arbeiten in ${cityDisplayName} (mit WLAN & Steckdosen)`
        : `Best Cafés to Work From in ${cityDisplayName} (WiFi & Power Outlets)`
    seoTitle =
      locale === 'de'
        ? `Cafés zum Arbeiten in ${cityDisplayName} – WLAN, Steckdosen & Laptopfreundlich | ${siteName}`
        : `Cafés to Work From in ${cityDisplayName} – WiFi, Power Outlets & Laptop-Friendly | ${siteName}`
    seoDescription =
      locale === 'de'
        ? `Die besten Cafés zum Arbeiten in ${cityDisplayName} finden – mit zuverlässigem WLAN, Steckdosen und laptopfreundlichen Räumen. Perfekt für Remote-Arbeit, Lernen und Meetings.`
        : `Find the best cafés to work from in ${cityDisplayName} with reliable WiFi, power outlets, and laptop-friendly spaces. Perfect for remote work, studying, and meetings.`
  }
  
  // Intro text - try to get city-specific intro, fallback to generic
  // Map slugs to intro keys (handle special cases)
  const introKeyMap: Record<string, string> = {
    muenchen: 'meta.city.introMunich',
    hamburg: 'meta.city.introHamburg',
    koeln: 'meta.city.introCologne',
    frankfurt: 'meta.city.introFrankfurt',
    leipzig: 'meta.city.introLeipzig',
  }
  
  const introKey = introKeyMap[citySlug.toLowerCase()]
  let introText: string | undefined
  
  if (introKey) {
    const intro = t(dict, introKey)
    introText = intro !== introKey ? intro : undefined
  }
  
  if (!introText) {
    introText = tmpl(t(dict, 'meta.city.introGeneric'), { city: cityDisplayName })
  }
  
  // Trust paragraph (only show if cafes exist)
  // Runtime guard: ensure cafeCount is a valid number
  const safeCafeCount = typeof cafeCount === 'number' && cafeCount >= 0 ? cafeCount : 0
  const trustParagraph =
    safeCafeCount > 0
      ? (() => {
          const countText = safeCafeCount >= 10 ? `${safeCafeCount}+` : String(safeCafeCount)
          return locale === 'de'
            ? `Unser ${cityDisplayName}-Café-Verzeichnis bietet ${countText} geprüfte Cafés zum Arbeiten, die jeweils sorgfältig auf WLAN-Qualität, Steckdosen-Verfügbarkeit und arbeitsfreundliche Atmosphäre überprüft wurden. Perfekt für Remote-Arbeiter, Studierende und alle, die produktiv arbeiten möchten.`
            : `Our ${cityDisplayName} café directory features ${countText} verified laptop-friendly cafés, each carefully reviewed for WiFi quality, power outlet availability, and work-friendly atmosphere. Perfect for remote workers, students, and anyone looking to be productive.`
        })()
      : undefined
  
  // FAQ items (adapted to city name)
  const faqItems: CityPageFAQ[] = [
    {
      question: tmpl(t(dict, 'meta.city.faq.q1'), { city: cityDisplayName }),
      answer: tmpl(t(dict, 'meta.city.faq.a1'), { city: cityDisplayName }),
    },
    {
      question: tmpl(t(dict, 'meta.city.faq.q2'), { city: cityDisplayName }),
      answer: tmpl(t(dict, 'meta.city.faq.a2'), { city: cityDisplayName }),
    },
    {
      question: tmpl(t(dict, 'meta.city.faq.q3'), { city: cityDisplayName }),
      answer: tmpl(t(dict, 'meta.city.faq.a3'), { city: cityDisplayName }),
    },
    {
      question: tmpl(t(dict, 'meta.city.faq.q4'), { city: cityDisplayName }),
      answer: tmpl(t(dict, 'meta.city.faq.a4'), { city: cityDisplayName }),
    },
    {
      question: tmpl(t(dict, 'meta.city.faq.q5'), { city: cityDisplayName }),
      answer: tmpl(t(dict, 'meta.city.faq.a5'), { city: cityDisplayName }),
    },
  ]
  
  // Related links; when intent is set, include /find/work-hubs + link back to base city; when base page, add Work + Laptop-friendly chips
  const relatedLinks = [
    ...(intent === 'work' || intent === 'laptop-friendly'
      ? [
          { href: `/cities/${citySlug}`, label: tmpl(t(dict, 'city.allCafesInCity'), { city: cityDisplayName }) },
          { href: '/find/wifi', label: t(dict, 'city.relatedWifi') },
          { href: '/find/outlets', label: t(dict, 'city.relatedOutlets') },
          { href: '/find/quiet', label: t(dict, 'city.relatedQuiet') },
          { href: '/find/work-hubs', label: intentFallback(dict, 'city.relatedWorkHubs', 'Work hubs') },
        ]
      : [
          { href: '/find/wifi', label: t(dict, 'city.relatedWifi') },
          { href: '/find/outlets', label: t(dict, 'city.relatedOutlets') },
          { href: '/find/quiet', label: t(dict, 'city.relatedQuiet') },
          { href: `/cities/${citySlug}/work`, label: intentFallback(dict, 'city.relatedWork', 'Work') },
          { href: `/cities/${citySlug}/laptop-friendly`, label: intentFallback(dict, 'city.relatedLaptopFriendly', 'Laptop-friendly') },
        ]),
  ]
  
  // Other cities links (localized)
  const otherCityLinks = [
    { href: '/cities/berlin', label: locale === 'de' ? 'Berlin' : 'Berlin' },
    { href: '/cities/muenchen', label: locale === 'de' ? 'München' : 'Munich' },
    { href: '/cities/hamburg', label: 'Hamburg' },
    { href: '/cities/koeln', label: locale === 'de' ? 'Köln' : 'Cologne' },
    { href: '/cities/frankfurt', label: 'Frankfurt' },
    { href: '/cities/leipzig', label: 'Leipzig' },
    { href: '/cities/duesseldorf', label: 'Düsseldorf' },
  ]
  
  // Niche section
  const showNicheSection = cafeCount >= 10
  const nicheSectionTitle = showNicheSection ? t(dict, 'meta.city.nicheSection.title') : undefined
  const nicheSectionDescription = showNicheSection
    ? tmpl(t(dict, 'meta.city.nicheSection.description'), { city: cityDisplayName })
    : undefined
  
  return {
    locale,
    citySlug,
    cityDisplayName,
    seoTitle,
    seoDescription,
    h1Title,
    introText,
    trustParagraph,
    faqItems,
    districtLinks: undefined,
    relatedLinks,
    otherCityLinks,
    showNicheSection,
    nicheSectionTitle,
    nicheSectionDescription,
    dict,
  }
}
