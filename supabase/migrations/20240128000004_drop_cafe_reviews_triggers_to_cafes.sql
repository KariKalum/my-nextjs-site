-- Drop triggers that update cafes when cafe_reviews change.
-- Those triggers set cafes.overall_laptop_rating / total_reviews (columns may not exist → error 42703).
-- Run this to fix: POST /api/reviews 500 "column overall_laptop_rating of relation cafes does not exist".

DROP TRIGGER IF EXISTS update_cafe_ratings_on_insert ON public.cafe_reviews;
DROP TRIGGER IF EXISTS update_cafe_ratings_on_update ON public.cafe_reviews;
DROP TRIGGER IF EXISTS update_cafe_ratings_on_delete ON public.cafe_reviews;
