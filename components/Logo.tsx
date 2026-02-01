'use client'

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
    <Link href={homeHref} className="flex items-center h-full [--logo-h:var(--header-logo-height)]" aria-label="Café Directory Home">
      {!imageError ? (
        <>
          <img
            src="/logo 3.svg"
            alt="Café Directory"
            className="w-[375px] max-w-[176px] md:max-w-none h-full object-contain block pt-px pb-px px-0 m-0"
            width={192}
            height={56}
            style={{ minWidth: '132px' }}
            onError={handleImageError}
            onLoad={handleLoadComplete}
          />
        </>
      ) : (
        <span className="text-xl font-bold text-gray-900 flex items-center h-full">Café Directory</span>
      )}
    </Link>
  )
}
