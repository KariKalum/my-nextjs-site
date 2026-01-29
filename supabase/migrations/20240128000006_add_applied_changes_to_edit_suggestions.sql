-- Add applied_changes to cafe_edit_suggestions (stores which keys were applied on approve)
ALTER TABLE public.cafe_edit_suggestions
ADD COLUMN IF NOT EXISTS applied_changes JSONB NULL;

COMMENT ON COLUMN public.cafe_edit_suggestions.applied_changes IS 'Keys/values actually applied to cafes when suggestion was approved (subset of changes).';
