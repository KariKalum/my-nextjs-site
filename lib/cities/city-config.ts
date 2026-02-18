/**
 * Generic city page configuration builder
 * Used to generate city pages for all German cities.
 * Every city page follows the same template/functionality as Berlin;
 * Berlin adds district links; others use the same structure with districtLinks undefined.
 */

import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/getDictionary'
import type { CityPageConfig, CityPageFAQ } from './types'
import type { Intent } from './intent'
import { t, tmpl } from '@/lib/i18n/t'
import { buildBerlinCityConfig } from './berlin-config'
import { normalizeForSearch } from '@/lib/utils/city-helpers'

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
  /** slugifyCity("München") yields "munchen" (ü→u); slugifyCity("Munich") yields "munich" */
  munchen: { de: 'München', en: 'Munich', dbName: 'Munich' },
  munich: { de: 'München', en: 'Munich', dbName: 'Munich' },
  hamburg: { de: 'Hamburg', en: 'Hamburg', dbName: 'Hamburg' },
  koeln: { de: 'Köln', en: 'Cologne', dbName: 'Cologne' },
  /** slugifyCity("Köln") yields "koln" (ö→o); slugifyCity("Cologne") yields "cologne" */
  koln: { de: 'Köln', en: 'Cologne', dbName: 'Cologne' },
  cologne: { de: 'Köln', en: 'Cologne', dbName: 'Cologne' },
  frankfurt: { de: 'Frankfurt', en: 'Frankfurt', dbName: 'Frankfurt' },
  leipzig: { de: 'Leipzig', en: 'Leipzig', dbName: 'Leipzig' },
  duesseldorf: { de: 'Düsseldorf', en: 'Düsseldorf', dbName: 'Düsseldorf' },
  /** slugifyCity("Düsseldorf") yields "dusseldorf" (ü→u) */
  dusseldorf: { de: 'Düsseldorf', en: 'Düsseldorf', dbName: 'Düsseldorf' },
  potsdam: { de: 'Potsdam', en: 'Potsdam', dbName: 'Potsdam' },
  oldenburg: { de: 'Oldenburg', en: 'Oldenburg', dbName: 'Oldenburg' },
  osnabrueck: { de: 'Osnabrück', en: 'Osnabrück', dbName: 'Osnabrück' },
  /** slugifyCity("Osnabrück") yields "osnabruck" (ü→u) */
  osnabruck: { de: 'Osnabrück', en: 'Osnabrück', dbName: 'Osnabrück' },
  stuttgart: { de: 'Stuttgart', en: 'Stuttgart', dbName: 'Stuttgart' },
  dresden: { de: 'Dresden', en: 'Dresden', dbName: 'Dresden' },
  hannover: { de: 'Hannover', en: 'Hannover', dbName: 'Hannover' },
  nuernberg: { de: 'Nürnberg', en: 'Nuremberg', dbName: 'Nuremberg' },
  /** slugifyCity("Nürnberg") yields "nurnberg"; slugifyCity("Nuremberg") yields "nuremberg" */
  nurnberg: { de: 'Nürnberg', en: 'Nuremberg', dbName: 'Nuremberg' },
  nuremberg: { de: 'Nürnberg', en: 'Nuremberg', dbName: 'Nuremberg' },
  bremen: { de: 'Bremen', en: 'Bremen', dbName: 'Bremen' },
  dortmund: { de: 'Dortmund', en: 'Dortmund', dbName: 'Dortmund' },
  essen: { de: 'Essen', en: 'Essen', dbName: 'Essen' },
  mannheim: { de: 'Mannheim', en: 'Mannheim', dbName: 'Mannheim' },
  bonn: { de: 'Bonn', en: 'Bonn', dbName: 'Bonn' },
  karlsruhe: { de: 'Karlsruhe', en: 'Karlsruhe', dbName: 'Karlsruhe' },
  freiburg: { de: 'Freiburg', en: 'Freiburg', dbName: 'Freiburg' },
  muenster: { de: 'Münster', en: 'Münster', dbName: 'Münster' },
  heidelberg: { de: 'Heidelberg', en: 'Heidelberg', dbName: 'Heidelberg' },
  berlin: { de: 'Berlin', en: 'Berlin', dbName: 'Berlin' },
}

/** Districts for major cities to capture local search intent */
export const CITY_DISTRICT_MAP: Record<string, Record<string, string>> = {
  berlin: {
    mitte: 'Mitte',
    kreuzberg: 'Kreuzberg',
    charlottenburg: 'Charlottenburg',
    neukoelln: 'Neukölln',
    'prenzlauer-berg': 'Prenzlauer Berg',
    friedrichshain: 'Friedrichshain',
    hbf: 'Hauptbahnhof',
  },
  muenchen: {
    maxvorstadt: 'Maxvorstadt',
    schwabing: 'Schwabing',
    haidhausen: 'Haidhausen',
    sendling: 'Sendling',
    giesing: 'Giesing',
    ludwigsvorstadt: 'Ludwigsvorstadt',
    isarsvorstadt: 'Isarsvorstadt',
  },
  munchen: {
    maxvorstadt: 'Maxvorstadt',
    schwabing: 'Schwabing',
    haidhausen: 'Haidhausen',
    sendling: 'Sendling',
    giesing: 'Giesing',
    ludwigsvorstadt: 'Ludwigsvorstadt',
    isarsvorstadt: 'Isarsvorstadt',
  },
  munich: {
    maxvorstadt: 'Maxvorstadt',
    schwabing: 'Schwabing',
    haidhausen: 'Haidhausen',
    sendling: 'Sendling',
    giesing: 'Giesing',
    ludwigsvorstadt: 'Ludwigsvorstadt',
    isarsvorstadt: 'Isarsvorstadt',
  },
  hamburg: {
    altona: 'Altona',
    eimsbuettel: 'Eimsbüttel',
    'st-pauli': 'St. Pauli',
    winterhude: 'Winterhude',
    'st-georg': 'St. Georg',
    ottensen: 'Ottensen',
  },
  koeln: {
    ehrenfeld: 'Ehrenfeld',
    nippes: 'Nippes',
    suedstadt: 'Südstadt',
    'belgisches-viertel': 'Belgisches Viertel',
  },
  cologne: {
    ehrenfeld: 'Ehrenfeld',
    nippes: 'Nippes',
    suedstadt: 'Südstadt',
    'belgisches-viertel': 'Belgisches Viertel',
  },
}


/** Map centers for city pages (same template as Berlin; map centers when no cafes or for region) */
const CITY_MAP_CENTERS: Record<string, { lat: number; lng: number }> = {
  berlin: { lat: 52.52, lng: 13.405 },
  hamburg: { lat: 53.5511, lng: 9.9937 },
  muenchen: { lat: 48.1351, lng: 11.582 },
  munchen: { lat: 48.1351, lng: 11.582 },
  munich: { lat: 48.1351, lng: 11.582 },
  koeln: { lat: 50.9375, lng: 6.9603 },
  koln: { lat: 50.9375, lng: 6.9603 },
  cologne: { lat: 50.9375, lng: 6.9603 },
  frankfurt: { lat: 50.1109, lng: 8.6821 },
  leipzig: { lat: 51.3397, lng: 12.3731 },
  duesseldorf: { lat: 51.2277, lng: 6.7735 },
  dusseldorf: { lat: 51.2277, lng: 6.7735 },
  dresden: { lat: 51.0504, lng: 13.7373 },
  stuttgart: { lat: 48.7758, lng: 9.1829 },
  nuernberg: { lat: 49.4521, lng: 11.0767 },
  nurnberg: { lat: 49.4521, lng: 11.0767 },
  nuremberg: { lat: 49.4521, lng: 11.0767 },
  hannover: { lat: 52.3759, lng: 9.732 },
  bremen: { lat: 53.0793, lng: 8.8017 },
  potsdam: { lat: 52.3906, lng: 13.0645 },
  osnabruck: { lat: 52.2789, lng: 8.0431 },
}

/** Normalized search query -> city names (as in DB) for Hero search; e.g. "dusseldorf" -> ["Düsseldorf"] */
let searchToCityNames: Record<string, string[]> | null = null
function buildSearchToCityNames(): Record<string, string[]> {
  if (searchToCityNames) return searchToCityNames
  const map: Record<string, string[]> = {}
  for (const entry of Object.values(CITY_DISPLAY_NAMES)) {
    for (const name of [entry.de, entry.en, entry.dbName]) {
      const key = normalizeForSearch(name)
      if (!key) continue
      if (!map[key]) map[key] = []
      if (!map[key].includes(name)) map[key].push(name)
    }
  }
  searchToCityNames = map
  return map
}

/**
 * City names to search for in DB when user types a normalized query (e.g. "dusseldorf" -> ["Düsseldorf"]).
 * Use in Hero search so "dusseldorf" and "Düsseldorf" both match.
 */
export function getCityNamesForSearch(query: string): string[] {
  if (!query || typeof query !== 'string') return []
  const key = normalizeForSearch(query)
  return buildSearchToCityNames()[key] ?? []
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
  intent?: Intent,
  districtSlug?: string,
  districtDisplayName?: string
): CityPageConfig {
  const cityDisplayName = getCityDisplayName(citySlug, locale)
  const siteName = t(dict, 'meta.siteName')
  const isDistrict = Boolean(districtSlug && districtDisplayName)
  const displayName = isDistrict ? districtDisplayName : cityDisplayName

  let h1Title: string
  let seoTitle: string
  let seoDescription: string

  if (intent === 'work') {
    h1Title = intentFallback(
      dict,
      'meta.city.intent.work.h1Title',
      locale === 'de'
        ? `Cafés zum Arbeiten in ${displayName} (WLAN & Steckdosen)`
        : `Best Cafés to Work From in ${displayName} (WiFi & Power Outlets)`
    )
    if (h1Title.includes('{city}')) h1Title = tmpl(h1Title, { city: displayName })
    if (h1Title.includes('{district}')) h1Title = tmpl(h1Title, { district: districtDisplayName })

    seoTitle = intentFallback(
      dict,
      'meta.city.intent.work.seoTitle',
      `Cafés to Work From in ${displayName} – WiFi, Power Outlets & Laptop-Friendly | ${siteName}`
    )
    if (seoTitle.includes('{city}')) seoTitle = tmpl(seoTitle, { city: displayName, siteName })
    if (seoTitle.includes('{district}')) seoTitle = tmpl(seoTitle, { district: districtDisplayName, siteName })

    seoDescription = intentFallback(
      dict,
      'meta.city.intent.work.seoDescription',
      `Find the best cafés to work from in ${displayName} with reliable WiFi, power outlets, and laptop-friendly spaces. Perfect for remote work, studying, and meetings.`
    )
    if (seoDescription.includes('{city}')) seoDescription = tmpl(seoDescription, { city: displayName })
    if (seoDescription.includes('{district}')) seoDescription = tmpl(seoDescription, { district: districtDisplayName })
  } else if (intent === 'laptop-friendly') {
    h1Title = intentFallback(
      dict,
      'meta.city.intent.laptopFriendly.h1Title',
      locale === 'de'
        ? `Laptopfreundliche Cafés in ${displayName}`
        : `Laptop-Friendly Cafés in ${displayName}`
    )
    if (h1Title.includes('{city}')) h1Title = tmpl(h1Title, { city: displayName })
    if (h1Title.includes('{district}')) h1Title = tmpl(h1Title, { district: districtDisplayName })

    seoTitle = intentFallback(
      dict,
      'meta.city.intent.laptopFriendly.seoTitle',
      `Laptop-Friendly Cafés in ${displayName} – WiFi & Power Outlets | ${siteName}`
    )
    if (seoTitle.includes('{city}')) seoTitle = tmpl(seoTitle, { city: displayName, siteName })
    if (seoTitle.includes('{district}')) seoTitle = tmpl(seoTitle, { district: districtDisplayName, siteName })

    seoDescription = intentFallback(
      dict,
      'meta.city.intent.laptopFriendly.seoDescription',
      `Find laptop-friendly cafés in ${displayName} with WiFi, power outlets, and work-friendly policies. Ideal for remote work and studying.`
    )
    if (seoDescription.includes('{city}')) seoDescription = tmpl(seoDescription, { city: displayName })
    if (seoDescription.includes('{district}')) seoDescription = tmpl(seoDescription, { district: districtDisplayName })
  } else if (intent === 'wifi') {
    h1Title = locale === 'de' ? `Cafés mit gutem WLAN in ${displayName}` : `Cafés with Good WiFi in ${displayName}`
    seoTitle = locale === 'de'
      ? `Die ${cafeCount >= 5 ? cafeCount + '+ ' : ''}besten Cafés mit WLAN in ${displayName} zum Arbeiten | ${siteName}`
      : `Best Cafés with WiFi in ${displayName} for Working | ${siteName}`
    seoDescription = locale === 'de'
      ? `Finde laptopfreundliche Cafés in ${displayName} mit schnellem und stabilem WLAN. Ideal für Videocalls, Remote-Arbeit und Studium.`
      : `Find laptop-friendly cafés in ${displayName} with fast, stable WiFi. Perfect for video calls, remote work, and studying.`
  } else if (intent === 'outlets') {
    h1Title = locale === 'de' ? `Cafés mit Steckdosen in ${displayName}` : `Cafés with Power Outlets in ${displayName}`
    seoTitle = locale === 'de'
      ? `Die besten Cafés mit Steckdosen in ${displayName} zum Arbeiten | ${siteName}`
      : `Best Cafés with Power Outlets in ${displayName} for Working | ${siteName}`
    seoDescription = locale === 'de'
      ? `Laptop-Arbeitsplätze in ${displayName} mit Steckdosen finden. Wir listen Cafés, in denen du deinen Laptop aufladen und produktiv arbeiten kannst.`
      : `Find laptop-friendly spots in ${displayName} with power outlets. We list cafés where you can charge your devices and stay productive.`
  } else if (intent === 'quiet') {
    h1Title = locale === 'de' ? `Ruhige Cafés zum Arbeiten in ${displayName}` : `Quiet Cafés to Work In ${displayName}`
    seoTitle = locale === 'de'
      ? `Die besten ruhigen Cafés in ${displayName} für konzentriertes Arbeiten | ${siteName}`
      : `Best Quiet Cafés in ${displayName} for Deep Work | ${siteName}`
    seoDescription = locale === 'de'
      ? `Suchst du einen ruhigen Ort zum Arbeiten in ${displayName}? Entdecke Cafés mit entspannter Atmosphäre, perfekt für Fokus und Konzentration.`
      : `Looking for a quiet place to work in ${displayName}? Discover cafés with a relaxed atmosphere, perfect for focus and concentration.`
  } else {
    const bestOfPrefix = cafeCount >= 10 ? (locale === 'de' ? `Die ${cafeCount}+ besten ` : `Best ${cafeCount}+ `) : (locale === 'de' ? 'Die besten ' : 'Best ')
    h1Title =
      locale === 'de'
        ? `${bestOfPrefix}Cafés zum Arbeiten in ${displayName} (mit WLAN & Steckdosen)`
        : `${bestOfPrefix}Cafés to Work From in ${displayName} (WiFi & Power Outlets)`
    seoTitle =
      locale === 'de'
        ? `${bestOfPrefix}Cafés zum Arbeiten in ${displayName} – WLAN, Steckdosen & Laptopfreundlich | ${siteName}`
        : `${bestOfPrefix}Cafés to Work From in ${displayName} – WiFi, Power Outlets & Laptop-Friendly | ${siteName}`
    seoDescription =
      locale === 'de'
        ? `Die besten Cafés zum Arbeiten in ${displayName} finden – mit zuverlässigem WLAN, Steckdosen und laptopfreundlichen Räumen. Perfekt für Remote-Arbeit, Lernen und Meetings.`
        : `Find the best cafés to work from in ${displayName} with reliable WiFi, power outlets, and laptop-friendly spaces. Perfect for remote work, studying, and meetings.`
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

  // Map center (same template as Berlin: show region when no cafes)
  const mapCenter = CITY_MAP_CENTERS[citySlug.toLowerCase()] ?? undefined
  const mapZoom = 12
  const preserveRegionZoom = false

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
    mapCenter,
    mapZoom,
    preserveRegionZoom,
    dict,
  }
}

/**
 * City name for DB fetch: Berlin uses 'Berlin'; others use slug→dbName mapping.
 * Use when calling getCafesByCityAndDistrict so every city page uses the same pattern.
 */
export function getCityNameForFetch(citySlug: string): string {
  const slug = citySlug.toLowerCase()
  if (slug === 'berlin') return 'Berlin'
  return getCityDbName(slug)
}

/** Reverse map: DB/display city name (any variant) → canonical slug for URLs */
let cityNameToSlugMap: Record<string, string> | null = null
function buildCityNameToSlugMap(): Record<string, string> {
  if (cityNameToSlugMap) return cityNameToSlugMap
  const map: Record<string, string> = {}
  for (const [slug, entry] of Object.entries(CITY_DISPLAY_NAMES)) {
    map[entry.de.toLowerCase()] = slug
    map[entry.en.toLowerCase()] = slug
    map[entry.dbName.toLowerCase()] = slug
  }
  cityNameToSlugMap = map
  return map
}

/**
 * Canonical slug for city page URLs from DB/display city name.
 * Use when linking from a city name (e.g. from getCities()) to the city page.
 */
export function getSlugForCityName(cityName: string): string {
  if (!cityName || typeof cityName !== 'string') return ''
  const key = cityName.trim().toLowerCase()
  const map = buildCityNameToSlugMap()
  if (map[key]) return map[key]
  // Fallback: slugify (replace spaces with hyphens, no umlaut expansion)
  return key.replace(/\s+/g, '-').replace(/[^\w-]/g, '')
}

/**
 * Unified city page config: Berlin uses Berlin template (with districts);
 * all other cities use the same template with optional district links when applicable.
 * Use this in [city]/page.tsx so every city page follows the Berlin template and functionality.
 */
export function getCityPageConfig(
  locale: Locale,
  dict: Dictionary,
  citySlug: string,
  cafeCount: number,
  intent?: Intent,
  districtSlug?: string,
  districtDisplayName?: string
): CityPageConfig {
  const slug = citySlug.toLowerCase()
  if (slug === 'berlin') {
    return buildBerlinCityConfig(locale, dict, districtSlug, districtDisplayName, intent, cafeCount)
  }
  return buildCityConfig(locale, dict, citySlug, cafeCount, intent, districtSlug, districtDisplayName)
}
