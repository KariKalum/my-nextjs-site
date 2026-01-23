interface CafeHoursProps {
  hours: any
  lastChecked?: string | null
  google_maps_url?: string | null
}

/**
 * Calculate days ago from a date string
 */
function getDaysAgo(dateString: string | null | undefined): number | null {
  if (!dateString) return null
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    return diffDays >= 0 ? diffDays : null
  } catch {
    return null
  }
}

/**
 * Format "X days ago" message
 */
function formatDaysAgo(days: number): string {
  if (days === 0) return 'today'
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}

/**
 * Parse hours - can be JSON object or string
 */
function parseHours(hours: any): {
  type: 'json' | 'string' | 'empty'
  data: { day: string; hours: string }[] | string | null
} {
  if (!hours) {
    return { type: 'empty', data: null }
  }

  // Helper to format weekday object into array
  const formatWeekdays = (obj: any): { day: string; hours: string }[] | null => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    const dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    const formatted = days
      .map((day, i) => {
        const value = obj[day]
        if (value && typeof value === 'string' && value.trim()) {
          return { day: dayLabels[i], hours: value.trim() }
        }
        return null
      })
      .filter((x): x is { day: string; hours: string } => x != null)
    
    return formatted.length > 0 ? formatted : null
  }

  // If it's an object (not array), treat as JSON with weekdays
  if (typeof hours === 'object' && !Array.isArray(hours)) {
    const formatted = formatWeekdays(hours)
    if (formatted) {
      return { type: 'json', data: formatted }
    }
    return { type: 'empty', data: null }
  }

  // If it's a string, try to parse as JSON first
  if (typeof hours === 'string') {
    const trimmed = hours.trim()
    if (trimmed === '') {
      return { type: 'empty', data: null }
    }

    // Try to parse as JSON
    try {
      const parsed = JSON.parse(trimmed)
      if (typeof parsed === 'object' && !Array.isArray(parsed)) {
        const formatted = formatWeekdays(parsed)
        if (formatted) {
          return { type: 'json', data: formatted }
        }
      }
    } catch {
      // Not valid JSON, treat as plain string
    }

    // Treat as plain string blob
    return { type: 'string', data: trimmed }
  }

  return { type: 'empty', data: null }
}

export default function CafeHours({ hours, lastChecked, google_maps_url }: CafeHoursProps) {
  const parsed = parseHours(hours)
  const daysAgo = getDaysAgo(lastChecked)

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">🕐 Hours</h2>
      
      {parsed.type === 'empty' ? (
        <div className="flex items-center gap-2">
          <p className="text-gray-500 text-sm">Hours not available yet.</p>
          {google_maps_url && (
            <a
              href={google_maps_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Check Google Maps →
            </a>
          )}
        </div>
      ) : parsed.type === 'json' ? (
        <>
          <dl className="space-y-2">
            {(parsed.data as { day: string; hours: string }[]).map(({ day, hours }) => (
              <div
                key={day}
                className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0"
              >
                <dt className="text-sm font-medium text-gray-700">{day}</dt>
                <dd className="text-sm text-gray-600">{hours}</dd>
              </div>
            ))}
          </dl>
          {daysAgo != null && (
            <p className="text-xs text-gray-500 mt-4">
              Last checked: {formatDaysAgo(daysAgo)}
            </p>
          )}
        </>
      ) : (
        <>
          <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
            {parsed.data as string}
          </div>
          {daysAgo != null && (
            <p className="text-xs text-gray-500 mt-4">
              Last checked: {formatDaysAgo(daysAgo)}
            </p>
          )}
        </>
      )}
    </section>
  )
}
