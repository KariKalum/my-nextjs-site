-- One-time script to find and fix localhost URLs in cafe data
-- Run this in Supabase SQL Editor or via migration

-- 1. Find all localhost URLs in cafe_photos table
SELECT 
  id,
  cafe_id,
  url,
  thumbnail_url,
  'cafe_photos' as table_name
FROM cafe_photos
WHERE url LIKE '%127.0.0.1%' 
   OR url LIKE '%localhost%'
   OR thumbnail_url LIKE '%127.0.0.1%'
   OR thumbnail_url LIKE '%localhost%';

-- 2. Find all localhost URLs in cafes.website
SELECT 
  id,
  name,
  website,
  'cafes.website' as table_name
FROM cafes
WHERE website LIKE '%127.0.0.1%' 
   OR website LIKE '%localhost%';

-- 3. Fix cafe_photos: Set localhost URLs to NULL
UPDATE cafe_photos
SET 
  url = NULL,
  updated_at = NOW()
WHERE url LIKE '%127.0.0.1%' OR url LIKE '%localhost%';

UPDATE cafe_photos
SET 
  thumbnail_url = NULL,
  updated_at = NOW()
WHERE thumbnail_url LIKE '%127.0.0.1%' OR thumbnail_url LIKE '%localhost%';

-- 4. Fix cafes.website: Set localhost URLs to NULL
UPDATE cafes
SET 
  website = NULL,
  updated_at = NOW()
WHERE website LIKE '%127.0.0.1%' OR website LIKE '%localhost%';

-- 5. Verify fix (should return 0 rows)
SELECT COUNT(*) as remaining_localhost_urls
FROM (
  SELECT url FROM cafe_photos WHERE url LIKE '%127.0.0.1%' OR url LIKE '%localhost%'
  UNION ALL
  SELECT thumbnail_url FROM cafe_photos WHERE thumbnail_url LIKE '%127.0.0.1%' OR thumbnail_url LIKE '%localhost%'
  UNION ALL
  SELECT website FROM cafes WHERE website LIKE '%127.0.0.1%' OR website LIKE '%localhost%'
) as all_urls;
