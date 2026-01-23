import { describe, it, expect } from 'vitest'
import { validateCafe, validateCafeOrNull } from '@/src/lib/cafes/validateCafe'

describe('validateCafe', () => {
  it('asserts id exists and throws when missing', () => {
    expect(() => validateCafe({ name: 'x' })).toThrow('validateCafe: id is required')
    expect(() => validateCafe({ id: null })).toThrow('validateCafe: id is required')
    expect(() => validateCafe({ id: '' })).toThrow('validateCafe: id is required')
    expect(() => validateCafe({ id: '  ' })).toThrow('validateCafe: id is required')
  })

  it('accepts valid id and normalizes name', () => {
    const out = validateCafe({ id: 'uuid-1', name: '  Cool Cafe  ' })
    expect(out.id).toBe('uuid-1')
    expect(out.name).toBe('Cool Cafe')
  })

  it('fallback "Unknown Cafe" when name missing', () => {
    const out = validateCafe({ id: 'uuid-1' })
    expect(out.name).toBe('Unknown Cafe')
  })

  it('fallback "Unknown Cafe" when name empty or whitespace', () => {
    expect(validateCafe({ id: 'u' }).name).toBe('Unknown Cafe')
    expect(validateCafe({ id: 'u', name: '' }).name).toBe('Unknown Cafe')
    expect(validateCafe({ id: 'u', name: '  ' }).name).toBe('Unknown Cafe')
  })

  it('place_id must be string when present', () => {
    expect(() => validateCafe({ id: 'u', place_id: 123 })).toThrow('place_id must be a string')
  })

  it('normalizes place_id to null when empty string', () => {
    const out = validateCafe({ id: 'u', place_id: '  ' })
    expect(out.place_id).toBe(null)
  })

  it('is_active can be null or boolean', () => {
    const a = validateCafe({ id: 'u' })
    expect(a.is_active).toBe(null)
    const b = validateCafe({ id: 'u', is_active: true })
    expect(b.is_active).toBe(true)
    const c = validateCafe({ id: 'u', is_active: false })
    expect(c.is_active).toBe(false)
  })

  it('throws when row is null or not object', () => {
    expect(() => validateCafe(null)).toThrow('row must be a non-null object')
    expect(() => validateCafe(undefined)).toThrow()
  })
})

describe('validateCafeOrNull', () => {
  it('returns validated cafe when valid', () => {
    const out = validateCafeOrNull({ id: 'u', name: 'x' })
    expect(out).not.toBeNull()
    expect(out!.id).toBe('u')
    expect(out!.name).toBe('x')
  })

  it('returns null when validation throws', () => {
    expect(validateCafeOrNull({})).toBeNull()
    expect(validateCafeOrNull(null)).toBeNull()
  })
})
