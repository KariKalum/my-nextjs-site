import crypto from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { getSupabaseService } from '@/lib/supabase-service'

export const dynamic = 'force-dynamic'

type DecisionBody = {
  decision: 'approve' | 'reject'
  review_notes?: string
}

type EditSuggestionRow = {
  id: string
  cafe_id: string
  status: string
  changes: Record<string, unknown>
}

type Step =
  | 'start'
  | 'auth'
  | 'load_suggestion'
  | 'validate_status'
  | 'reject'
  | 'approve_patch_cafe'
  | 'approve_update_suggestion'
  | 'unknown'

// Writable columns on public.cafes (exclude id, created_at, place_id, location)
const CAFE_PATCH_ALLOWLIST = new Set([
  'name', 'description', 'address', 'city', 'state', 'zip_code', 'country',
  'phone', 'email', 'website', 'latitude', 'longitude', 'hours',
  'google_maps_url', 'google_rating', 'google_ratings_total', 'price_level',
  'business_status', 'google_reviews', 'google_reviews_fetched_at',
  'work_score', 'is_work_friendly', 'ai_score', 'ai_confidence',
  'ai_wifi_quality', 'ai_power_outlets', 'ai_noise_level', 'ai_laptop_policy',
  'ai_signals', 'ai_evidence', 'ai_reasons', 'ai_structured_json',
  'ai_human_summary', 'ai_inference_notes', 'ai_rated_at',
  'is_active', 'is_verified', 'updated_at',
  'wifi_available', 'wifi_speed_rating', 'power_outlets_available',
  'seating_capacity', 'noise_level', 'table_space_rating', 'total_reviews', 'total_visits',
])

function buildCafePatch(changes: Record<string, unknown>): Record<string, unknown> {
  const patch: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(changes)) {
    if (CAFE_PATCH_ALLOWLIST.has(key)) {
      patch[key] = value
    }
  }
  patch.updated_at = new Date().toISOString()
  return patch
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

  let step: Step = 'start'

  try {
    console.info('[admin-edit-suggestions]', { requestId, step: 'start' })

    step = 'auth'
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { ok: false, requestId, step: 'auth', error: { message: 'Forbidden' } },
        { status: 403 }
      )
    }

    let isAdmin = false
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profileError && profileData?.role === 'admin') {
      isAdmin = true
    } else {
      const { data: adminCheck, error: adminError } = await supabase.rpc('is_current_user_admin')
      if (adminError) {
        console.error('[admin-edit-suggestions]', { requestId, step: 'auth', code: adminError.code, message: adminError.message })
        return NextResponse.json(
          { ok: false, requestId, step: 'auth', error: { message: adminError.message || 'Failed to verify admin' } },
          { status: 500 }
        )
      }
      isAdmin = adminCheck === true
    }

    if (!isAdmin) {
      return NextResponse.json(
        { ok: false, requestId, step: 'auth', error: { message: 'Forbidden' } },
        { status: 403 }
      )
    }

    const suggestionId = params.id
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
    if (!suggestionId || !uuidRegex.test(suggestionId)) {
      return NextResponse.json(
        { ok: false, requestId, step: 'load_suggestion', error: { message: 'Invalid id' } },
        { status: 400 }
      )
    }

    step = 'load_suggestion'
    const service = getSupabaseService() as any
    const {
      data: suggestion,
      error: loadError,
    } = (await service
      .from('cafe_edit_suggestions')
      .select('id, cafe_id, status, changes')
      .eq('id', suggestionId)
      .single()) as { data: EditSuggestionRow | null; error: any }

    if (loadError) {
      if (loadError.code === 'PGRST116') {
        return NextResponse.json(
          { ok: false, requestId, step: 'load_suggestion', error: { message: 'Not found' } },
          { status: 404 }
        )
      }
      console.error('[admin-edit-suggestions]', { requestId, step, code: loadError.code, message: loadError.message })
      return NextResponse.json(
        { ok: false, requestId, step: 'load_suggestion', error: { message: loadError.message || 'Failed to load suggestion' } },
        { status: 500 }
      )
    }

    if (!suggestion) {
      return NextResponse.json(
        { ok: false, requestId, step: 'load_suggestion', error: { message: 'Not found' } },
        { status: 404 }
      )
    }

    step = 'validate_status'
    if (suggestion.status !== 'pending') {
      return NextResponse.json(
        { ok: false, requestId, step: 'validate_status', error: { message: 'Not pending' } },
        { status: 409 }
      )
    }

    let body: DecisionBody
    try {
      body = (await request.json()) as DecisionBody
    } catch {
      return NextResponse.json(
        { ok: false, requestId, step: 'validate_status', error: { message: 'Invalid JSON' } },
        { status: 400 }
      )
    }

    const { decision, review_notes } = body
    if (decision !== 'approve' && decision !== 'reject') {
      return NextResponse.json(
        { ok: false, requestId, step: 'validate_status', error: { message: 'Invalid decision' } },
        { status: 400 }
      )
    }

    const reviewedAt = new Date().toISOString()
    const reviewedBy = user.id

    if (decision === 'reject') {
      step = 'reject'
      const { error: updateError } = await service
        .from('cafe_edit_suggestions')
        .update({
          status: 'rejected',
          review_notes: review_notes ?? null,
          reviewed_at: reviewedAt,
          reviewed_by: reviewedBy,
        })
        .eq('id', suggestionId)

      if (updateError) {
        console.error('[admin-edit-suggestions]', { requestId, step, code: updateError.code, message: updateError.message })
        return NextResponse.json(
          { ok: false, requestId, step: 'reject', error: { message: updateError.message || 'Failed to reject' } },
          { status: 500 }
        )
      }
      return NextResponse.json({ ok: true, requestId }, { status: 200 })
    }

    step = 'approve_patch_cafe'
    const changes = suggestion.changes && typeof suggestion.changes === 'object'
      ? (suggestion.changes as Record<string, unknown>)
      : {}
    const cafePatch = buildCafePatch(changes)
    if (Object.keys(cafePatch).length > 0) {
      const { error: cafeUpdateError } = await service
        .from('cafes')
        .update(cafePatch)
        .eq('id', suggestion.cafe_id)

      if (cafeUpdateError) {
        console.error('[admin-edit-suggestions]', { requestId, step, code: cafeUpdateError.code, message: cafeUpdateError.message })
        return NextResponse.json(
          { ok: false, requestId, step: 'approve_patch_cafe', error: { message: cafeUpdateError.message || 'Failed to update cafe' } },
          { status: 500 }
        )
      }
    }

    step = 'approve_update_suggestion'
    const { error: suggestionUpdateError } = await service
      .from('cafe_edit_suggestions')
      .update({
        status: 'approved',
        review_notes: review_notes ?? null,
        reviewed_at: reviewedAt,
        reviewed_by: reviewedBy,
      })
      .eq('id', suggestionId)

    if (suggestionUpdateError) {
      console.error('[admin-edit-suggestions]', { requestId, step, code: suggestionUpdateError.code, message: suggestionUpdateError.message })
      return NextResponse.json(
        { ok: false, requestId, step: 'approve_update_suggestion', error: { message: suggestionUpdateError.message || 'Failed to mark approved' } },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, requestId }, { status: 200 })
  } catch (err) {
    step = 'unknown'
    console.error('[admin-edit-suggestions]', { requestId, step, message: (err as any)?.message ?? 'Unknown error' })
    return NextResponse.json(
      { ok: false, requestId, step: 'unknown', error: { message: (err as any)?.message ?? 'Unknown server error' } },
      { status: 500 }
    )
  }
}
