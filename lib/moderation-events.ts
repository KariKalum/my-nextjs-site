import { getSupabaseService } from '@/lib/supabase-service'

export type ModerationEntityType = 'submission' | 'edit_suggestion' | 'review'
export type ModerationAction = 'approved' | 'rejected' | 'applied'

export async function logModerationEvent(input: {
  entityType: ModerationEntityType
  entityId: string // uuid
  action: ModerationAction
  actorUserId?: string | null // uuid
  cafeId?: string | null // uuid
  appliedChanges?: Record<string, unknown> | null // jsonb
  note?: string | null
  requestId?: string | null
}) {
  const service = getSupabaseService() as any

  const { error } = await service.from('moderation_events').insert({
    entity_type: input.entityType,
    entity_id: input.entityId,
    action: input.action,
    actor_user_id: input.actorUserId ?? null,
    cafe_id: input.cafeId ?? null,
    applied_changes: input.appliedChanges ?? null,
    note: input.note ?? null,
    request_id: input.requestId ?? null,
  })

  if (error) {
    // We don't want moderation to fail just because logging failed.
    // Log and continue.
    console.error('[moderation_events] failed', {
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      requestId: input.requestId,
      error: error.message,
    })
  }
}
