'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { getLocaleFromPathname } from '@/lib/i18n/routing'
import { withLocale } from '@/lib/i18n/path'

export default function Logo() {
  const [mounted, setMounted] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle')
  const pathname = usePathname()
  const locale = getLocaleFromPathname(pathname)
  const homeHref = withLocale(locale, '/')

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleImageError = () => {
    setImageError(true)
    setLoadState('error')
  }

  const handleLoadStart = () => {
    setLoadState('loading')
  }

  const handleLoadComplete = () => {
    setLoadState('loaded')
  }

  return (
    <Link href={homeHref} className="flex items-center" aria-label="Café Directory Home">
      {!imageError ? (
        <>
          {/* Try regular img tag first to test if file is valid */}
          <img
            src="/logo.svg"
            alt="Café Directory"
            className="h-14 md:h-12 w-auto object-contain"
            width={192}
            height={56}
            style={{ minWidth: '120px', display: 'block' }}
            onError={handleImageError}
            onLoad={handleLoadComplete}
          />
        </>
      ) : (
        <span className="text-xl font-bold text-gray-900 h-14 md:h-12 flex items-center">Café Directory</span>
      )}
    </Link>
  )
}
