/**
 * Cafe routing helpers: canonical detail URLs, link integrity, and detail-fetch config.
 */

/**
 * Type for cafe identifier (place_id or id)
 */
export type CafeIdentifier = string

/**
 * Runtime guard to ensure identifier is valid.
 * Returns true if valid, false otherwise.
 */
function assertCafeIdentifier(identifier: unknown): identifier is CafeIdentifier {
  return typeof identifier === 'string' && identifier.trim().length > 0
}

/**
 * Get the canonical href for a cafe detail page.
 * Always uses /cafe/[identifier] format.
 * Prefers place_id if available, otherwise falls back to id.
 *
 * @param cafe - Cafe object with place_id and/or id
 * @returns Canonical href path (e.g. "/cafe/ChIJ...") or "/cities" if no valid identifier
 * @throws Never throws - always returns a valid path (falls back to /cities if both missing)
 */
export function getCafeHref(cafe: {
  place_id?: string | null
  id?: string
}): string {
  const id = getCafeIdentifier(cafe)
  if (id) return `/cafe/${id}`
  if (
    typeof process !== 'undefined' &&
    process.env.NEXT_PUBLIC_DEBUG_LOGS === 'true'
  ) {
    // eslint-disable-next-line no-console
    console.warn('[getCafeHref] Cafe missing both place_id and id; falling back to /cities', {
      place_id: cafe.place_id ?? null,
      id: cafe.id ?? null,
    })
  }
  return '/cities'
}

/**
 * Get cafe identifier (place_id or id) for use in URLs.
 * Prefers place_id; falls back to id.
 *
 * @param cafe - Cafe object with place_id and/or id
 * @returns Identifier string, or null if neither is available
 */
export function getCafeIdentifier(cafe: {
  place_id?: string | null
  id?: string
}): string | null {
  if (cafe.place_id && assertCafeIdentifier(cafe.place_id)) return cafe.place_id
  if (cafe.id && assertCafeIdentifier(cafe.id)) return cafe.id
  return null
}

/**
 * Returns true when getCafeHref would produce a valid /cafe/... route.
 * Use for link integrity: disable card click and show "Unavailable" when false.
 */
export function hasValidCafeLink(cafe: {
  place_id?: string | null
  id?: string
}): boolean {
  return getCafeIdentifier(cafe) !== null
}

/**
 * Detail-fetch query config: which column to use for ChIJ... vs UUID.
 * Mirrors app/cafe/[id] getCafe logic for testing.
 */
export type DetailRouteQueryConfig = {
  queriedColumn: 'place_id' | 'id'
  isPlaceId: boolean
  param: string
}

/**
 * Derives query config for cafe detail fetch from route param.
 * ChIJ... => place_id; otherwise => id (UUID).
 *
 * @param param - Route param (place_id or id)
 * @returns Config, or null if param is invalid
 */
export function getDetailRouteQueryConfig(param: unknown): DetailRouteQueryConfig | null {
  if (param == null || typeof param !== 'string') return null
  const trimmed = param.trim()
  if (trimmed.length === 0) return null
  const isPlaceId = trimmed.startsWith('ChIJ')
  return {
    param: trimmed,
    queriedColumn: isPlaceId ? 'place_id' : 'id',
    isPlaceId,
  }
}
