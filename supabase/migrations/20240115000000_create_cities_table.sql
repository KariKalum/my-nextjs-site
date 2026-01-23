-- Create cities table for major cities with images and metadata
-- Minimal impact: single table with is_major flag (Option 1)

CREATE TABLE IF NOT EXISTS cities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  image_url TEXT,
  is_major BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cities_slug ON cities(slug);
CREATE INDEX IF NOT EXISTS idx_cities_is_major ON cities(is_major);
CREATE INDEX IF NOT EXISTS idx_cities_display_order ON cities(display_order);

-- Trigger to auto-update updated_at
CREATE TRIGGER update_cities_updated_at BEFORE UPDATE ON cities
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert major German cities (safe defaults, can be updated later)
INSERT INTO cities (name, slug, is_major, display_order) VALUES
  ('Berlin', 'berlin', true, 1),
  ('Hamburg', 'hamburg', true, 2),
  ('Munich', 'munich', true, 3),
  ('Cologne', 'cologne', true, 4),
  ('Frankfurt', 'frankfurt', true, 5),
  ('Leipzig', 'leipzig', true, 6)
ON CONFLICT (slug) DO NOTHING;

-- Enable RLS (public read access)
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access
CREATE POLICY "Cities are viewable by everyone"
  ON cities FOR SELECT
  USING (true);
