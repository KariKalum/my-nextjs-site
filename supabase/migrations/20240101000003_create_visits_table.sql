-- Create visits table to track user check-ins and visits
CREATE TABLE cafe_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  user_id UUID, -- Can reference auth.users if using Supabase Auth
  
  -- Visit details
  visit_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  duration_minutes INTEGER,
  
  -- Visit context
  time_of_day VARCHAR(20), -- "morning", "afternoon", "evening", "night"
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  
  -- Quick feedback
  would_return BOOLEAN,
  recommended_for_work BOOLEAN,
  
  -- Notes
  notes TEXT,
  
  -- Status
  is_public BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_visits_cafe_id ON cafe_visits(cafe_id);
CREATE INDEX idx_visits_user_id ON cafe_visits(user_id);
CREATE INDEX idx_visits_visit_date ON cafe_visits(visit_date DESC);
CREATE INDEX idx_visits_cafe_user_date ON cafe_visits(cafe_id, user_id, visit_date);

-- Trigger to update updated_at
CREATE TRIGGER update_visits_updated_at BEFORE UPDATE ON cafe_visits
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update cafe total visits count
CREATE OR REPLACE FUNCTION update_cafe_visit_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE cafes
    SET total_visits = total_visits + 1,
        updated_at = NOW()
    WHERE id = NEW.cafe_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE cafes
    SET total_visits = GREATEST(total_visits - 1, 0),
        updated_at = NOW()
    WHERE id = OLD.cafe_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

-- Trigger to update visit count
CREATE TRIGGER update_cafe_visit_count_on_insert
  AFTER INSERT ON cafe_visits
  FOR EACH ROW EXECUTE FUNCTION update_cafe_visit_count();

CREATE TRIGGER update_cafe_visit_count_on_delete
  AFTER DELETE ON cafe_visits
  FOR EACH ROW EXECUTE FUNCTION update_cafe_visit_count();
