-- Supabase Schema for Café Directory
-- This file contains the complete schema for reference
-- Run migrations in order: 20240101000000, 20240101000001, 20240101000002, 20240101000003, 20240101000004

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- See individual migration files for table definitions:
-- - cafes: Main café information with laptop-friendly attributes
-- - cafe_reviews: User reviews focusing on laptop-friendliness
-- - amenities: Lookup table for café amenities
-- - cafe_amenities: Junction table linking cafes to amenities
-- - cafe_visits: User check-ins and visit tracking
-- - cafe_photos: Image storage for cafés

-- Key laptop-friendly attributes in cafes table:
-- - wifi_available, wifi_speed_rating, wifi_password_required
-- - power_outlets_available, power_outlet_rating
-- - seating_capacity, comfortable_seating, table_space_rating
-- - noise_level, conversation_friendly
-- - lighting_rating, natural_light
-- - time_limit_minutes, laptop_policy
-- - overall_laptop_rating (calculated from reviews)

-- To apply migrations:
-- 1. Copy migration files to your Supabase project's migrations folder
-- 2. Run them in order using Supabase CLI: supabase db reset
--    Or apply individually via Supabase Dashboard SQL editor
