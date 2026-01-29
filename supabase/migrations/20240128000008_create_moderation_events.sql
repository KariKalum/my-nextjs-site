-- Audit table for moderation actions (submissions, edit suggestions, reviews).
-- Insert-only from app; admins can read for audit trail.
CREATE TABLE IF NOT EXISTS public.moderation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('submission', 'edit_suggestion', 'review')),
  entity_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('approved', 'rejected', 'applied')),
  actor_user_id UUID NULL,
  cafe_id UUID NULL REFERENCES public.cafes(id) ON DELETE SET NULL,
  applied_changes JSONB NULL,
  note TEXT NULL,
  request_id TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_moderation_events_entity ON public.moderation_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_moderation_events_created_at ON public.moderation_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_events_actor ON public.moderation_events(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_events_cafe ON public.moderation_events(cafe_id);

ALTER TABLE public.moderation_events ENABLE ROW LEVEL SECURITY;

-- Only service role inserts (API uses service client); admins can read.
DROP POLICY IF EXISTS "Admins can select moderation_events" ON public.moderation_events;
CREATE POLICY "Admins can select moderation_events"
ON public.moderation_events
FOR SELECT
TO authenticated
USING (is_current_user_admin());

-- No INSERT policy for anon/authenticated: only service role (bypasses RLS) can insert.
COMMENT ON TABLE public.moderation_events IS 'Audit log for moderation actions (submissions, edit suggestions, reviews).';
