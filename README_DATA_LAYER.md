# Data Layer Implementation Summary

## Overview
This document describes the data-layer changes implemented for the homepage UI/UX updates.

---

## A) Major Cities

### Database Migration
**File**: `supabase/migrations/20240115000000_create_cities_table.sql`

- Creates `cities` table with:
  - `id` (UUID, primary key)
  - `name` (VARCHAR(100), unique)
  - `slug` (VARCHAR(100), unique)
  - `image_url` (TEXT, nullable)
  - `is_major` (BOOLEAN, default false)
  - `display_order` (INTEGER, default 0)
  - Timestamps (`created_at`, `updated_at`)

- Pre-populates 6 major German cities (Berlin, Hamburg, Munich, Cologne, Frankfurt, Leipzig)
- Enables RLS with public read access
- Creates indexes for performance

### Server Functions
**File**: `src/lib/cafes/cities.ts`

#### `getMajorCitiesWithCounts()`
- Fetches cities where `is_major = true`
- Orders by `display_order`
- Joins with `cafes` table to count cafés per city
- Returns `CityWithCount[]` with café counts

#### `getTopCitiesByCount(limit: number = 10)`
- Aggregates café counts by city from `cafes` table
- Orders by count (desc), then by name (asc) for ties
- Returns top N cities

### Usage
```typescript
import { getMajorCitiesWithCounts, getTopCitiesByCount } from '@/src/lib/cafes/cities'

// In server component
const majorCities = await getMajorCitiesWithCounts()
const topCities = await getTopCitiesByCount(10)
```

---

## B) Lists (Top Rated & Recently Added)

### Server Functions
**File**: `src/lib/cafes/homepage.ts`

#### `getTopRatedCafes(limit: number = 10)`
- Orders by `work_score` (desc)
- Tie-breaker: `google_rating` (desc), then `google_ratings_total` (desc)
- Filters: `is_active IS NULL OR is_active = true`
- Excludes null `work_score`
- Returns `Cafe[]` with `descriptionText` computed

#### `getRecentlyAddedCafes(limit: number = 10)`
- Orders by `created_at` (desc)
- Filters: `is_active IS NULL OR is_active = true`
- Returns `Cafe[]` with `descriptionText` computed

### Updated Component
**File**: `components/home/HomepageData.tsx`

- Now uses functions from `src/lib/cafes/homepage.ts`
- Fetches 10 items per section (UI slices to 5 for mobile)
- **Reordered**: Top Rated first, then Recently Added

### Usage
```typescript
import { getTopRatedCafes, getRecentlyAddedCafes } from '@/src/lib/cafes/homepage'

// In server component
const topRated = await getTopRatedCafes(10)
const recentlyAdded = await getRecentlyAddedCafes(10)
```

---

## C) Work Score Bug Fix

### Updated Formatter
**File**: `lib/utils/cafe-formatters.ts`

#### `formatWorkScore(workScore: number | null | undefined): string | null`

**Standardized behavior:**
- Always displays as `X.X/10` (one decimal)
- If stored as 0-100: divides by 10 (72 → 7.2/10)
- If stored as 0-10: shows as-is (7.2 → 7.2/10)
- Returns `null` if input is null/undefined

**Example outputs:**
- `72` → `"7.2/10"`
- `7.2` → `"7.2/10"`
- `null` → `null`

### Fixed Components
- ✅ `components/CafeCard.tsx` - Now uses `formatWorkScore()`
- ✅ `components/CafeDetailSEO.tsx` - Already using `formatWorkScore()`
- ✅ `components/LaptopFriendlyIndicators.tsx` - Uses `/100` format (detail page, acceptable)

### Usage
```typescript
import { formatWorkScore } from '@/lib/utils/cafe-formatters'

// In component
{formatWorkScore(cafe.work_score) && (
  <span>Work Score: {formatWorkScore(cafe.work_score)}</span>
)}
```

---

## D) Feature Pages (Nearby + Feature Filter)

### API Endpoint
**File**: `app/api/cafes/nearby-feature/route.ts`

#### `GET /api/cafes/nearby-feature`

**Query Parameters:**
- `lat` (required): Latitude (-90 to 90)
- `lng` (required): Longitude (-180 to 180)
- `feature` (required): One of `wifi`, `outlets`, `quiet`, `time-limit`
- `radius` (optional): Search radius in meters (default: 5000, max: 20000)
- `limit` (optional): Max results (default: 50, max: 100)

**Feature Filters:**
- `wifi`: `ai_wifi_quality IS NOT NULL AND != 'unknown' AND != ''`
- `outlets`: `ai_power_outlets IS NOT NULL AND != 'unknown' AND != ''`
- `quiet`: `ai_noise_level IN ('quiet', 'moderate')`
- `time-limit`: `ai_laptop_policy IS NOT NULL AND != 'unknown' AND != '' AND ILIKE '%unlimited%'`

**Performance:**
- Uses bounding box pre-filter (PostGIS-style)
- Computes precise Haversine distance for results
- Sorts by distance (ascending)
- Caches responses for 60s

**Response:**
```json
{
  "center": { "lat": 52.5200, "lng": 13.4050 },
  "radius": 5000,
  "feature": "wifi",
  "cafes": [
    {
      "id": "...",
      "place_id": "...",
      "name": "...",
      "city": "...",
      "address": "...",
      "lat": 52.5210,
      "lng": 13.4060,
      "distance": 1234,
      "workScore": 72,
      "createdAt": "..."
    }
  ]
}
```

### Usage
```typescript
// Client-side fetch
const response = await fetch(
  `/api/cafes/nearby-feature?lat=${lat}&lng=${lng}&feature=wifi&radius=5000&limit=20`
)
const data = await response.json()
```

---

## Type Updates

### New Types
**File**: `src/lib/supabase/types.ts`

- Added `City` interface matching `cities` table schema

### Extended Types
**File**: `src/lib/cafes/cities.ts`

- `CityWithCount`: City data + café count
- `TopCity`: City name + count

---

## Database Indexes

### Existing (from migrations)
- `idx_cafes_location` (GIST on `location`)
- `idx_cafes_city` (on `city`)
- `idx_cafes_is_active` (on `is_active`)
- `idx_cafes_created_at` (on `created_at` DESC)

### New (from cities migration)
- `idx_cities_slug` (on `slug`)
- `idx_cities_is_major` (on `is_major`)
- `idx_cities_display_order` (on `display_order`)

### Recommended (if not exists)
- `idx_cafes_work_score` (on `work_score` DESC) - for top rated queries
- `idx_cafes_ai_wifi_quality` (on `ai_wifi_quality`) - for feature filters
- `idx_cafes_ai_power_outlets` (on `ai_power_outlets`) - for feature filters
- `idx_cafes_ai_noise_level` (on `ai_noise_level`) - for feature filters

---

## Testing Strategy

### Manual Testing
1. **Cities**: Verify major cities appear with counts
2. **Top Cities**: Verify top N cities by count
3. **Top Rated**: Verify ordering (work_score → google_rating → google_ratings_total)
4. **Recently Added**: Verify ordering by `created_at` DESC
5. **Work Score**: Verify display format (7.2/10) across all components
6. **Feature API**: Test all 4 features with valid lat/lng

### Seed Data (Optional)
If you have a seed script, ensure:
- At least 6 cities in `cities` table with `is_major = true`
- Cafés with various `work_score` values (0-100 range)
- Cafés with feature data (`ai_wifi_quality`, `ai_power_outlets`, etc.)

---

## Migration Instructions

1. **Apply cities migration:**
   ```bash
   # Via Supabase CLI
   supabase db push
   
   # Or via Dashboard SQL Editor
   # Run: supabase/migrations/20240115000000_create_cities_table.sql
   ```

2. **Verify migration:**
   ```sql
   SELECT * FROM cities WHERE is_major = true ORDER BY display_order;
   ```

3. **Update city images (optional):**
   ```sql
   UPDATE cities SET image_url = 'https://...' WHERE slug = 'berlin';
   ```

---

## Endpoints/Functions Summary

### Server Functions (import from `@/src/lib/cafes/...`)
- `getMajorCitiesWithCounts()` - Major cities with café counts
- `getTopCitiesByCount(limit)` - Top N cities by café count
- `getTopRatedCafes(limit)` - Top rated cafés (work_score)
- `getRecentlyAddedCafes(limit)` - Recently added cafés

### API Endpoints
- `GET /api/cafes/nearby-feature?lat=&lng=&feature=&radius=&limit=` - Feature-filtered nearby cafés

### Utilities
- `formatWorkScore(workScore)` - Standardized work score formatter

---

## UI Integration Notes

### Homepage
- `components/home/FeaturedCities.tsx` - Use `getMajorCitiesWithCounts()`
- `components/home/HomepageData.tsx` - Already updated to use new functions
- `components/CafeCard.tsx` - Already fixed to use `formatWorkScore()`

### Feature Pages (to be created)
- Use `GET /api/cafes/nearby-feature` with user's location
- Filter by feature: `wifi`, `outlets`, `quiet`, `time-limit`

---

## Performance Considerations

1. **Bounding Box Pre-filter**: Feature API uses bounding box before Haversine calculation
2. **Query Limits**: All queries have reasonable limits (10-100 items)
3. **Caching**: Feature API responses cached for 60s
4. **Indexes**: Ensure indexes exist on frequently queried columns

---

## Safety & Validation

- ✅ All queries use parameterized inputs (Supabase client)
- ✅ Input validation on API endpoints (lat/lng ranges, feature enum)
- ✅ Safe defaults in migrations (ON CONFLICT DO NOTHING)
- ✅ RLS policies enabled for cities table
- ✅ Error handling in all functions
- ✅ Type safety with TypeScript interfaces
