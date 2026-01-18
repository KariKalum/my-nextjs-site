-- Enable public access to cafes table for insert/update/delete operations
-- This migration allows the admin forms to work without authentication

-- Allow public read access (already handled by default, but making explicit)
ALTER TABLE cafes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
DROP POLICY IF EXISTS "Allow public read access" ON cafes;
CREATE POLICY "Allow public read access"
ON cafes
FOR SELECT
TO public
USING (true);

-- Create policy to allow public insert access (for adding cafes)
DROP POLICY IF EXISTS "Allow public insert access" ON cafes;
CREATE POLICY "Allow public insert access"
ON cafes
FOR INSERT
TO public
WITH CHECK (true);

-- Create policy to allow public update access (for editing cafes)
DROP POLICY IF EXISTS "Allow public update access" ON cafes;
CREATE POLICY "Allow public update access"
ON cafes
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Create policy to allow public delete access (for deleting cafes)
DROP POLICY IF EXISTS "Allow public delete access" ON cafes;
CREATE POLICY "Allow public delete access"
ON cafes
FOR DELETE
TO public
USING (true);

-- Apply same policies to related tables if needed
ALTER TABLE cafe_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read reviews" ON cafe_reviews;
CREATE POLICY "Allow public read reviews"
ON cafe_reviews
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "Allow public insert reviews" ON cafe_reviews;
CREATE POLICY "Allow public insert reviews"
ON cafe_reviews
FOR INSERT
TO public
WITH CHECK (true);
