/**
 * Types for reusable city page framework
 */

import type { Cafe } from '@/src/lib/supabase/types'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/getDictionary'

export interface CityPageFAQ {
  question: string
  answer: string
}

export interface CityPageInternalLink {
  href: string
  label: string
}

export interface CityPageConfig {
  // Required
  locale: Locale
  citySlug: string
  cityDisplayName: string
  
  // Optional district support
  districtSlug?: string
  districtDisplayName?: string
  
  // SEO
  seoTitle: string
  seoDescription: string
  
  // Content
  h1Title: string
  introText?: string
  trustParagraph?: string
  
  // FAQ
  faqItems?: CityPageFAQ[]
  
  // Internal links
  districtLinks?: CityPageInternalLink[]
  relatedLinks?: CityPageInternalLink[]
  otherCityLinks?: CityPageInternalLink[]
  
  // Optional sections
  showNicheSection?: boolean
  nicheSectionTitle?: string
  nicheSectionDescription?: string
  
  // Dictionary for translations
  dict: Dictionary
}

export interface CityPageData {
  cafes: Cafe[]
  config: CityPageConfig
}
