# Café Directory - Supabase Schema

A comprehensive Supabase database schema for a café directory website focused on laptop-friendly workspaces.

## Overview

This schema is designed to help users find cafés that are suitable for working with laptops, with detailed attributes for:
- WiFi quality and availability
- Power outlet availability and rating
- Seating comfort and capacity
- Noise levels and work environment
- Lighting and ambiance
- Time limits and laptop policies
- Additional amenities and accessibility features

## Schema Structure

### Core Tables

1. **cafes** - Main café information with comprehensive laptop-friendly attributes
2. **cafe_reviews** - User reviews with detailed ratings for laptop-friendliness
3. **amenities** - Lookup table for café amenities
4. **cafe_amenities** - Junction table linking cafes to amenities (many-to-many)
5. **cafe_visits** - User check-ins and visit tracking
6. **cafe_photos** - Image storage for cafés

### Key Features

- **Geospatial Support**: Uses PostGIS for location-based queries (find cafés near you)
- **Automatic Rating Calculation**: Triggers automatically update café ratings when reviews are added
- **Flexible Business Hours**: Stored as JSONB for complex scheduling
- **Comprehensive Attributes**: Ratings for WiFi, outlets, seating, noise, and lighting
- **Review System**: Detailed reviews with breakdown by category
- **Visit Tracking**: Track user visits and check-ins

## Setup Instructions

### Prerequisites

- Supabase project (create one at [supabase.com](https://supabase.com))
- Supabase CLI (optional, for local development)

### Apply Migrations

#### Option 1: Using Supabase CLI

1. Initialize Supabase in your project (if not already done):
   ```bash
   supabase init
   ```

2. Link to your Supabase project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

3. Apply migrations:
   ```bash
   supabase db push
   ```

#### Option 2: Using Supabase Dashboard

1. Open your Supabase project dashboard
2. Navigate to SQL Editor
3. Run each migration file in order:
   - `20240101000000_create_cafe_directory_schema.sql`
   - `20240101000001_create_reviews_table.sql`
   - `20240101000002_create_amenities_table.sql`
   - `20240101000003_create_visits_table.sql`
   - `20240101000004_create_photos_table.sql`

### Enable PostGIS Extension

If PostGIS is not automatically enabled, run this in the SQL Editor:
```sql
CREATE EXTENSION IF NOT EXISTS "postgis";
```

## Key Attributes for Laptop-Friendliness

### WiFi
- `wifi_available` - Boolean
- `wifi_speed_rating` - Integer (1-5)
- `wifi_password_required` - Boolean
- `wifi_password` - Text (can be stored encrypted)

### Power Outlets
- `power_outlets_available` - Boolean
- `power_outlet_rating` - Integer (1-5)

### Seating & Space
- `seating_capacity` - Integer
- `comfortable_seating` - Boolean
- `table_space_rating` - Integer (1-5)
- `seating_variety` - Text

### Environment
- `noise_level` - Enum: 'quiet', 'moderate', 'loud', 'variable'
- `conversation_friendly` - Boolean
- `lighting_rating` - Integer (1-5)
- `natural_light` - Boolean

### Policies
- `time_limit_minutes` - Integer (NULL = no limit)
- `laptop_policy` - Text

## Sample Queries

### Find cafés with good WiFi and outlets near a location
```sql
SELECT 
  name,
  address,
  wifi_speed_rating,
  power_outlet_rating,
  overall_laptop_rating,
  ST_Distance(location, ST_SetSRID(ST_MakePoint(-122.4194, 37.7749), 4326)::geography) / 1000 AS distance_km
FROM cafes
WHERE wifi_available = true
  AND wifi_speed_rating >= 4
  AND power_outlets_available = true
  AND power_outlet_rating >= 4
  AND is_active = true
ORDER BY location <-> ST_SetSRID(ST_MakePoint(-122.4194, 37.7749), 4326)::geography
LIMIT 10;
```

### Get cafés with highest laptop ratings
```sql
SELECT 
  name,
  city,
  overall_laptop_rating,
  total_reviews,
  wifi_speed_rating,
  power_outlet_rating,
  noise_level
FROM cafes
WHERE is_active = true
  AND overall_laptop_rating IS NOT NULL
ORDER BY overall_laptop_rating DESC, total_reviews DESC
LIMIT 20;
```

### Find quiet cafés with no time limit
```sql
SELECT 
  name,
  address,
  noise_level,
  time_limit_minutes,
  overall_laptop_rating
FROM cafes
WHERE noise_level = 'quiet'
  AND (time_limit_minutes IS NULL OR time_limit_minutes = 0)
  AND is_active = true
ORDER BY overall_laptop_rating DESC NULLS LAST;
```

## Next Steps

- Set up Row Level Security (RLS) policies for authenticated users
- Configure Supabase Storage buckets for café photos
- Create API endpoints or use Supabase client libraries
- Set up real-time subscriptions for new reviews/visits
- Add full-text search capabilities for café names and descriptions

## License

This schema is provided as-is for use in your café directory project.
