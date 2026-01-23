'use client'

import { useState, useEffect, useCallback } from 'react'
import { t } from '@/lib/i18n/t'
import type { Dictionary } from '@/lib/i18n/getDictionary'
import en from '@/lib/i18n/dictionaries/en.json'

const STORAGE_KEY = 'scoutbrew_notice_dismissed_until'

export default function CommunityNotice({ dict }: { dict?: Dictionary }) {
  const d = dict ?? (en as Dictionary)
  const [isVisible, setIsVisible] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    // Check if notice was dismissed
    const dismissedUntil = localStorage.getItem(STORAGE_KEY)
    if (dismissedUntil) {
      const dismissedDate = new Date(dismissedUntil)
      const now = new Date()
      // If 7 days haven't passed, keep it hidden
      if (now < dismissedDate) {
        setIsVisible(false)
        return
      }
      // If 7 days have passed, show it again and clear the storage
      localStorage.removeItem(STORAGE_KEY)
    }
    setIsVisible(true)
  }, [])

  const handleDismiss = useCallback(() => {
    setIsVisible(false)
    // Store dismissal for 7 days
    const dismissedUntil = new Date()
    dismissedUntil.setDate(dismissedUntil.getDate() + 7)
    localStorage.setItem(STORAGE_KEY, dismissedUntil.toISOString())
  }, [])

  const handleLearnMore = useCallback(() => {
    setIsModalOpen(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
  }, [])

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isModalOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseModal()
      }
    }

    document.addEventListener('keydown', handleEscape)
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isModalOpen, handleCloseModal])

  if (!isVisible) {
    return null
  }

  return (
    <>
      <div className="bg-blue-50 border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="flex-shrink-0 mt-0.5">
                <span className="text-lg">☕</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 leading-relaxed">
                  <span className="font-medium">{t(d, 'home.community.bold')}</span>{' '}
                  {t(d, 'home.community.body')}{' '}
                  <span className="text-gray-700">{t(d, 'home.community.review')}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleLearnMore}
                className="text-sm font-medium text-primary-600 hover:text-primary-700 px-3 py-1.5 rounded-md hover:bg-blue-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-blue-50"
              >
                {t(d, 'home.community.learnMore')}
              </button>
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-blue-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-blue-50"
                aria-label={t(d, 'home.community.dismissLabel')}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
            onClick={handleCloseModal}
            aria-hidden="true"
          />
          {/* Modal */}
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label={t(d, 'home.community.closeModal')}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <h2 id="modal-title" className="text-xl font-semibold text-gray-900 mb-4 pr-8">
                {t(d, 'home.community.modalTitle')}
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>{t(d, 'home.community.modalP1')}</p>
                <p>{t(d, 'home.community.modalP2')}</p>
                <p>{t(d, 'home.community.modalP3')}</p>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  {t(d, 'home.community.gotIt')}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
