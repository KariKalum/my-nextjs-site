-- Create photos table for cafe images
CREATE TABLE cafe_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  user_id UUID, -- Can reference auth.users if using Supabase Auth
  
  -- Image details
  url TEXT NOT NULL, -- Supabase Storage URL
  thumbnail_url TEXT,
  alt_text TEXT,
  
  -- Photo metadata
  photo_type VARCHAR(50), -- "exterior", "interior", "seating", "food", "workspace", "amenity"
  caption TEXT,
  
  -- Ordering and display
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false, -- Main image for cafe listing
  is_approved BOOLEAN DEFAULT true,
  
  -- Dimensions (optional)
  width INTEGER,
  height INTEGER,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_photos_cafe_id ON cafe_photos(cafe_id);
CREATE INDEX idx_photos_user_id ON cafe_photos(user_id);
CREATE INDEX idx_photos_is_primary ON cafe_photos(cafe_id, is_primary) WHERE is_primary = true;
CREATE INDEX idx_photos_is_approved ON cafe_photos(is_approved) WHERE is_approved = true;
CREATE INDEX idx_photos_display_order ON cafe_photos(cafe_id, display_order);

-- Trigger to update updated_at
CREATE TRIGGER update_photos_updated_at BEFORE UPDATE ON cafe_photos
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to ensure only one primary photo per cafe
CREATE OR REPLACE FUNCTION ensure_single_primary_photo()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = true THEN
    -- Unset other primary photos for this cafe
    UPDATE cafe_photos
    SET is_primary = false
    WHERE cafe_id = NEW.cafe_id
      AND id != NEW.id
      AND is_primary = true;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to ensure single primary photo
CREATE TRIGGER ensure_single_primary_photo_trigger
  BEFORE INSERT OR UPDATE ON cafe_photos
  FOR EACH ROW EXECUTE FUNCTION ensure_single_primary_photo();
