import type { Cafe } from '@/lib/supabase'
import {
  formatWorkScore,
  normalizeConfidence,
  normalizeUnknownToNotEnoughDataYet
} from './cafe-formatters'

export interface FAQItem {
  q: string
  a: string
}

/**
 * Build exactly 5 FAQ items for a cafe using template answers.
 * Uses the same formatters as the detail page for consistency.
 */
export function buildFaq(cafe: Cafe): FAQItem[] {
  const faqs: FAQItem[] = []
  
  // Get normalized values once
  const workScore = formatWorkScore(cafe.work_score)
  const confidence = normalizeConfidence(cafe.ai_confidence)

  // Q1: "💻 Is this café good for working on a laptop?"
  let q1Answer = ''
  if (cafe.is_work_friendly === true) {
    q1Answer = 'Yes, this café is work-friendly.'
    if (workScore) {
      q1Answer += ` It has a work score of ${workScore}.`
    }
    if (confidence) {
      q1Answer += ` (Confidence: ${confidence})`
    }
  } else if (cafe.is_work_friendly === false) {
    q1Answer = 'This café may not be ideal for working on a laptop.'
    if (workScore) {
      q1Answer += ` It has a work score of ${workScore}.`
    }
    if (confidence) {
      q1Answer += ` (Confidence: ${confidence})`
    }
  } else if (workScore) {
    // No explicit is_work_friendly but we have work_score
    q1Answer = `This café has a work score of ${workScore}.`
    if (confidence) {
      q1Answer += ` (Confidence: ${confidence})`
    }
  } else {
    // No data at all
    q1Answer = 'Not enough data yet.'
  }
  
  faqs.push({
    q: '💻 Is this café good for working on a laptop?',
    a: q1Answer
  })

  // Q2: "📶 How's the Wi-Fi here?"
  const wifi = normalizeUnknownToNotEnoughDataYet(cafe.ai_wifi_quality)
  let q2Answer = wifi || 'Not enough data yet.'
  if (wifi && confidence) {
    q2Answer += ` (Confidence: ${confidence})`
  }
  
  faqs.push({
    q: '📶 How\'s the Wi-Fi here?',
    a: q2Answer
  })

  // Q3: "🔌 Are there power outlets?"
  const outlets = normalizeUnknownToNotEnoughDataYet(cafe.ai_power_outlets)
  const q3Answer = outlets || 'Not enough data yet.'
  
  faqs.push({
    q: '🔌 Are there power outlets?',
    a: q3Answer
  })

  // Q4: "🔊 What's the noise level like?"
  const noise = normalizeUnknownToNotEnoughDataYet(cafe.ai_noise_level)
  const q4Answer = noise || 'Not enough data yet.'
  
  faqs.push({
    q: '🔊 What\'s the noise level like?',
    a: q4Answer
  })

  // Q5: "🧾 What's the laptop policy?"
  const policy = normalizeUnknownToNotEnoughDataYet(cafe.ai_laptop_policy)
  const q5Answer = policy || 'Not enough data yet.'
  
  faqs.push({
    q: '🧾 What\'s the laptop policy?',
    a: q5Answer
  })

  return faqs
}
