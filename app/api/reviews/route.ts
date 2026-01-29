import crypto from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'

export const dynamic = 'force-dynamic'

const ALLOWED_KINDS = ['review', 'report', 'quick_feedback'] as const
const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/

type Step = 'start' | 'validate' | 'insert' | 'unknown'

export async function POST(request: NextRequest) {
  const requestId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

  let step: Step = 'start'

  try {
    console.info('[reviews]', { requestId, step: 'start' })

    step = 'validate'
    let body: {
      cafe_id?: string
      kind?: string
      rating?: number
      review_text?: string
      email?: string
      evidence?: unknown
    }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        {
          ok: false,
          requestId,
          step: 'validate',
          error: { message: 'Invalid JSON' },
        },
        { status: 400 }
      )
    }

    const { cafe_id, kind, rating, review_text, email, evidence } = body

    if (!cafe_id || typeof cafe_id !== 'string' || !cafe_id.trim()) {
      return NextResponse.json(
        {
          ok: false,
          requestId,
          step: 'validate',
          error: { message: 'cafe_id is required' },
        },
        { status: 400 }
      )
    }

    if (!UUID_REGEX.test(cafe_id.trim())) {
      return NextResponse.json(
        {
          ok: false,
          requestId,
          step: 'validate',
          error: { message: 'cafe_id must be a valid UUID' },
        },
        { status: 400 }
      )
    }

    const kindVal = (kind != null && typeof kind === 'string' ? kind.trim() : '') || 'review'
    if (!ALLOWED_KINDS.includes(kindVal as (typeof ALLOWED_KINDS)[number])) {
      return NextResponse.json(
        {
          ok: false,
          requestId,
          step: 'validate',
          error: { message: `kind must be one of: ${ALLOWED_KINDS.join(', ')}` },
        },
        { status: 400 }
      )
    }

    if (kindVal === 'review') {
      const hasRating =
        rating != null && typeof rating === 'number' && rating >= 1 && rating <= 5
      const hasText =
        review_text != null && typeof review_text === 'string' && review_text.trim().length > 0
      if (!hasRating && !hasText) {
        return NextResponse.json(
          {
            ok: false,
            requestId,
            step: 'validate',
            error: {
              message:
                'For kind "review", provide at least rating (1–5) or non-empty review_text',
            },
          },
          { status: 400 }
        )
      }
    }

    const supabase = await createClient()

    step = 'insert'
    const insertPayload: {
      cafe_id: string
      kind: string
      rating?: number | null
      review_text?: string | null
      email?: string | null
      user_id?: string | null
      evidence?: Record<string, unknown> | null
    } = {
      cafe_id: cafe_id.trim(),
      kind: kindVal,
    }

    if (kindVal === 'review' && rating != null && typeof rating === 'number' && rating >= 1 && rating <= 5) {
      insertPayload.rating = Math.floor(rating)
    }

    if (review_text != null && typeof review_text === 'string' && review_text.trim()) {
      insertPayload.review_text = review_text.trim()
    }

    if (email != null && typeof email === 'string' && email.trim()) {
      insertPayload.email = email.trim()
    }

    if (evidence != null && typeof evidence === 'object' && !Array.isArray(evidence)) {
      insertPayload.evidence = evidence as Record<string, unknown>
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (user?.id) {
      insertPayload.user_id = user.id
    }

    const { error } = await supabase.from('cafe_reviews').insert([insertPayload])

    if (error) {
      console.error('[reviews]', {
        requestId,
        step,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      })
      return NextResponse.json(
        {
          ok: false,
          requestId,
          step: 'insert',
          error: {
            message: error.message || 'Failed to save review',
            code: error.code,
          },
        },
        { status: 500 }
      )
    }

    console.info('[reviews]', { requestId, step: 'success' })

    return NextResponse.json(
      {
        ok: true,
        requestId,
      },
      { status: 201 }
    )
  } catch (err) {
    step = 'unknown'
    console.error('[reviews]', {
      requestId,
      step,
      code: (err as { code?: string })?.code,
      message: (err as Error)?.message ?? 'Unknown server error',
    })
    return NextResponse.json(
      {
        ok: false,
        requestId,
        step: 'unknown',
        error: {
          message: (err as Error)?.message ?? 'Unknown server error',
          code: (err as { code?: string })?.code,
        },
      },
      { status: 500 }
    )
  }
}
