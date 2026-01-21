# Fix Localhost URLs in Café Data

This guide explains how to identify and fix localhost URLs (127.0.0.1:7242) in your café database that are causing ERR_CONNECTION_REFUSED errors.

## Problem

Some café records contain localhost URLs in:
- `cafe_photos.url` and `cafe_photos.thumbnail_url` (image URLs)
- `cafes.website` (website URLs)

These URLs cause browser errors when trying to load resources.

## Solution

### Step 1: Identify Affected Records

Run the first two SELECT queries from `fix-localhost-urls.sql` in your Supabase SQL Editor to see which records are affected:

```sql
-- Find localhost URLs in cafe_photos
SELECT id, cafe_id, url, thumbnail_url
FROM cafe_photos
WHERE url LIKE '%127.0.0.1%' OR url LIKE '%localhost%'
   OR thumbnail_url LIKE '%127.0.0.1%' OR thumbnail_url LIKE '%localhost%';

-- Find localhost URLs in cafes.website
SELECT id, name, website
FROM cafes
WHERE website LIKE '%127.0.0.1%' OR website LIKE '%localhost%';
```

### Step 2: Fix the Data

Run the UPDATE statements from `fix-localhost-urls.sql` in your Supabase SQL Editor:

```sql
-- Fix cafe_photos
UPDATE cafe_photos
SET url = NULL, updated_at = NOW()
WHERE url LIKE '%127.0.0.1%' OR url LIKE '%localhost%';

UPDATE cafe_photos
SET thumbnail_url = NULL, updated_at = NOW()
WHERE thumbnail_url LIKE '%127.0.0.1%' OR thumbnail_url LIKE '%localhost%';

-- Fix cafes.website
UPDATE cafes
SET website = NULL, updated_at = NOW()
WHERE website LIKE '%127.0.0.1%' OR website LIKE '%localhost%';
```

### Step 3: Verify Fix

Run the verification query to confirm no localhost URLs remain:

```sql
SELECT COUNT(*) as remaining_localhost_urls
FROM (
  SELECT url FROM cafe_photos WHERE url LIKE '%127.0.0.1%' OR url LIKE '%localhost%'
  UNION ALL
  SELECT thumbnail_url FROM cafe_photos WHERE thumbnail_url LIKE '%127.0.0.1%' OR thumbnail_url LIKE '%localhost%'
  UNION ALL
  SELECT website FROM cafes WHERE website LIKE '%127.0.0.1%' OR website LIKE '%localhost%'
) as all_urls;
```

This should return `0` if all localhost URLs have been removed.

## Prevention

The following validations have been added to prevent future localhost URLs:

1. **Submissions API** (`/api/submissions`): Rejects localhost URLs in website field
2. **Admin Form** (`components/CafeForm.tsx`): Validates website URLs before saving
3. **Admin Submissions** (`app/admin/submissions/page.tsx`): Skips localhost URLs when approving submissions
4. **SEO Metadata** (`lib/seo/metadata.ts`): Filters out localhost image URLs, returns default image instead

## Testing

After running the fix:

1. Clear your browser cache
2. Reload the homepage
3. Check browser Console and Network tab
4. Verify no more `ERR_CONNECTION_REFUSED` errors for `127.0.0.1:7242`

## Alternative: Run Full Script

You can also run the entire `fix-localhost-urls.sql` script at once in Supabase SQL Editor. It includes:
- SELECT queries to identify issues
- UPDATE statements to fix them
- Verification query to confirm success
