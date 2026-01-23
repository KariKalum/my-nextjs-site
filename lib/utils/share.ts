/**
 * Share page URL to clipboard with toast notification.
 * Falls back to modal/prompt if clipboard API is unavailable.
 */
export async function sharePage(
  url: string,
  onToast: (message: string) => void,
  onModal?: (url: string) => void
): Promise<void> {
  // Try clipboard API first
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(url)
      onToast('Link copied ✅')
      return
    } catch (err) {
      // Clipboard failed, fall through to fallback
      console.warn('Clipboard write failed:', err)
    }
  }
  
  // Fallback: show modal or prompt
  if (onModal) {
    onModal(url)
  } else {
    // Last resort: use prompt
    const input = document.createElement('input')
    input.value = url
    input.style.position = 'fixed'
    input.style.opacity = '0'
    document.body.appendChild(input)
    input.select()
    input.setSelectionRange(0, url.length)
    
    try {
      document.execCommand('copy')
      onToast('Link copied ✅')
    } catch {
      // Show prompt as final fallback
      const userInput = prompt('Copy this link:', url)
      if (userInput) {
        onToast('Link copied ✅')
      }
    } finally {
      document.body.removeChild(input)
    }
  }
}
