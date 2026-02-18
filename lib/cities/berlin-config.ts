/**
 * Berlin city page configuration
 * Used to generate Berlin city and district pages
 */

import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/getDictionary'
import type { CityPageConfig, CityPageFAQ } from './types'
import type { Intent } from './intent'
import { t, tmpl } from '@/lib/i18n/t'

// TODO: Add meta.city.intent.* keys to en.json and de.json for Berlin/district work / laptop-friendly.
// Until then, English fallbacks are used when the key is missing.
function intentFallback(dict: Dictionary, key: string, fallback: string): string {
  const v = t(dict, key)
  return v === key ? fallback : v
}

/**
 * Build Berlin city page configuration
 */
// Geographic center coordinates for Berlin and its districts
const BERLIN_MAP_CENTERS: Record<string, { lat: number; lng: number }> = {
  // Main Berlin city center
  berlin: { lat: 52.5200, lng: 13.4050 },
  // Districts
  mitte: { lat: 52.5200, lng: 13.4050 },
  kreuzberg: { lat: 52.4970, lng: 13.4030 },
  charlottenburg: { lat: 52.5163, lng: 13.3040 },
  neukoelln: { lat: 52.4812, lng: 13.4350 },
  'prenzlauer-berg': { lat: 52.5388, lng: 13.4244 },
  friedrichshain: { lat: 52.5170, lng: 13.4540 },
  hbf: { lat: 52.5251, lng: 13.3694 }, // Berlin Hauptbahnhof
}

export function buildBerlinCityConfig(
  locale: Locale,
  dict: Dictionary,
  districtSlug?: string,
  districtDisplayName?: string,
  intent?: Intent,
  /** When provided for main city page, trust paragraph uses this count */
  cafeCount?: number
): CityPageConfig {
  const isDistrict = Boolean(districtSlug && districtDisplayName)
  const citySlug = 'berlin'
  const cityDisplayName = 'Berlin'

  // Get map center for the district or city
  const mapCenter = districtSlug
    ? BERLIN_MAP_CENTERS[districtSlug] || BERLIN_MAP_CENTERS.berlin
    : BERLIN_MAP_CENTERS.berlin
  const mapZoom = isDistrict ? 14 : 12
  const preserveRegionZoom = isDistrict

  let h1Title: string
  let seoTitle: string
  let seoDescription: string

  if (intent === 'work') {
    if (isDistrict && districtDisplayName) {
      h1Title = intentFallback(
        dict,
        'meta.city.intent.work.districtH1Title',
        locale === 'de'
          ? `Cafés zum Arbeiten in Berlin ${districtDisplayName} (WLAN & Steckdosen)`
          : `Best Cafés to Work From in Berlin ${districtDisplayName} (WiFi & Power Outlets)`
      )
      h1Title = h1Title.includes('{district}') ? tmpl(h1Title, { district: districtDisplayName }) : h1Title
      seoTitle = intentFallback(
        dict,
        'meta.city.intent.work.districtSeoTitle',
        `Cafés to Work From in Berlin ${districtDisplayName} – WiFi & Power Outlets | ${t(dict, 'meta.siteName')}`
      )
      seoTitle = seoTitle.includes('{district}') ? tmpl(seoTitle, { district: districtDisplayName, siteName: t(dict, 'meta.siteName') }) : seoTitle
      seoDescription = intentFallback(
        dict,
        'meta.city.intent.work.districtSeoDescription',
        `Find the best cafés to work from in Berlin ${districtDisplayName} with reliable WiFi, power outlets, and laptop-friendly spaces. Perfect for remote work and studying.`
      )
      seoDescription = seoDescription.includes('{district}') ? tmpl(seoDescription, { district: districtDisplayName }) : seoDescription
    } else {
      h1Title = intentFallback(dict, 'meta.city.intent.work.h1Title', `Best Cafés to Work From in Berlin (WiFi & Power Outlets)`)
      if (h1Title.includes('{city}')) h1Title = tmpl(h1Title, { city: cityDisplayName })
      seoTitle = intentFallback(dict, 'meta.city.intent.work.seoTitle', `Cafés to Work From in Berlin – WiFi, Power Outlets & Laptop-Friendly | ${t(dict, 'meta.siteName')}`)
      if (seoTitle.includes('{city}')) seoTitle = tmpl(seoTitle, { city: cityDisplayName, siteName: t(dict, 'meta.siteName') })
      seoDescription = intentFallback(dict, 'meta.city.intent.work.seoDescription', `Find the best cafés to work from in Berlin with reliable WiFi, power outlets, and laptop-friendly spaces. Perfect for remote work, studying, and meetings.`)
      if (seoDescription.includes('{city}')) seoDescription = tmpl(seoDescription, { city: cityDisplayName })
    }
  } else if (intent === 'laptop-friendly') {
    if (isDistrict && districtDisplayName) {
      h1Title = intentFallback(
        dict,
        'meta.city.intent.laptopFriendly.districtH1Title',
        locale === 'de'
          ? `Laptopfreundliche Cafés in Berlin ${districtDisplayName}`
          : `Laptop-Friendly Cafés in Berlin ${districtDisplayName}`
      )
      h1Title = h1Title.includes('{district}') ? tmpl(h1Title, { district: districtDisplayName }) : h1Title
      seoTitle = intentFallback(
        dict,
        'meta.city.intent.laptopFriendly.districtSeoTitle',
        `Laptop-Friendly Cafés in Berlin ${districtDisplayName} – WiFi & Power Outlets | ${t(dict, 'meta.siteName')}`
      )
      seoTitle = seoTitle.includes('{district}') ? tmpl(seoTitle, { district: districtDisplayName, siteName: t(dict, 'meta.siteName') }) : seoTitle
      seoDescription = intentFallback(
        dict,
        'meta.city.intent.laptopFriendly.districtSeoDescription',
        `Find laptop-friendly cafés in Berlin ${districtDisplayName} with WiFi, power outlets, and work-friendly policies. Ideal for remote work and studying.`
      )
      seoDescription = seoDescription.includes('{district}') ? tmpl(seoDescription, { district: districtDisplayName }) : seoDescription
    } else {
      h1Title = intentFallback(dict, 'meta.city.intent.laptopFriendly.h1Title', `Laptop-Friendly Cafés in Berlin`)
      if (h1Title.includes('{city}')) h1Title = tmpl(h1Title, { city: cityDisplayName })
      seoTitle = intentFallback(dict, 'meta.city.intent.laptopFriendly.seoTitle', `Laptop-Friendly Cafés in Berlin – WiFi & Power Outlets | ${t(dict, 'meta.siteName')}`)
      if (seoTitle.includes('{city}')) seoTitle = tmpl(seoTitle, { city: cityDisplayName, siteName: t(dict, 'meta.siteName') })
      seoDescription = intentFallback(dict, 'meta.city.intent.laptopFriendly.seoDescription', `Find laptop-friendly cafés in Berlin with WiFi, power outlets, and work-friendly policies. Ideal for remote work and studying.`)
      if (seoDescription.includes('{city}')) seoDescription = tmpl(seoDescription, { city: cityDisplayName })
    }
  } else {
    h1Title = isDistrict
      ? `${t(dict, 'city.laptopFriendlyIn')} ${districtDisplayName}, ${cityDisplayName}`
      : t(dict, 'city.berlinH1')

    // SEO Overrides for main Berlin page (DE locale)
    if (!isDistrict && locale === 'de') {
      seoTitle = 'Cafés zum Arbeiten in Berlin (2026) – 105 Orte mit WLAN & Steckdosen'
      seoDescription = 'Die besten Cafés zum Arbeiten in Berlin ✓ Mit WLAN ✓ Viele Steckdosen ✓ Ruhige Atmosphäre. 105 geprüfte Orte in Mitte, Kreuzberg & Prenzlauer Berg.'
    } else {
      seoTitle = isDistrict && districtDisplayName
        ? locale === 'de'
          ? `Cafés zum Arbeiten in Berlin ${districtDisplayName} – WLAN & Steckdosen`
          : `Cafés to Work From in Berlin ${districtDisplayName} – WiFi & Power Outlets`
        : t(dict, 'meta.city.berlinTitle')
      seoDescription = isDistrict && districtDisplayName
        ? locale === 'de'
          ? `Die besten Cafés zum Arbeiten in Berlin ${districtDisplayName} finden – mit zuverlässigem WLAN, Steckdosen und laptopfreundlichen Räumen. Perfekt für Remote-Arbeit und Lernen.`
          : `Find the best cafés to work from in Berlin ${districtDisplayName} with reliable WiFi, power outlets, and laptop-friendly spaces. Perfect for remote work and studying.`
        : t(dict, 'meta.city.berlinDescription')
    }
  }

  // Intro text
  let introText: string | undefined
  if (isDistrict && districtDisplayName) {
    // Map district display names to intro keys
    const districtIntroMap: Record<string, string> = {
      'Mitte': 'meta.city.district.introMitte',
      'Charlottenburg': 'meta.city.district.introCharlottenburg',
      'Prenzlauer Berg': 'meta.city.district.introPrenzlauerBerg',
      'Neukölln': 'meta.city.district.introNeukoelln',
      'Kreuzberg': 'meta.city.district.introKreuzberg',
      'Friedrichshain': 'meta.city.district.introFriedrichshain',
      'Hauptbahnhof': 'meta.city.district.introHbf',
      'HBF': 'meta.city.district.introHbf',
    }
    const introKey = districtIntroMap[districtDisplayName]
    introText = introKey ? t(dict, introKey) : undefined
  } else if (!isDistrict) {
    introText = t(dict, 'meta.city.introBerlin')
  }

  // Trust paragraph (only for main city page); use actual count when provided
  const trustParagraph = !isDistrict
    ? tmpl(t(dict, 'meta.city.trustParagraph.berlin'), {
      count: cafeCount !== undefined && cafeCount >= 0
        ? (cafeCount >= 40 ? '40+' : String(cafeCount))
        : '40+',
    })
    : undefined

  // FAQ items (Berlin-specific, adapted for districts)
  let faqItems: CityPageFAQ[]

  if (isDistrict && districtDisplayName) {
    faqItems = [
      {
        question: tmpl(t(dict, 'meta.city.district.faqQ1'), { district: districtDisplayName }),
        answer: tmpl(t(dict, 'meta.city.district.faqA1'), { district: districtDisplayName }),
      },
      {
        question: tmpl(t(dict, 'meta.city.district.faqQ2'), { district: districtDisplayName }),
        answer: tmpl(t(dict, 'meta.city.district.faqA2'), { district: districtDisplayName }),
      },
      {
        question: tmpl(t(dict, 'meta.city.district.faqQ3'), { district: districtDisplayName }),
        answer: tmpl(t(dict, 'meta.city.district.faqA3'), { district: districtDisplayName }),
      },
      {
        question: tmpl(t(dict, 'meta.city.district.faqQ4'), { district: districtDisplayName }),
        answer: tmpl(t(dict, 'meta.city.district.faqA4'), { district: districtDisplayName }),
      },
      {
        question: tmpl(t(dict, 'meta.city.district.faqQ5'), { district: districtDisplayName }),
        answer: tmpl(t(dict, 'meta.city.district.faqA5'), { district: districtDisplayName }),
      },
    ]
  } else {
    // Berlin main page optimized FAQs (DE locale)
    if (locale === 'de') {
      faqItems = [
        {
          question: 'Wo kann man in Berlin mit Laptop im Café arbeiten?',
          answer: 'In Berlin gibt es über 100 Cafés mit WLAN und Steckdosen, die speziell für Remote-Arbeit und Studium geeignet sind. Besonders in Mitte, Kreuzberg und Neukölln finden Sie eine hohe Dichte an laptopfreundlichen Orten.',
        },
        {
          question: 'Welche Cafés in Berlin haben viele Steckdosen?',
          answer: 'Viele moderne Cafés wie das St. Oberholz, Espresso House oder spezialisierte Work-Cafés bieten zahlreiche Steckdosen an fast jedem Tisch. Wir markieren diese Orte in unserer Liste explizit.',
        },
        {
          question: 'Gibt es ruhige Cafés zum Lernen in Berlin?',
          answer: 'Ja, abseits der touristischen Hotspots gibt es viele ruhige Kiez-Cafés und Bibliotheks-Cafés, die eine ideale Atmosphäre für konzentriertes Lernen und Fokus bieten.',
        },
        {
          question: 'Sind Work Cafés in Berlin kostenlos?',
          answer: 'Die meisten Cafés in Berlin erlauben das Arbeiten am Laptop gegen eine faire Konsumation (z.B. ein Kaffee pro 2 Stunden). Es gibt jedoch auch Coworking-Cafés mit Zeit-Pauschalen.',
        },
      ]
    } else {
      faqItems = [
        {
          question: t(dict, 'meta.city.berlinFaq.q1'),
          answer: t(dict, 'meta.city.berlinFaq.a1'),
        },
        {
          question: t(dict, 'meta.city.berlinFaq.q2'),
          answer: t(dict, 'meta.city.berlinFaq.a2'),
        },
        {
          question: t(dict, 'meta.city.berlinFaq.q3'),
          answer: t(dict, 'meta.city.berlinFaq.a3'),
        },
        {
          question: t(dict, 'meta.city.berlinFaq.q4'),
          answer: t(dict, 'meta.city.berlinFaq.a4'),
        },
        {
          question: t(dict, 'meta.city.berlinFaq.q5'),
          answer: t(dict, 'meta.city.berlinFaq.a5'),
        },
      ]
    }
  }

  // District links (only for main city page)
  const districtLinks = !isDistrict
    ? [
      { href: '/cities/berlin/mitte', label: 'Mitte' },
      { href: '/cities/berlin/kreuzberg', label: 'Kreuzberg' },
      { href: '/cities/berlin/charlottenburg', label: 'Charlottenburg' },
      { href: '/cities/berlin/neukoelln', label: 'Neukölln' },
      { href: '/cities/berlin/prenzlauer-berg', label: 'Prenzlauer Berg' },
      { href: '/cities/berlin/friedrichshain', label: 'Friedrichshain' },
      { href: '/cities/berlin/hbf', label: 'HBF' },
    ]
    : undefined

  // Related links; when intent set include /find/work-hubs + link back to base; when base page add Work (+ Laptop-friendly for city only)
  const relatedLinks = [
    ...(intent === 'work' || intent === 'laptop-friendly'
      ? [
        ...(isDistrict && districtSlug
          ? [{ href: `/cities/berlin/${districtSlug}`, label: tmpl(t(dict, 'city.allCafesInDistrict'), { district: districtDisplayName ?? '' }) }]
          : [{ href: '/cities/berlin', label: locale === 'de' ? 'Cafés zum Arbeiten in Berlin' : tmpl(t(dict, 'city.allCafesInCity'), { city: cityDisplayName }) }]),
        { href: '/find/wifi', label: t(dict, 'city.relatedWifi') },
        { href: '/find/outlets', label: t(dict, 'city.relatedOutlets') },
        { href: '/find/quiet', label: t(dict, 'city.relatedQuiet') },
        { href: '/find/work-hubs', label: intentFallback(dict, 'city.relatedWorkHubs', 'Work hubs') },
      ]
      : [
        { href: '/find/wifi', label: t(dict, 'city.relatedWifi') },
        { href: '/find/outlets', label: t(dict, 'city.relatedOutlets') },
        { href: '/find/quiet', label: t(dict, 'city.relatedQuiet') },
        ...(!isDistrict
          ? [
            { href: '/cities/berlin/work', label: locale === 'de' ? 'Work Cafés mit WLAN in Berlin' : intentFallback(dict, 'city.relatedWork', 'Work') },
            { href: '/cities/berlin/laptop-friendly', label: locale === 'de' ? 'Laptopfreundliche Cafés in Berlin' : intentFallback(dict, 'city.relatedLaptopFriendly', 'Laptop-friendly') },
          ]
          : districtSlug
            ? [{ href: `/cities/berlin/${districtSlug}/work`, label: intentFallback(dict, 'city.relatedWork', 'Work') }]
            : []),
      ]),
  ]

  // Other cities (only for main city page)
  const otherCityLinks = !isDistrict
    ? [
      { href: '/cities/hamburg', label: 'Hamburg' },
      { href: '/cities/muenchen', label: locale === 'de' ? 'München' : 'Munich' },
      { href: '/cities/koeln', label: locale === 'de' ? 'Köln' : 'Cologne' },
      { href: '/cities/frankfurt', label: 'Frankfurt' },
      { href: '/cities/leipzig', label: 'Leipzig' },
      { href: '/cities/duesseldorf', label: 'Düsseldorf' },
    ]
    : undefined

  // District links (for district pages - link to Berlin and other districts)
  const districtLinksForDistrict = isDistrict
    ? [
      { href: '/cities/berlin', label: cityDisplayName },
      { href: '/cities/berlin/mitte', label: 'Mitte' },
      { href: '/cities/berlin/kreuzberg', label: 'Kreuzberg' },
      { href: '/cities/berlin/charlottenburg', label: 'Charlottenburg' },
      { href: '/cities/berlin/neukoelln', label: 'Neukölln' },
      { href: '/cities/berlin/prenzlauer-berg', label: 'Prenzlauer Berg' },
      { href: '/cities/berlin/friedrichshain', label: 'Friedrichshain' },
      { href: '/cities/berlin/hbf', label: 'HBF' },
    ]
    : undefined

  // Niche section
  const showNicheSection = !isDistrict
  const nicheSectionTitle = showNicheSection ? t(dict, 'meta.city.nicheSection.title') : undefined
  const nicheSectionDescription = showNicheSection
    ? tmpl(t(dict, 'meta.city.nicheSection.description'), { city: cityDisplayName })
    : undefined

  // Extra Sections (Mainly for Berlin main page DE)
  const extraSections = !isDistrict && locale === 'de'
    ? [
      {
        title: 'Laptopfreundliche Cafés in Berlin',
        content: 'Suchen Sie ein laptopfreundliches Café in Berlin mit stabilem WLAN und vielen Steckdosen? Hier finden Sie die besten Work-Cafés für Remote-Arbeit, Studium und Meetings. Unsere Liste umfasst über 100 verifizierte Orte, die ideal für digitales Arbeiten geeignet sind.',
      },
      {
        title: 'Beliebteste Bezirke für Remote-Arbeit',
        content: 'Berlin Mitte bietet viele ruhige Cafés mit WLAN und Steckdosen, ideal für Freelancer und Studenten. In Kreuzberg finden Sie eine lebendige Mischung aus Work-Cafés und kreativen Hubs. Prenzlauer Berg ist bekannt für seine entspannten, laptopfreundlichen Cafés mit exzellentem Kaffee.',
      },
      {
        title: 'Café vs. Coworking Space in Berlin – Was ist besser?',
        content: 'Während Coworking-Spaces eine professionelle Büro-Infrastruktur bieten, punkten Cafés mit einer inspirierenden Atmosphäre und geringeren Kosten. Für Fokus-Sessions von 2-4 Stunden sind Cafés oft die flexiblere und charmantere Wahl.',
      },
      {
        title: 'Beliebteste Cafés zum Arbeiten in Berlin',
        content: 'Basierend auf Nutzerbewertungen und Arbeitsfreundlichkeit gehören Orte wie das St. Oberholz (Mitte), Betahaus (Kreuzberg) und verschiedene kleine Kiez-Cafés zu den Top-Empfehlungen für effizientes Arbeiten.',
      },
    ]
    : undefined

  const lastUpdated = !isDistrict && locale === 'de' ? 'Februar 2026' : undefined

  return {
    locale,
    citySlug,
    cityDisplayName,
    districtSlug,
    districtDisplayName,
    seoTitle,
    seoDescription,
    h1Title,
    introText,
    trustParagraph,
    lastUpdated,
    extraSections,
    faqItems,
    districtLinks: districtLinks || districtLinksForDistrict,
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
