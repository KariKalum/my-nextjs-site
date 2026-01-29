import crypto from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { getSupabaseService } from '@/lib/supabase-service'

export const dynamic = 'force-dynamic'

type DecisionBody = {
  decision: 'approve' | 'reject'
  review_notes?: string
}

type Step =
  | 'start'
  | 'auth'
  | 'load_submission'
  | 'validate_status'
  | 'decision_reject'
  | 'decision_approve'
  | 'create_cafe'
  | 'update_submission'
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
    console.info('[admin-submissions]', { requestId, step: 'start' })

    // 1) Auth & admin check
    step = 'auth'
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          ok: false,
          requestId,
          step: 'auth',
          error: { message: 'Forbidden' },
        },
        { status: 403 }
      )
    }

    // Reuse admin check pattern: profiles.role = 'admin' or is_current_user_admin()
    let isAdmin = false

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profileError && profileData && profileData.role === 'admin') {
      isAdmin = true
    } else {
      const { data: adminCheck, error: adminError } = await supabase.rpc(
        'is_current_user_admin'
      )

      if (adminError) {
        console.error('[admin-submissions]', {
          requestId,
          step: 'auth',
          code: adminError.code,
          message: adminError.message,
          details: adminError.details,
          hint: adminError.hint,
        })
        return NextResponse.json(
          {
            ok: false,
            requestId,
            step: 'auth',
            error: {
              message: adminError.message || 'Failed to verify admin status',
              code: adminError.code,
            },
          },
          { status: 500 }
        )
      }

      isAdmin = adminCheck === true
    }

    if (!isAdmin) {
      return NextResponse.json(
        {
          ok: false,
          requestId,
          step: 'auth',
          error: { message: 'Forbidden' },
        },
        { status: 403 }
      )
    }

    const submissionId = params.id
    const adminUserId = user.id

    // Basic UUID validation for submission id
    step = 'load_submission'
    const uuidRegex =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
    if (!submissionId || !uuidRegex.test(submissionId)) {
      return NextResponse.json(
        {
          ok: false,
          requestId,
          step: 'load_submission',
          error: { message: 'Invalid id' },
        },
        { status: 400 }
      )
    }

    // 2) Load submission using service-role client
    const service = getSupabaseService()
    console.info('[admin-submissions]', {
      requestId,
      step: 'service_role_ready',
    })

    const {
      data: submission,
      error: loadError,
    } = await service
      .from('submissions')
      .select('*')
      .eq('id', submissionId)
      .single()

    if (loadError) {
      // Not found (PostgREST typically uses PGRST116 for no rows)
      if (loadError.code === 'PGRST116') {
        return NextResponse.json(
          {
            ok: false,
            requestId,
            step: 'load_submission',
            error: { message: 'Not found' },
          },
          { status: 404 }
        )
      }

      console.error('[admin-submissions]', {
        requestId,
        step: 'load_submission',
        code: loadError.code,
        message: loadError.message,
        details: loadError.details,
        hint: loadError.hint,
      })
      return NextResponse.json(
        {
          ok: false,
          requestId,
          step: 'load_submission',
          error: {
            message: loadError.message || 'Failed to load submission',
            code: loadError.code,
          },
        },
        { status: 500 }
      )
    }

    if (!submission) {
      return NextResponse.json(
        {
          ok: false,
          requestId,
          step: 'load_submission',
          error: { message: 'Not found' },
        },
        { status: 404 }
      )
    }

    // 3) Validate status is pending
    step = 'validate_status'
    if (submission.status !== 'pending') {
      return NextResponse.json(
        {
          ok: false,
          requestId,
          step: 'validate_status',
          error: { message: 'Not pending' },
        },
        { status: 409 }
      )
    }

    // 4) Parse decision (safe JSON parse)
    let body: DecisionBody
    try {
      body = (await request.json()) as DecisionBody
    } catch {
      return NextResponse.json(
        {
          ok: false,
          requestId,
          step: 'validate_status',
          error: { message: 'Invalid JSON' },
        },
        { status: 400 }
      )
    }

    const { decision, review_notes } = body

    if (decision !== 'approve' && decision !== 'reject') {
      return NextResponse.json(
        {
          ok: false,
          requestId,
          step: 'validate_status',
          error: { message: 'Invalid decision' },
        },
        { status: 400 }
      )
    }

    // 5) Handle reject
    if (decision === 'reject') {
      step = 'decision_reject'
      const { error: rejectError } = await service
        .from('submissions')
        .update({
          status: 'rejected',
          review_notes: review_notes ?? null,
          reviewed_at: new Date().toISOString(),
          reviewed_by: adminUserId,
        })
        .eq('id', submissionId)

      if (rejectError) {
        console.error('[admin-submissions]', {
          requestId,
          step,
          code: rejectError.code,
          message: rejectError.message,
          details: rejectError.details,
          hint: rejectError.hint,
        })
        return NextResponse.json(
          {
            ok: false,
            requestId,
            step: 'decision_reject',
            error: {
              message: rejectError.message || 'Failed to reject submission',
              code: rejectError.code,
            },
          },
          { status: 500 }
        )
      }

      return NextResponse.json(
        {
          ok: true,
          requestId,
        },
        { status: 200 }
      )
    }

    // 6) Handle approve: create cafe then update submission
    step = 'decision_approve'

    const cafeInsert: Record<string, any> = {
      name: submission.name,
      city: submission.city,
      address: submission.address,
      website: submission.website ?? null,
      google_maps_url: submission.google_maps_url ?? null,
      is_active: true,
      // NOTE: We only set needs_review/source if those columns exist.
      // The initial schema does NOT define them, so we omit here.
    }

    step = 'create_cafe'
    const {
      data: cafeRow,
      error: cafeError,
    } = await service
      .from('cafes')
      .insert([cafeInsert])
      .select('id')
      .single()

    if (cafeError) {
      console.error('[admin-submissions]', {
        requestId,
        step,
        code: cafeError.code,
        message: cafeError.message,
        details: cafeError.details,
        hint: cafeError.hint,
      })
      return NextResponse.json(
        {
          ok: false,
          requestId,
          step: 'create_cafe',
          error: {
            message: cafeError.message || 'Failed to create cafe from submission',
            code: cafeError.code,
          },
        },
        { status: 500 }
      )
    }

    const cafeId: string | undefined = cafeRow?.id

    step = 'update_submission'
    const { error: updateError } = await service
      .from('submissions')
      .update({
        status: 'approved',
        cafe_id: cafeId ?? null,
        review_notes: review_notes ?? null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminUserId,
      })
      .eq('id', submissionId)

    if (updateError) {
      console.error('[admin-submissions]', {
        requestId,
        step,
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
      })
      return NextResponse.json(
        {
          ok: false,
          requestId,
          step: 'update_submission',
          error: {
            message: updateError.message || 'Failed to update submission after approval',
            code: updateError.code,
          },
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        ok: true,
        requestId,
        cafe_id: cafeId,
      },
      { status: 200 }
    )
  } catch (error) {
    step = 'unknown'
    console.error('[admin-submissions]', {
      requestId,
      step,
      code: (error as any)?.code,
      message: (error as any)?.message ?? 'Unknown server error',
      details: (error as any)?.details,
      hint: (error as any)?.hint,
    })

    return NextResponse.json(
      {
        ok: false,
        requestId,
        step: 'unknown',
        error: {
          message: (error as any)?.message ?? 'Unknown server error',
          code: (error as any)?.code,
        },
      },
      { status: 500 }
    )
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

  console.info('[admin-submissions]', {
    requestId,
    step: 'ping_get',
    id: params.id,
  })

  return NextResponse.json(
    {
      ok: true,
      requestId,
      method: 'GET',
      id: params.id,
    },
    { status: 200 }
  )
}


