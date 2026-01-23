/**
 * Structured, minimal logging. No output in production.
 * Use for debugging; never spam console.
 */

const isDev = process.env.NODE_ENV === 'development'

export function devLog(tag: string, data?: Record<string, unknown>): void {
  if (!isDev) return
  const payload = data ? { ...data } : {}
  console.log(`[${tag}]`, Object.keys(payload).length ? payload : '')
}

export function devWarn(tag: string, data?: Record<string, unknown>): void {
  if (!isDev) return
  const payload = data ? { ...data } : {}
  console.warn(`[${tag}]`, Object.keys(payload).length ? payload : '')
}
