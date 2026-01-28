/**
 * Berlin city page configuration
 * Used to generate Berlin city and district pages
 */

import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/getDictionary'
import type { CityPageConfig, CityPageFAQ } from './types'
import { t, tmpl } from '@/lib/i18n/t'

/**
 * Build Berlin city page configuration
 */
export function buildBerlinCityConfig(
  locale: Locale,
  dict: Dictionary,
  districtSlug?: string,
  districtDisplayName?: string
): CityPageConfig {
  const isDistrict = Boolean(districtSlug && districtDisplayName)
  const citySlug = 'berlin'
  const cityDisplayName = 'Berlin'
  
  // H1 title
  const h1Title = isDistrict
    ? `${t(dict, 'city.laptopFriendlyIn')} ${districtDisplayName}, ${cityDisplayName}`
    : t(dict, 'city.berlinH1')
  
  // SEO metadata
  const seoTitle = isDistrict && districtDisplayName
    ? locale === 'de'
      ? `Cafés zum Arbeiten in Berlin ${districtDisplayName} – WLAN & Steckdosen`
      : `Cafés to Work From in Berlin ${districtDisplayName} – WiFi & Power Outlets`
    : t(dict, 'meta.city.berlinTitle')
  
  const seoDescription = isDistrict && districtDisplayName
    ? locale === 'de'
      ? `Die besten Cafés zum Arbeiten in Berlin ${districtDisplayName} finden – mit zuverlässigem WLAN, Steckdosen und laptopfreundlichen Räumen. Perfekt für Remote-Arbeit und Lernen.`
      : `Find the best cafés to work from in Berlin ${districtDisplayName} with reliable WiFi, power outlets, and laptop-friendly spaces. Perfect for remote work and studying.`
    : t(dict, 'meta.city.berlinDescription')
  
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
  
  // Trust paragraph (only for main city page)
  const trustParagraph = !isDistrict
    ? tmpl(t(dict, 'meta.city.trustParagraph.berlin'), { count: '40+' })
    : undefined
  
  // FAQ items (Berlin-specific, adapted for districts)
  const faqItems: CityPageFAQ[] = isDistrict && districtDisplayName
    ? [
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
    : [
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
  
  // Related links
  const relatedLinks = [
    { href: '/find/wifi', label: t(dict, 'city.relatedWifi') },
    { href: '/find/outlets', label: t(dict, 'city.relatedOutlets') },
    { href: '/find/quiet', label: t(dict, 'city.relatedQuiet') },
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
    faqItems,
    districtLinks: districtLinks || districtLinksForDistrict,
    relatedLinks,
    otherCityLinks,
    showNicheSection,
    nicheSectionTitle,
    nicheSectionDescription,
    dict,
  }
}
