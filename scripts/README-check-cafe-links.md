# Check Cafe Links

Optional **dry-run** script to verify that list-generated cafe URLs correspond to fetchable detail records. Uses **anon key only**; respects RLS.

## Run

```bash
npm run check-cafe-links
```

Requires `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Optional:

- `CHECK_CAFE_LINKS_LIMIT` – max cafes to check (default `100`)

## What it does

1. Fetches up to N cafes from `cafes` (anon client, `is_active` true or null).
2. For each cafe, computes `getCafeHref`. If href is `/cities`, counts as "no valid link".
3. Otherwise, verifies the detail record is fetchable (same query logic as `app/cafe/[id]`: place_id vs id).
4. Prints a summary: total checked, no link, fetchable, not fetchable, and up to 5 example not-fetchable URLs.

## Package scripts

| Script | Description |
|--------|-------------|
| `npm run test` | Run all Vitest tests once |
| `npm run test:unit` | Run tests in `tests/` |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run check-cafe-links` | Run link-integrity check (see above) |
