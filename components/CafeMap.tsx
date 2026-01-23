'use client'

interface CafeMapProps {
  latitude: number | null
  longitude: number | null
  name: string
  address: string | null
}

export default function CafeMap({ latitude, longitude, name, address }: CafeMapProps) {
  if (!latitude || !longitude) return null
  
  // Google Maps Embed API - no API key required for basic embeds
  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}&q=${latitude},${longitude}&zoom=15`
  
  // Fallback to iframe with Google Maps search if no API key
  const addressPart = address ? `, ${address}` : ''
  const fallbackUrl = `https://www.google.com/maps?q=${encodeURIComponent(name + addressPart)}&output=embed`

  return (
    <div className="w-full h-96 relative">
      {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
        <iframe
          src={mapUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="absolute inset-0"
          title={`Map showing location of ${name}`}
        />
      ) : (
        <>
          <iframe
            src={fallbackUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0"
            title={`Map showing location of ${name}`}
          />
          <div className="absolute bottom-4 right-4 bg-white px-4 py-2 rounded-lg shadow-lg text-sm">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Open in Google Maps →
            </a>
          </div>
        </>
      )}
    </div>
  )
}
