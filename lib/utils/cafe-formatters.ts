/**
 * Format work score for display
 * If work_score is 0-100, show "72/100"
 * If work_score is 0-10, show "7.2/10" (divide by 10, 1 decimal)
 */
export function formatWorkScore(workScore: number | null | undefined): string | null {
  if (workScore == null) return null
  
  // If score is 0-100, show as "72/100"
  if (workScore > 10) {
    return `${Math.round(workScore)}/100`
  }
  
  // If score is 0-10, show as "7.2/10"
  return `${workScore.toFixed(1)}/10`
}

/**
 * Normalize confidence value for display
 * Returns null if confidence should not be displayed
 */
export function normalizeConfidence(
  ai_confidence: string | number | null | undefined
): string | null {
  if (ai_confidence == null || ai_confidence === '') {
    return null
  }

  // Handle number
  if (typeof ai_confidence === 'number') {
    if (ai_confidence <= 0) {
      return null
    }
    // If 0-1, convert to percent (0.73 => "73%")
    if (ai_confidence <= 1) {
      return `${Math.round(ai_confidence * 100)}%`
    }
    // If 1-100, treat as percent
    if (ai_confidence <= 100) {
      return `${Math.round(ai_confidence)}%`
    }
    // If > 100, treat as raw number
    return `${Math.round(ai_confidence)}%`
  }

  // Handle string
  if (typeof ai_confidence === 'string') {
    const lower = ai_confidence.toLowerCase().trim()
    
    // Reject "0" or "unknown"
    if (lower === '0' || lower === 'unknown') {
      return null
    }
    
    // Handle "low|medium|high" (case-insensitive)
    if (lower === 'low' || lower === 'medium' || lower === 'high') {
      return lower.charAt(0).toUpperCase() + lower.slice(1)
    }
    
    // Try to parse as number
    const num = parseFloat(lower)
    if (!isNaN(num)) {
      if (num <= 0) {
        return null
      }
      if (num <= 1) {
        return `${Math.round(num * 100)}%`
      }
      if (num <= 100) {
        return `${Math.round(num)}%`
      }
    }
    
    // Return as-is if it's a valid string
    return ai_confidence
  }

  return null
}

/**
 * Normalize "unknown" fields to "Not enough data yet"
 */
export function normalizeUnknownToNotEnoughDataYet(
  value: string | null | undefined
): string | null {
  if (!value || value.trim() === '') {
    return null
  }
  
  const lower = value.toLowerCase().trim()
  if (lower === 'unknown' || lower === 'null' || lower === 'n/a') {
    return null
  }
  
  return value
}

/**
 * Format price level (1-4) to dollar signs
 */
export function formatPriceLevel(priceLevel: number | null | undefined): string | null {
  if (priceLevel == null || priceLevel < 1 || priceLevel > 4) {
    return null
  }
  
  return '$'.repeat(priceLevel)
}
