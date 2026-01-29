-- Add is_approved boolean to cafe_reviews for filter logic (pending = null, approved = true, rejected = false)
ALTER TABLE public.cafe_reviews
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NULL;

-- Backfill from status
UPDATE public.cafe_reviews SET is_approved = true  WHERE status = 'approved';
UPDATE public.cafe_reviews SET is_approved = false WHERE status = 'rejected';
UPDATE public.cafe_reviews SET is_approved = NULL  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_cafe_reviews_is_approved ON public.cafe_reviews(is_approved);

COMMENT ON COLUMN public.cafe_reviews.is_approved IS 'NULL = pending, true = approved, false = rejected. Mirrors status for filter logic.';
