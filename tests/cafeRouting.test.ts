import { describe, it, expect } from 'vitest'
import {
  getCafeHref,
  getCafeIdentifier,
  hasValidCafeLink,
  getDetailRouteQueryConfig,
} from '@/lib/cafeRouting'

describe('getCafeHref', () => {
  it('prefers place_id when present and valid', () => {
    const cafe = { place_id: 'ChIJxxx', id: 'uuid-1' }
    expect(getCafeHref(cafe)).toBe('/cafe/ChIJxxx')
  })

  it('falls back to id when place_id is missing', () => {
    const cafe = { id: 'uuid-1' }
    expect(getCafeHref(cafe)).toBe('/cafe/uuid-1')
  })

  it('falls back to id when place_id is null', () => {
    const cafe = { place_id: null, id: 'uuid-2' }
    expect(getCafeHref(cafe)).toBe('/cafe/uuid-2')
  })

  it('falls back to id when place_id is empty string', () => {
    const cafe = { place_id: '  ', id: 'uuid-3' }
    expect(getCafeHref(cafe)).toBe('/cafe/uuid-3')
  })

  it('returns /cities (safe fallback) when both place_id and id missing', () => {
    expect(getCafeHref({})).toBe('/cities')
  })

  it('returns /cities when both place_id and id are null/empty', () => {
    expect(getCafeHref({ place_id: null, id: '' })).toBe('/cities')
    expect(getCafeHref({ place_id: '', id: undefined })).toBe('/cities')
  })

  it('always returns a valid path (never throws)', () => {
    expect(() => getCafeHref({})).not.toThrow()
    expect(() => getCafeHref({ place_id: null, id: undefined })).not.toThrow()
  })
})

describe('getCafeIdentifier', () => {
  it('returns place_id when valid', () => {
    expect(getCafeIdentifier({ place_id: 'ChIJyyy', id: 'u' })).toBe('ChIJyyy')
  })

  it('returns id when place_id missing', () => {
    expect(getCafeIdentifier({ id: 'uuid-x' })).toBe('uuid-x')
  })

  it('returns null when both missing', () => {
    expect(getCafeIdentifier({})).toBe(null)
    expect(getCafeIdentifier({ place_id: null, id: '' })).toBe(null)
  })
})

describe('hasValidCafeLink', () => {
  it('returns true when place_id or id is valid', () => {
    expect(hasValidCafeLink({ place_id: 'ChIJz', id: 'u' })).toBe(true)
    expect(hasValidCafeLink({ id: 'uuid' })).toBe(true)
  })

  it('returns false when both missing or invalid', () => {
    expect(hasValidCafeLink({})).toBe(false)
    expect(hasValidCafeLink({ place_id: null, id: '' })).toBe(false)
  })
})

describe('getDetailRouteQueryConfig (integration-ish: detail fetch column selection)', () => {
  it('selects place_id column for ChIJ... param', () => {
    const config = getDetailRouteQueryConfig('ChIJN1t_tDeuEmsRUsoyG83frY4')
    expect(config).not.toBeNull()
    expect(config!.queriedColumn).toBe('place_id')
    expect(config!.isPlaceId).toBe(true)
    expect(config!.param).toBe('ChIJN1t_tDeuEmsRUsoyG83frY4')
  })

  it('selects id column for UUID-like param', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000'
    const config = getDetailRouteQueryConfig(uuid)
    expect(config).not.toBeNull()
    expect(config!.queriedColumn).toBe('id')
    expect(config!.isPlaceId).toBe(false)
    expect(config!.param).toBe(uuid)
  })

  it('selects id column for arbitrary non-ChIJ string', () => {
    const config = getDetailRouteQueryConfig('some-slug-123')
    expect(config).not.toBeNull()
    expect(config!.queriedColumn).toBe('id')
    expect(config!.isPlaceId).toBe(false)
  })

  it('returns null for invalid param', () => {
    expect(getDetailRouteQueryConfig(null)).toBeNull()
    expect(getDetailRouteQueryConfig(undefined)).toBeNull()
    expect(getDetailRouteQueryConfig('')).toBeNull()
    expect(getDetailRouteQueryConfig('   ')).toBeNull()
    expect(getDetailRouteQueryConfig(123)).toBeNull()
  })

  it('trims param', () => {
    const config = getDetailRouteQueryConfig('  ChIJabc  ')
    expect(config).not.toBeNull()
    expect(config!.param).toBe('ChIJabc')
    expect(config!.queriedColumn).toBe('place_id')
  })
})
