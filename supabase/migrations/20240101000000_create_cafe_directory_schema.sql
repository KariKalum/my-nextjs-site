-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create cafes table
CREATE TABLE cafes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(50),
  zip_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'US',
  
  -- Contact information
  phone VARCHAR(20),
  email VARCHAR(255),
  website VARCHAR(255),
  
  -- Location (PostGIS for geospatial queries)
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location GEOGRAPHY(POINT, 4326),
  
  -- Laptop-friendly attributes
  wifi_available BOOLEAN DEFAULT true,
  wifi_speed_rating INTEGER CHECK (wifi_speed_rating >= 1 AND wifi_speed_rating <= 5), -- 1-5 scale
  wifi_password_required BOOLEAN DEFAULT true,
  wifi_password TEXT,
  
  power_outlets_available BOOLEAN DEFAULT false,
  power_outlet_rating INTEGER CHECK (power_outlet_rating >= 1 AND power_outlet_rating <= 5), -- 1-5 scale
  
  seating_capacity INTEGER DEFAULT 0,
  comfortable_seating BOOLEAN DEFAULT false,
  seating_variety TEXT, -- e.g., "tables, couches, bar seating"
  
  noise_level VARCHAR(20) CHECK (noise_level IN ('quiet', 'moderate', 'loud', 'variable')),
  music_type TEXT,
  conversation_friendly BOOLEAN DEFAULT true,
  
  -- Workspace attributes
  table_space_rating INTEGER CHECK (table_space_rating >= 1 AND table_space_rating <= 5), -- 1-5 scale
  natural_light BOOLEAN DEFAULT false,
  lighting_rating INTEGER CHECK (lighting_rating >= 1 AND lighting_rating <= 5), -- 1-5 scale
  
  -- Business hours (stored as JSONB for flexibility)
  hours JSONB,
  
  -- Time limits and policies
  time_limit_minutes INTEGER, -- NULL = no limit
  reservation_required BOOLEAN DEFAULT false,
  laptop_policy TEXT, -- e.g., "unlimited", "peak hours only", "restricted"
  
  -- Amenities
  parking_available BOOLEAN DEFAULT false,
  parking_type TEXT, -- "street", "lot", "garage", "free", "paid"
  accessible BOOLEAN DEFAULT false,
  pet_friendly BOOLEAN DEFAULT false,
  outdoor_seating BOOLEAN DEFAULT false,
  
  -- Ratings and popularity
  overall_laptop_rating DECIMAL(3, 2) CHECK (overall_laptop_rating >= 1.0 AND overall_laptop_rating <= 5.0),
  total_reviews INTEGER DEFAULT 0,
  total_visits INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_cafes_location ON cafes USING GIST(location);
CREATE INDEX idx_cafes_city ON cafes(city);
CREATE INDEX idx_cafes_country ON cafes(country);
CREATE INDEX idx_cafes_wifi_available ON cafes(wifi_available);
CREATE INDEX idx_cafes_power_outlets ON cafes(power_outlets_available);
CREATE INDEX idx_cafes_is_active ON cafes(is_active);
CREATE INDEX idx_cafes_overall_rating ON cafes(overall_laptop_rating DESC);
CREATE INDEX idx_cafes_created_at ON cafes(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_cafes_updated_at BEFORE UPDATE ON cafes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create geography point from lat/lng
CREATE OR REPLACE FUNCTION update_cafe_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update location geography
CREATE TRIGGER update_cafe_location_trigger BEFORE INSERT OR UPDATE ON cafes
FOR EACH ROW EXECUTE FUNCTION update_cafe_location();
