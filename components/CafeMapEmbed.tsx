import { getMapsUrl } from '@/lib/utils/cafe-display'

interface CafeMapEmbedProps {
  cafe: {
    latitude?: number | null
    longitude?: number | null
    google_maps_url?: string | null
    address?: string | null
    city?: string | null
    state?: string | null
    zip_code?: string | null
    name?: string
  }
}

/**
 * Build Google Maps embed URL with fallback chain:
 * Prefer query by name+address so tooltip shows cafe name, not coordinates
 * 1. name + address query (preferred for proper label)
 * 2. lat/lng (fallback if address missing)
 */
function buildMapEmbedUrl(cafe: CafeMapEmbedProps['cafe']): string | null {
  // Priority 1: Use name + address query (shows cafe name in tooltip)
  if (cafe.name && cafe.address) {
    const query = encodeURIComponent(`${cafe.name} ${cafe.address}`)
    return `https://www.google.com/maps?q=${query}&z=16&output=embed`
  }

  // Priority 2: Use address query only
  if (cafe.address) {
    const addressParts = [
      cafe.address,
      cafe.city,
      cafe.state,
      cafe.zip_code,
    ].filter(Boolean)
    
    if (addressParts.length > 0) {
      const query = encodeURIComponent(addressParts.join(', '))
      return `https://www.google.com/maps?q=${query}&z=16&output=embed`
    }
  }

  // Priority 3: Fallback to lat/lng (only if address missing)
  if (cafe.latitude != null && cafe.longitude != null) {
    return `https://www.google.com/maps?q=${cafe.latitude},${cafe.longitude}&z=16&output=embed`
  }

  return null
}

export default function CafeMapEmbed({ cafe }: CafeMapEmbedProps) {
  const embedUrl = buildMapEmbedUrl(cafe)

  if (!embedUrl) {
    return (
      <div className="w-full rounded-xl border border-gray-200 bg-gray-50 p-8 text-center">
        <p className="text-gray-500 text-sm">Map not available for this cafe yet.</p>
      </div>
    )
  }

  return (
    <div className="w-full rounded-xl overflow-hidden border border-gray-200 bg-gray-100 p-0">
      <iframe
        src={embedUrl}
        width="100%"
        height="320"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="w-full h-[260px] sm:h-[320px]"
        title={`Map showing location of ${cafe.name || 'cafe'}`}
      />
      <div className="px-4 py-3 border-t border-gray-200 bg-white">
        <a
          href={getMapsUrl(cafe)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
        >
          Open in Maps →
        </a>
      </div>
    </div>
  )
}
