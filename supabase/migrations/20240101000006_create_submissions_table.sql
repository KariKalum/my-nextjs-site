-- Create submissions table for cafe suggestions
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Submitted cafe information
  name VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  website VARCHAR(255),
  notes TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  
  -- Admin actions
  reviewed_by UUID, -- Can reference auth.users if using Supabase Auth
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  
  -- Reference to created cafe (if approved)
  cafe_id UUID REFERENCES cafes(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submissions_created_at ON submissions(created_at DESC);
CREATE INDEX idx_submissions_city ON submissions(city);

-- Trigger to update updated_at
CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON submissions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Allow public insert (for form submissions)
DROP POLICY IF EXISTS "Allow public insert submissions" ON submissions;
CREATE POLICY "Allow public insert submissions"
ON submissions
FOR INSERT
TO public
WITH CHECK (true);

-- Allow public read (optional - might want to restrict this)
DROP POLICY IF EXISTS "Allow public read submissions" ON submissions;
CREATE POLICY "Allow public read submissions"
ON submissions
FOR SELECT
TO public
USING (true);

-- Allow public update (for admin actions, if needed)
DROP POLICY IF EXISTS "Allow public update submissions" ON submissions;
CREATE POLICY "Allow public update submissions"
ON submissions
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);
