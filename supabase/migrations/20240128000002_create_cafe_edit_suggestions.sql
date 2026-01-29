-- Create cafe_edit_suggestions table for suggested edits to cafes
-- Uses enum submission_status (pending/approved/rejected) for status column

-- Ensure submission_status enum exists (create if not present)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'submission_status') THEN
    CREATE TYPE public.submission_status AS ENUM ('pending', 'approved', 'rejected');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.cafe_edit_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id UUID NOT NULL REFERENCES public.cafes(id) ON DELETE CASCADE,
  user_id UUID NULL,
  email TEXT NULL,
  changes JSONB NOT NULL,
  status public.submission_status NOT NULL DEFAULT 'pending',
  review_notes TEXT NULL,
  reviewed_by UUID NULL,
  reviewed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cafe_edit_suggestions_cafe_id ON public.cafe_edit_suggestions(cafe_id);
CREATE INDEX IF NOT EXISTS idx_cafe_edit_suggestions_status ON public.cafe_edit_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_cafe_edit_suggestions_created_at ON public.cafe_edit_suggestions(created_at DESC);

-- Ensure updated_at trigger function exists: use public.set_updated_at() if present, else create it
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cafe_edit_suggestions_updated_at
  BEFORE UPDATE ON public.cafe_edit_suggestions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS: public (anon, authenticated) can INSERT only; admins can SELECT/UPDATE/DELETE
ALTER TABLE public.cafe_edit_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can insert cafe_edit_suggestions" ON public.cafe_edit_suggestions;
CREATE POLICY "Public can insert cafe_edit_suggestions"
ON public.cafe_edit_suggestions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can select cafe_edit_suggestions" ON public.cafe_edit_suggestions;
CREATE POLICY "Admins can select cafe_edit_suggestions"
ON public.cafe_edit_suggestions
FOR SELECT
TO authenticated
USING (is_current_user_admin());

DROP POLICY IF EXISTS "Admins can update cafe_edit_suggestions" ON public.cafe_edit_suggestions;
CREATE POLICY "Admins can update cafe_edit_suggestions"
ON public.cafe_edit_suggestions
FOR UPDATE
TO authenticated
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

DROP POLICY IF EXISTS "Admins can delete cafe_edit_suggestions" ON public.cafe_edit_suggestions;
CREATE POLICY "Admins can delete cafe_edit_suggestions"
ON public.cafe_edit_suggestions
FOR DELETE
TO authenticated
USING (is_current_user_admin());
