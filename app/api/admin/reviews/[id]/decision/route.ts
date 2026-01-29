import crypto from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { getSupabaseService } from '@/lib/supabase-service'
import { logModerationEvent } from '@/lib/moderation-events'

export const dynamic = 'force-dynamic'

type Step =
  | 'start'
  | 'auth'
  | 'load_review'
  | 'validate_status'
  | 'reject'
  | 'approve'
  | 'unknown'

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
    console.info('[admin-reviews]', { requestId, step: 'start' })

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
        console.error('[admin-reviews]', { requestId, step: 'auth', code: adminError.code, message: adminError.message })
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

    const reviewId = params.id
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
    if (!reviewId || !uuidRegex.test(reviewId)) {
      return NextResponse.json(
        { ok: false, requestId, step: 'load_review', error: { message: 'Invalid id' } },
        { status: 400 }
      )
    }

    step = 'load_review'
    const service = getSupabaseService() as any
    const {
      data: review,
      error: loadError,
    } = (await service
      .from('cafe_reviews')
      .select('id, status, cafe_id')
      .eq('id', reviewId)
      .single()) as { data: { id: string; status: string; cafe_id: string } | null; error: any }

    if (loadError) {
      if (loadError.code === 'PGRST116') {
        return NextResponse.json(
          { ok: false, requestId, step: 'load_review', error: { message: 'Not found' } },
          { status: 404 }
        )
      }
      console.error('[admin-reviews]', { requestId, step, code: loadError.code, message: loadError.message })
      return NextResponse.json(
        { ok: false, requestId, step: 'load_review', error: { message: loadError.message || 'Failed to load review' } },
        { status: 500 }
      )
    }

    if (!review) {
      return NextResponse.json(
        { ok: false, requestId, step: 'load_review', error: { message: 'Not found' } },
        { status: 404 }
      )
    }

    step = 'validate_status'
    if (review.status !== 'pending') {
      return NextResponse.json(
        { ok: false, requestId, step: 'validate_status', error: { message: 'Not pending' } },
        { status: 409 }
      )
    }

    let body: { decision?: string; review_notes?: string }
    try {
      body = (await request.json()) as { decision?: string; review_notes?: string }
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
        .from('cafe_reviews')
        .update({
          status: 'rejected',
          is_approved: false,
          review_notes: review_notes ?? null,
          reviewed_at: reviewedAt,
          reviewed_by: reviewedBy,
        })
        .eq('id', reviewId)

      if (updateError) {
        console.error('[admin-reviews]', { requestId, step, code: updateError.code, message: updateError.message })
        return NextResponse.json(
          { ok: false, requestId, step: 'reject', error: { message: updateError.message || 'Failed to reject' } },
          { status: 500 }
        )
      }
      await logModerationEvent({
        entityType: 'review',
        entityId: reviewId,
        action: 'rejected',
        actorUserId: user.id,
        cafeId: review.cafe_id,
        appliedChanges: null,
        note: review_notes ?? null,
        requestId,
      })
      return NextResponse.json({ ok: true, requestId }, { status: 200 })
    }

    step = 'approve'
    const { error: updateError } = await service
      .from('cafe_reviews')
      .update({
        status: 'approved',
        is_approved: true,
        review_notes: review_notes ?? null,
        reviewed_at: reviewedAt,
        reviewed_by: reviewedBy,
      })
      .eq('id', reviewId)

    if (updateError) {
      console.error('[admin-reviews]', { requestId, step, code: updateError.code, message: updateError.message })
      return NextResponse.json(
        { ok: false, requestId, step: 'approve', error: { message: updateError.message || 'Failed to approve' } },
        { status: 500 }
      )
    }

    await logModerationEvent({
      entityType: 'review',
      entityId: reviewId,
      action: 'approved',
      actorUserId: user.id,
      cafeId: review.cafe_id,
      appliedChanges: { status: 'approved' },
      note: review_notes ?? null,
      requestId,
    })

    return NextResponse.json({ ok: true, requestId }, { status: 200 })
  } catch (err) {
    step = 'unknown'
    console.error('[admin-reviews]', { requestId, step, message: (err as Error)?.message ?? 'Unknown error' })
    return NextResponse.json(
      { ok: false, requestId, step: 'unknown', error: { message: (err as Error)?.message ?? 'Unknown server error' } },
      { status: 500 }
    )
  }
}
