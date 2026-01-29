import crypto from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { getSupabaseService } from '@/lib/supabase-service'
import { ALLOWED_CAFE_FIELDS_SET } from '@/lib/edit-suggestions-fields'
import { logModerationEvent } from '@/lib/moderation-events'

export const dynamic = 'force-dynamic'

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/

type Step =
  | 'start'
  | 'auth'
  | 'parse_body'
  | 'load_suggestion'
  | 'build_patch'
  | 'apply_rpc'
  | 'mark_approved'
  | 'unknown'

function jsonError(
  requestId: string,
  step: string,
  message: string,
  status: number,
  extra?: Record<string, unknown>
) {
  return NextResponse.json(
    { ok: false, requestId, step, error: { message }, ...extra },
    { status }
  )
}

function parseBody(raw: unknown): { suggestionId: string; cafeId: string; selectedKeys: string[] } | null {
  if (!raw || typeof raw !== 'object') return null
  const b = raw as Record<string, unknown>
  const suggestionId = typeof b.suggestionId === 'string' ? b.suggestionId.trim() : ''
  const cafeId = typeof b.cafeId === 'string' ? b.cafeId.trim() : ''
  const sel = b.selectedKeys
  if (!Array.isArray(sel) || sel.length < 1) return null
  const selectedKeys = sel.filter((k): k is string => typeof k === 'string')
  if (selectedKeys.length < 1) return null
  if (!UUID_REGEX.test(suggestionId) || !UUID_REGEX.test(cafeId)) return null
  return { suggestionId, cafeId, selectedKeys }
}

/** Build cafe patch from suggestion.changes for selectedKeys (allowlist optional defense-in-depth). */
function buildPatchFromSelected(
  changes: Record<string, unknown>,
  selectedKeys: string[]
): Record<string, unknown> {
  const patch: Record<string, unknown> = {}
  for (const k of selectedKeys) {
    if (k in changes && ALLOWED_CAFE_FIELDS_SET.has(k)) {
      patch[k] = changes[k]
    }
  }
  return patch
}

export async function POST(request: NextRequest) {
  const requestId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

  let step: Step = 'start'

  try {
    console.info('[admin-edit-suggestions-apply]', { requestId, step: 'start' })

    step = 'auth'
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return jsonError(requestId, step, 'Forbidden', 403)
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
        console.error('[admin-edit-suggestions-apply]', { requestId, step: 'auth', code: adminError.code, message: adminError.message })
        return jsonError(requestId, step, adminError.message || 'Failed to verify admin', 500)
      }
      isAdmin = adminCheck === true
    }

    if (!isAdmin) {
      return jsonError(requestId, step, 'Forbidden', 403)
    }

    step = 'parse_body'
    let body: { suggestionId: string; cafeId: string; selectedKeys: string[] }
    try {
      const raw = await request.json()
      const parsed = parseBody(raw)
      if (!parsed) {
        return jsonError(requestId, step, 'Invalid body: need suggestionId (UUID), cafeId (UUID), selectedKeys (non-empty array)', 400)
      }
      body = parsed
    } catch {
      return jsonError(requestId, step, 'Invalid JSON', 400)
    }

    step = 'load_suggestion'
    const service = getSupabaseService() as any
    const {
      data: suggestion,
      error: sErr,
    } = (await service
      .from('cafe_edit_suggestions')
      .select('id, cafe_id, status, changes')
      .eq('id', body.suggestionId)
      .single()) as { data: { id: string; cafe_id: string; status: string; changes: Record<string, unknown> } | null; error: any }

    if (sErr || !suggestion) {
      if (sErr?.code === 'PGRST116') {
        return jsonError(requestId, step, 'Suggestion not found', 404, { error: sErr?.message })
      }
      console.error('[admin-edit-suggestions-apply]', { requestId, step, code: sErr?.code, message: sErr?.message })
      return jsonError(requestId, step, sErr?.message || 'Failed to load suggestion', 500, { error: sErr?.message })
    }

    if (suggestion.cafe_id !== body.cafeId) {
      return jsonError(requestId, step, 'cafeId mismatch for suggestion', 400)
    }

    if (suggestion.status !== 'pending') {
      return jsonError(requestId, step, 'Suggestion is not pending', 400, { status: suggestion.status })
    }

    step = 'build_patch'
    const changes = (suggestion.changes ?? {}) as Record<string, unknown>
    const patch = buildPatchFromSelected(changes, body.selectedKeys)

    if (Object.keys(patch).length === 0) {
      return jsonError(requestId, step, 'No selected keys exist in suggestion changes or are not allowed', 400)
    }

    step = 'apply_rpc'
    const { data: rpcData, error: rpcErr } = await service.rpc('apply_cafe_patch', {
      p_cafe_id: body.cafeId,
      p_patch: patch,
    })

    if (rpcErr) {
      console.error('[admin-edit-suggestions-apply]', { requestId, step, code: rpcErr.code, message: rpcErr.message })
      return jsonError(requestId, step, 'Failed to apply patch', 500, { error: rpcErr.message })
    }

    const applied = (rpcData?.applied ?? null) as Record<string, unknown> | null
    if (!rpcData?.ok || !applied || Object.keys(applied).length === 0) {
      return jsonError(requestId, step, 'Patch had no allowed fields to apply', 400, { rpcData })
    }

    step = 'mark_approved'
    const { error: uErr } = await service
      .from('cafe_edit_suggestions')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
        applied_changes: applied,
      })
      .eq('id', body.suggestionId)

    if (uErr) {
      console.error('[admin-edit-suggestions-apply]', { requestId, step, code: uErr.code, message: uErr.message })
      return jsonError(requestId, step, 'Patch applied but failed to mark suggestion approved', 500, {
        error: uErr.message,
        applied,
      })
    }

    await logModerationEvent({
      entityType: 'edit_suggestion',
      entityId: body.suggestionId,
      action: 'applied',
      actorUserId: user.id ?? null,
      cafeId: body.cafeId,
      appliedChanges: applied,
      note: null,
      requestId,
    })

    return NextResponse.json({ ok: true, requestId, applied }, { status: 200 })
  } catch (err: unknown) {
    step = 'unknown'
    const message = (err as Error)?.message ?? 'Unknown server error'
    console.error('[admin-edit-suggestions-apply]', { requestId, step, message })
    return jsonError(requestId, step, message, 500, { error: message })
  }
}
