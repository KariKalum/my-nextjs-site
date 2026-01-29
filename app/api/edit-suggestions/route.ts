import crypto from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'

export const dynamic = 'force-dynamic'

type Step =
  | 'start'
  | 'validate'
  | 'insert'
  | 'unknown'

export async function POST(request: NextRequest) {
  const requestId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

  let step: Step = 'start'

  try {
    console.info('[edit-suggestions]', { requestId, step: 'start' })

    step = 'validate'
    let body: { cafe_id?: string; changes?: unknown; email?: string; notify?: boolean }
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

    const { cafe_id, changes, email, notify } = body

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

    const uuidRegex =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
    if (!uuidRegex.test(cafe_id.trim())) {
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

    if (changes === undefined || changes === null) {
      return NextResponse.json(
        {
          ok: false,
          requestId,
          step: 'validate',
          error: { message: 'changes is required' },
        },
        { status: 400 }
      )
    }

    if (typeof changes !== 'object' || Array.isArray(changes)) {
      return NextResponse.json(
        {
          ok: false,
          requestId,
          step: 'validate',
          error: { message: 'changes must be an object' },
        },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    step = 'insert'
    const insertPayload: {
      cafe_id: string
      changes: Record<string, unknown>
      email?: string | null
      user_id?: string | null
    } = {
      cafe_id: cafe_id.trim(),
      changes: changes as Record<string, unknown>,
    }

    if (email != null && typeof email === 'string' && email.trim()) {
      insertPayload.email = email.trim()
    }

    // Optionally set user_id if authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.id) {
      insertPayload.user_id = user.id
    }

    const { error } = await supabase
      .from('cafe_edit_suggestions')
      .insert([insertPayload])

    if (error) {
      console.error('[edit-suggestions]', {
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
            message: error.message || 'Failed to save edit suggestion',
            code: error.code,
          },
        },
        { status: 500 }
      )
    }

    console.info('[edit-suggestions]', { requestId, step: 'success' })

    return NextResponse.json(
      {
        ok: true,
        requestId,
      },
      { status: 200 }
    )
  } catch (err) {
    step = 'unknown'
    console.error('[edit-suggestions]', {
      requestId,
      step,
      code: (err as any)?.code,
      message: (err as any)?.message ?? 'Unknown server error',
    })
    return NextResponse.json(
      {
        ok: false,
        requestId,
        step: 'unknown',
        error: {
          message: (err as any)?.message ?? 'Unknown server error',
          code: (err as any)?.code,
        },
      },
      { status: 500 }
    )
  }
}
