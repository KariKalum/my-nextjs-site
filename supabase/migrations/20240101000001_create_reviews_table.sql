-- Create reviews table for café laptop-friendliness reviews
CREATE TABLE cafe_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  user_id UUID, -- Can be NULL for anonymous reviews, or reference auth.users if using Supabase Auth
  
  -- Rating breakdown
  overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  wifi_rating INTEGER CHECK (wifi_rating >= 1 AND wifi_rating <= 5),
  outlet_rating INTEGER CHECK (outlet_rating >= 1 AND outlet_rating <= 5),
  seating_rating INTEGER CHECK (seating_rating >= 1 AND seating_rating <= 5),
  noise_rating INTEGER CHECK (noise_rating >= 1 AND noise_rating <= 5),
  lighting_rating INTEGER CHECK (lighting_rating >= 1 AND lighting_rating <= 5),
  
  -- Review details
  title VARCHAR(255),
  comment TEXT,
  
  -- Visit details
  visit_date DATE,
  visit_duration_minutes INTEGER,
  time_of_day VARCHAR(20), -- "morning", "afternoon", "evening", "night"
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday
  
  -- Verification
  is_verified_visit BOOLEAN DEFAULT false,
  
  -- Helpfulness
  helpful_count INTEGER DEFAULT 0,
  
  -- Status
  is_approved BOOLEAN DEFAULT true,
  is_flagged BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_reviews_cafe_id ON cafe_reviews(cafe_id);
CREATE INDEX idx_reviews_user_id ON cafe_reviews(user_id);
CREATE INDEX idx_reviews_overall_rating ON cafe_reviews(overall_rating);
CREATE INDEX idx_reviews_created_at ON cafe_reviews(created_at DESC);
CREATE INDEX idx_reviews_is_approved ON cafe_reviews(is_approved) WHERE is_approved = true;

-- Trigger to update updated_at
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON cafe_reviews
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update cafe ratings when review is added/updated/deleted
CREATE OR REPLACE FUNCTION update_cafe_ratings()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating DECIMAL;
  review_count INTEGER;
BEGIN
  -- Calculate average rating for the cafe
  SELECT 
    AVG(overall_rating)::DECIMAL(3, 2),
    COUNT(*)
  INTO avg_rating, review_count
  FROM cafe_reviews
  WHERE cafe_id = COALESCE(NEW.cafe_id, OLD.cafe_id)
    AND is_approved = true;
  
  -- Update the cafe's overall rating and review count
  UPDATE cafes
  SET 
    overall_laptop_rating = avg_rating,
    total_reviews = review_count,
    updated_at = NOW()
  WHERE id = COALESCE(NEW.cafe_id, OLD.cafe_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Triggers to update cafe ratings
CREATE TRIGGER update_cafe_ratings_on_insert
  AFTER INSERT ON cafe_reviews
  FOR EACH ROW EXECUTE FUNCTION update_cafe_ratings();

CREATE TRIGGER update_cafe_ratings_on_update
  AFTER UPDATE ON cafe_reviews
  FOR EACH ROW EXECUTE FUNCTION update_cafe_ratings();

CREATE TRIGGER update_cafe_ratings_on_delete
  AFTER DELETE ON cafe_reviews
  FOR EACH ROW EXECUTE FUNCTION update_cafe_ratings();
