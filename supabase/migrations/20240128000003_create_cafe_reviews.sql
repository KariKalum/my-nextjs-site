-- Create cafe_reviews table for reviews, reports, and quick feedback (moderation flow)
-- Uses enum submission_status (pending/approved/rejected) for status column

-- Ensure submission_status enum exists (create if not present)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'submission_status') THEN
    CREATE TYPE public.submission_status AS ENUM ('pending', 'approved', 'rejected');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.cafe_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id UUID NOT NULL REFERENCES public.cafes(id) ON DELETE CASCADE,
  user_id UUID NULL,
  email TEXT NULL,
  rating INT NULL CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  review_text TEXT NULL,
  kind TEXT NOT NULL DEFAULT 'review' CHECK (kind IN ('review', 'report', 'quick_feedback')),
  status public.submission_status NOT NULL DEFAULT 'pending',
  review_notes TEXT NULL,
  reviewed_by UUID NULL,
  reviewed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  evidence JSONB NULL
);

CREATE INDEX IF NOT EXISTS idx_cafe_reviews_cafe_id ON public.cafe_reviews(cafe_id);
CREATE INDEX IF NOT EXISTS idx_cafe_reviews_status ON public.cafe_reviews(status);
CREATE INDEX IF NOT EXISTS idx_cafe_reviews_kind ON public.cafe_reviews(kind);
CREATE INDEX IF NOT EXISTS idx_cafe_reviews_created_at ON public.cafe_reviews(created_at DESC);

-- Ensure updated_at trigger function exists
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cafe_reviews_updated_at
  BEFORE UPDATE ON public.cafe_reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS: anon + authenticated can INSERT; admins can SELECT/UPDATE/DELETE
ALTER TABLE public.cafe_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can insert cafe_reviews" ON public.cafe_reviews;
CREATE POLICY "Public can insert cafe_reviews"
ON public.cafe_reviews
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can select cafe_reviews" ON public.cafe_reviews;
CREATE POLICY "Admins can select cafe_reviews"
ON public.cafe_reviews
FOR SELECT
TO authenticated
USING (is_current_user_admin());

DROP POLICY IF EXISTS "Admins can update cafe_reviews" ON public.cafe_reviews;
CREATE POLICY "Admins can update cafe_reviews"
ON public.cafe_reviews
FOR UPDATE
TO authenticated
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

DROP POLICY IF EXISTS "Admins can delete cafe_reviews" ON public.cafe_reviews;
CREATE POLICY "Admins can delete cafe_reviews"
ON public.cafe_reviews
FOR DELETE
TO authenticated
USING (is_current_user_admin());
