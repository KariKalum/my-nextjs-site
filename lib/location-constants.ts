/**
 * Shared location constants for map-first UX (homepage + feature pages).
 * Used for: Berlin default center, radius expansion steps, min results threshold.
 * Never punish users for where they live: expand radius until we have enough results.
 */

export const BERLIN_CENTER = { lat: 52.52, lng: 13.405 } as const

/** Default radius (m) for initial Berlin or single-radius fetch */
export const DEFAULT_RADIUS_M = 5000

/**
 * Radius steps (m) when expanding search (e.g. user location returns too few results).
 * Try each step until we have at least MIN_RESULTS_THRESHOLD or exhaust steps.
 */
export const RADIUS_STEPS = [5000, 15000, 50000, 100000] as const

/** Minimum number of results to aim for before stopping radius expansion */
export const MIN_RESULTS_THRESHOLD = 8
