/**
 * Combine description and ai_inference_notes into a single text field.
 * 
 * Rules:
 * - if both a and b => return `${a}\n\n${b}`
 * - if only a => return a
 * - if only b => return b
 * - if neither => return "" (empty string)
 */
export function combineDescription(
  description: string | null | undefined,
  ai_inference_notes: string | null | undefined
): string {
  const a = (description ?? '').trim()
  const b = (ai_inference_notes ?? '').trim()
  
  if (a && b) {
    return `${a}\n\n${b}`
  }
  
  if (a) {
    return a
  }
  
  if (b) {
    return b
  }
  
  return ''
}
