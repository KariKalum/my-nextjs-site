-- Allow public (anon + authenticated) to SELECT approved reviews only (for cafe page display).
-- Admins keep full SELECT via existing "Admins can select cafe_reviews" policy.

DROP POLICY IF EXISTS "Public can read approved cafe_reviews" ON public.cafe_reviews;
CREATE POLICY "Public can read approved cafe_reviews"
ON public.cafe_reviews
FOR SELECT
TO anon, authenticated
USING (status = 'approved');
