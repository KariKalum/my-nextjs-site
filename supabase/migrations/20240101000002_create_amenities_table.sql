-- Create amenities lookup table
CREATE TABLE amenities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(50), -- "food", "drink", "workspace", "comfort", "accessibility"
  icon VARCHAR(50), -- Icon name or emoji
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create junction table for cafe amenities (many-to-many)
CREATE TABLE cafe_amenities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  amenity_id UUID NOT NULL REFERENCES amenities(id) ON DELETE CASCADE,
  is_available BOOLEAN DEFAULT true,
  notes TEXT, -- Additional details about this amenity at this cafe
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(cafe_id, amenity_id)
);

-- Create indexes
CREATE INDEX idx_cafe_amenities_cafe_id ON cafe_amenities(cafe_id);
CREATE INDEX idx_cafe_amenities_amenity_id ON cafe_amenities(amenity_id);
CREATE INDEX idx_cafe_amenities_available ON cafe_amenities(is_available) WHERE is_available = true;

-- Insert common amenities
INSERT INTO amenities (name, category, icon, description) VALUES
  ('Free WiFi', 'workspace', '📶', 'Complimentary wireless internet'),
  ('Power Outlets', 'workspace', '🔌', 'Electrical outlets for charging devices'),
  ('Quiet Space', 'workspace', '🔇', 'Designated quiet area for focused work'),
  ('Outdoor Seating', 'comfort', '🌳', 'Seating available outside'),
  ('Air Conditioning', 'comfort', '❄️', 'Climate controlled environment'),
  ('Free Parking', 'accessibility', '🅿️', 'Complimentary parking available'),
  ('Wheelchair Accessible', 'accessibility', '♿', 'Accessible for wheelchair users'),
  ('Pet Friendly', 'comfort', '🐾', 'Pets are welcome'),
  ('Vegetarian Options', 'food', '🌱', 'Vegetarian menu items available'),
  ('Vegan Options', 'food', '🥗', 'Vegan menu items available'),
  ('Gluten-Free Options', 'food', '🌾', 'Gluten-free menu items available'),
  ('Coffee Roasting', 'drink', '☕', 'Coffee roasted on-site'),
  ('Specialty Drinks', 'drink', '🥤', 'Unique beverage menu'),
  ('Pastries', 'food', '🥐', 'Fresh pastries and baked goods'),
  ('Full Kitchen', 'food', '🍽️', 'Full meal menu available'),
  ('Extended Hours', 'workspace', '🕐', 'Open late or early'),
  ('Meeting Space', 'workspace', '👥', 'Dedicated area for meetings'),
  ('Printing/Scanning', 'workspace', '🖨️', 'Printing and scanning services'),
  ('Phone Booths', 'workspace', '📞', 'Private phone booths available'),
  ('Standing Desks', 'workspace', '🪑', 'Standing desk options');
