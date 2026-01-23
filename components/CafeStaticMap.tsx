'use client'

interface CafeStaticMapProps {
  latitude: number
  longitude: number
  name: string
  /** Link when clicking map or "Open in Maps". Prefer google_maps_url. */
  mapsUrl: string
}

export default function CafeStaticMap({ latitude, longitude, name, mapsUrl }: CafeStaticMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const staticMapUrl = apiKey
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=15&size=640x320&scale=2&markers=color:0xf2820b%7C${latitude},${longitude}&key=${apiKey}`
    : null

  return (
    <div className="w-full rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block relative aspect-[2/1] w-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-xl"
        aria-label={`View ${name} on Google Maps`}
      >
        {staticMapUrl ? (
          <img
            src={staticMapUrl}
            alt={`Map showing location of ${name}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-500">
            <span className="text-4xl mb-2" aria-hidden>📍</span>
            <span className="text-sm font-medium">View on Maps</span>
          </div>
        )}
      </a>
      <div className="px-4 py-3 border-t border-gray-200 bg-white">
        <a
          href={mapsUrl}
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
