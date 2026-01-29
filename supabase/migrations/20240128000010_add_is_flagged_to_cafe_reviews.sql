-- Add is_flagged for filtering (e.g. hide flagged from public reviews)
ALTER TABLE public.cafe_reviews
ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_cafe_reviews_is_flagged ON public.cafe_reviews(is_flagged) WHERE is_flagged = true;

COMMENT ON COLUMN public.cafe_reviews.is_flagged IS 'When true, review can be hidden from public display.';
