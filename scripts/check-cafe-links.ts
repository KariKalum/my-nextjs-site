/**
 * Optional dry-run script: verify that cafe list URLs correspond to fetchable records.
 * Uses anon key only; respects RLS. Run: npm run check-cafe-links
 *
 * Reads N cafes from Supabase, computes getCafeHref for each, and checks that
 * the target detail record is fetchable (same logic as app/cafe/[id]).
 */

import path from 'path'
import { config as loadEnv } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { getCafeHref, getCafeIdentifier, getDetailRouteQueryConfig } from '../lib/cafeRouting'

loadEnv({ path: path.resolve(process.cwd(), '.env.local') })

const N = parseInt(process.env.CHECK_CAFE_LINKS_LIMIT ?? '100', 10)
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Set in .env.local.')
  process.exit(1)
}

const supabase = createClient(url, anonKey)

type Row = { id: string; place_id: string | null }

async function isFetchable(identifier: string): Promise<boolean> {
  const config = getDetailRouteQueryConfig(identifier)
  if (!config) return false
  const { data, error } = await supabase
    .from('cafes')
    .select('id')
    .eq(config.queriedColumn, config.param)
    .or('is_active.is.null,is_active.eq.true')
    .single()
  return !error && !!data
}

async function main() {
  console.log(`Checking up to ${N} cafes (anon, RLS). Dry run.\n`)

  const { data: cafes, error } = await supabase
    .from('cafes')
    .select('id, place_id')
    .or('is_active.is.null,is_active.eq.true')
    .limit(N)

  if (error) {
    console.error('Failed to fetch cafes:', error.message)
    process.exit(1)
  }

  const rows = (cafes ?? []) as Row[]
  let noLink = 0
  let fetchable = 0
  let notFetchable = 0
  const notFetchableExamples: { id: string; href: string }[] = []

  for (const cafe of rows) {
    const href = getCafeHref(cafe)
    if (href === '/cities') {
      noLink++
      continue
    }
    const identifier = getCafeIdentifier(cafe)
    if (!identifier) {
      noLink++
      continue
    }
    const ok = await isFetchable(identifier)
    if (ok) fetchable++
    else {
      notFetchable++
      if (notFetchableExamples.length < 5) {
        notFetchableExamples.push({ id: cafe.id, href })
      }
    }
  }

  console.log('Summary:')
  console.log(`  Total checked: ${rows.length}`)
  console.log(`  No valid link (href /cities): ${noLink}`)
  console.log(`  Fetchable: ${fetchable}`)
  console.log(`  Not fetchable: ${notFetchable}`)
  if (notFetchableExamples.length > 0) {
    console.log('\n  Example not-fetchable (first 5):')
    notFetchableExamples.forEach(({ id, href }) => console.log(`    ${id} -> ${href}`))
  }
  console.log('')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
