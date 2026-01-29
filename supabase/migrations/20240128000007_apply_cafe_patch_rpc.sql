-- RPC: apply a patch (allowed keys only) to a cafe row and set updated_at.
-- Returns { "ok": true, "applied": { ... } } with the subset actually applied.
CREATE OR REPLACE FUNCTION public.apply_cafe_patch(p_cafe_id uuid, p_patch jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  allowed text[] := ARRAY[
    'name','description','address','city','state','zip_code','country',
    'phone','email','website','latitude','longitude','hours',
    'google_maps_url','google_rating','google_ratings_total','price_level',
    'business_status','google_reviews','google_reviews_fetched_at',
    'work_score','is_work_friendly','ai_score','ai_confidence',
    'ai_wifi_quality','ai_power_outlets','ai_noise_level','ai_laptop_policy',
    'ai_signals','ai_evidence','ai_reasons','ai_structured_json',
    'ai_human_summary','ai_inference_notes','ai_rated_at',
    'is_active','is_verified',
    'wifi_available','wifi_speed_rating','power_outlets_available',
    'seating_capacity','noise_level','table_space_rating','total_reviews','total_visits'
  ];
  jsonb_keys text[] := ARRAY['hours','ai_signals','ai_evidence','ai_reasons','ai_structured_json'];
  k text;
  v jsonb;
  applied jsonb := '{}';
  set_parts text[] := '{}';
  final_sql text;
BEGIN
  FOR k, v IN SELECT * FROM jsonb_each(p_patch)
  LOOP
    IF k = ANY(allowed) THEN
      applied := applied || jsonb_build_object(k, v);
      IF k = ANY(jsonb_keys) THEN
        set_parts := set_parts || format('%I = ($2->%L)', k, k);
      ELSE
        set_parts := set_parts || format('%I = ($2->>%L)', k, k);
      END IF;
    END IF;
  END LOOP;

  IF applied = '{}' THEN
    RETURN jsonb_build_object('ok', false, 'applied', '{}'::jsonb);
  END IF;

  final_sql := 'UPDATE public.cafes SET ' || array_to_string(set_parts, ', ') || ', updated_at = now() WHERE id = $1';
  EXECUTE final_sql USING p_cafe_id, p_patch;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'applied', '{}'::jsonb);
  END IF;

  RETURN jsonb_build_object('ok', true, 'applied', applied);
END;
$$;

COMMENT ON FUNCTION public.apply_cafe_patch(uuid, jsonb) IS 'Apply allowed keys from p_patch to cafes row; sets updated_at. Returns { ok, applied }.';
