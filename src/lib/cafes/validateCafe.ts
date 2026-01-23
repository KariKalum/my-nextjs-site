/**
 * Database-facing validation layer for cafe records.
 * Use when ingesting or normalizing data (e.g. bulk import, API responses).
 * Asserts required fields and normalizes optional ones to prevent broken links and UI crashes.
 */

export type ValidatedCafe = {
  id: string
  place_id: string | null
  name: string
  is_active: boolean | null
  [key: string]: unknown
}

const NAME_FALLBACK = 'Unknown Cafe'

/**
 * Validates a raw DB-like cafe row.
 * - Asserts `id` exists (throws if missing).
 * - Ensures `place_id` is string or null.
 * - Ensures `name` is string; uses "Unknown Cafe" if missing/invalid.
 * - Ensures `is_active` is boolean or null.
 *
 * @param row - Raw record (e.g. from Supabase)
 * @returns Validated, normalized object
 * @throws Error if `id` is missing or invalid
 */
export function validateCafe(row: unknown): ValidatedCafe {
  if (row === null || typeof row !== 'object') {
    throw new Error('validateCafe: row must be a non-null object')
  }

  const r = row as Record<string, unknown>

  const id = r.id
  if (id == null || typeof id !== 'string' || id.trim().length === 0) {
    throw new Error('validateCafe: id is required and must be a non-empty string')
  }

  let place_id: string | null = null
  if (r.place_id != null) {
    if (typeof r.place_id !== 'string') {
      throw new Error('validateCafe: place_id must be a string when present')
    }
    const t = (r.place_id as string).trim()
    place_id = t.length > 0 ? t : null
  }

  let name: string
  if (typeof r.name === 'string' && r.name.trim().length > 0) {
    name = r.name.trim()
  } else {
    name = NAME_FALLBACK
  }

  let is_active: boolean | null = null
  if (r.is_active !== undefined && r.is_active !== null) {
    if (typeof r.is_active !== 'boolean') {
      throw new Error('validateCafe: is_active must be boolean or null when present')
    }
    is_active = r.is_active
  }

  return {
    ...r,
    id: id.trim(),
    place_id,
    name,
    is_active,
  } as ValidatedCafe
}

/**
 * Safe variant: returns null instead of throwing.
 * Use when validation failures should not abort the pipeline.
 */
export function validateCafeOrNull(row: unknown): ValidatedCafe | null {
  try {
    return validateCafe(row)
  } catch {
    return null
  }
}
