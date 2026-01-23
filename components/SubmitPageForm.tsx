'use client'

import { useState, FormEvent, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import CommunityNotice from '@/components/CommunityNotice'
import { t } from '@/lib/i18n/t'
import type { Dictionary } from '@/lib/i18n/getDictionary'
import type { Locale } from '@/lib/i18n/config'
import { prefixWithLocale } from '@/lib/i18n/routing'

interface SubmitPageFormProps {
  dict: Dictionary
  locale: Locale
}

export default function SubmitPageForm({ dict, locale }: SubmitPageFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isNetworkError, setIsNetworkError] = useState(false)
  const isSubmittingRef = useRef(false)
  const errorRef = useRef<HTMLDivElement>(null)
  const successRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus()
    }
  }, [error])

  useEffect(() => {
    if (success && successRef.current) {
      successRef.current.focus()
    }
  }, [success])

  const [formData, setFormData] = useState({
    name: '',
    city: '',
    address: '',
    website: '',
    google_maps_url: '',
    submitter_email: '',
    notes: '',
    wifi_notes: '',
    power_notes: '',
    noise_notes: '',
    time_limit_notes: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (isSubmittingRef.current || loading) return
    setError(null)
    setIsNetworkError(false)
    setSuccess(false)

    if (!formData.name.trim()) {
      setError(t(dict, 'submit.errorName'))
      setTimeout(() => document.getElementById('name')?.focus(), 100)
      return
    }
    if (!formData.city.trim()) {
      setError(t(dict, 'submit.errorCity'))
      setTimeout(() => document.getElementById('city')?.focus(), 100)
      return
    }
    if (!formData.address.trim()) {
      setError(t(dict, 'submit.errorAddress'))
      setTimeout(() => document.getElementById('address')?.focus(), 100)
      return
    }
    if (formData.website && formData.website.trim()) {
      try {
        new URL(formData.website)
      } catch {
        setError(t(dict, 'submit.errorWebsite'))
        return
      }
    }
    if (formData.google_maps_url && formData.google_maps_url.trim()) {
      try {
        new URL(formData.google_maps_url)
      } catch {
        setError(t(dict, 'submit.errorMaps'))
        return
      }
    }

    isSubmittingRef.current = true
    setLoading(true)

    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!response) throw new Error('NETWORK_ERROR')
      let data
      try {
        data = await response.json()
      } catch {
        throw new Error('NETWORK_ERROR')
      }
      if (!response.ok) {
        if (response.status === 400) throw new Error(data.error || t(dict, 'submit.errorCheckInfo'))
        if (response.status === 500) throw new Error(t(dict, 'submit.errorServers'))
        throw new Error(data.error || t(dict, 'submit.errorProcess'))
      }
      setSuccess(true)
      setIsNetworkError(false)
      setFormData({
        name: '',
        city: '',
        address: '',
        website: '',
        google_maps_url: '',
        submitter_email: '',
        notes: '',
        wifi_notes: '',
        power_notes: '',
        noise_notes: '',
        time_limit_notes: '',
      })
      setTimeout(() => router.push(prefixWithLocale('/', locale)), 3000)
    } catch (err: any) {
      if (err.message === 'NETWORK_ERROR' || err.name === 'TypeError' || err.message?.includes('fetch')) {
        setIsNetworkError(true)
        setError(t(dict, 'submit.errorConnect'))
      } else {
        setIsNetworkError(false)
        setError(err.message || t(dict, 'submit.errorSubmit'))
      }
    } finally {
      setLoading(false)
      isSubmittingRef.current = false
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <nav aria-label="Breadcrumb" className="mb-3 sm:mb-4">
            <Link
              href={prefixWithLocale('/', locale)}
              className="inline-block text-primary-600 hover:text-primary-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded px-2 py-1.5 -ml-2 text-sm sm:text-base min-h-[44px] min-w-[44px] flex items-center"
            >
              <span aria-hidden="true">←</span> <span className="ml-1">{t(dict, 'submit.backToDirectory')}</span>
            </Link>
          </nav>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
            {t(dict, 'submit.suggestCafe')}
          </h1>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg lg:text-xl text-gray-700 font-medium leading-relaxed">
            {t(dict, 'submit.helpRemoteWorkers')}
          </p>
          <p className="mt-2 sm:mt-3 text-sm sm:text-base text-gray-600 leading-relaxed">
            {t(dict, 'submit.suggestionHelpsOthers')}
          </p>
        </div>
      </header>

      <CommunityNotice dict={dict} />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8">
          {success && (
            <div
              ref={successRef}
              role="alert"
              aria-live="polite"
              aria-atomic="true"
              tabIndex={-1}
              className="mb-4 sm:mb-6 p-4 sm:p-6 bg-green-50 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              <div className="flex items-start">
                <div className="flex-shrink-0" aria-hidden="true">
                  <svg className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm sm:text-base font-semibold text-green-800 mb-2 leading-snug">
                    {t(dict, 'submit.thankYou')}
                  </h3>
                  <div className="text-sm text-green-700 space-y-2 leading-relaxed">
                    <p>{t(dict, 'submit.receivedReview')}</p>
                    <p>{t(dict, 'submit.approvedRedirect')}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div
              ref={errorRef}
              id="form-error"
              role="alert"
              aria-live="assertive"
              aria-atomic="true"
              tabIndex={-1}
              className="mb-4 sm:mb-6 p-4 sm:p-6 bg-red-50 border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              <div className="flex items-start">
                <div className="flex-shrink-0" aria-hidden="true">
                  <svg className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm sm:text-base font-semibold text-red-800 mb-2 leading-snug">
                    {isNetworkError ? t(dict, 'submit.connectionProblem') : t(dict, 'submit.unableToSubmit')}
                  </h3>
                  <p id="error-message" className="text-sm text-red-700 mb-3 leading-relaxed">
                    {error}
                  </p>
                  {isNetworkError ? (
                    <div className="text-sm text-red-600 space-y-2 leading-relaxed">
                      <p className="font-medium">{t(dict, 'submit.whatYouCanDo')}</p>
                      <ul className="list-disc list-inside space-y-1.5 ml-2">
                        <li>{t(dict, 'submit.checkConnection')}</li>
                        <li>{t(dict, 'submit.makeSureOnline')}</li>
                        <li>{t(dict, 'submit.tryAgain')}</li>
                        <li>{t(dict, 'submit.refreshResubmit')}</li>
                      </ul>
                    </div>
                  ) : (
                    <p className="text-sm text-red-600 leading-relaxed">
                      {t(dict, 'submit.errorCheckInfo')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6" noValidate>
            <div>
              <label htmlFor="name" className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                {t(dict, 'submit.nameLabel')} <span className="text-red-500" aria-label="required">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                aria-required="true"
                aria-invalid={!!(error && formData.name === '')}
                aria-describedby="name-hint"
                className={`w-full px-4 py-3 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 focus:border-primary-500 ${loading ? 'bg-gray-50 cursor-not-allowed' : ''} ${error && !formData.name.trim() ? 'border-red-300' : ''}`}
                placeholder={t(dict, 'submit.namePlaceholder')}
                disabled={loading}
              />
              <p id="name-hint" className="mt-1.5 text-sm text-gray-500 leading-relaxed">
                Enter the exact name as it appears on the café&apos;s signage or website.
              </p>
            </div>

            <div>
              <label htmlFor="city" className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                {t(dict, 'submit.cityLabel')} <span className="text-red-500" aria-label="required">*</span>
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                aria-required="true"
                aria-invalid={!!(error && !formData.city.trim())}
                aria-describedby="city-hint"
                className={`w-full px-4 py-3 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 focus:border-primary-500 ${loading ? 'bg-gray-50 cursor-not-allowed' : ''} ${error && !formData.city.trim() ? 'border-red-300' : ''}`}
                placeholder={t(dict, 'submit.cityPlaceholder')}
                disabled={loading}
              />
              <p id="city-hint" className="mt-1.5 text-sm text-gray-500 leading-relaxed">
                The city where this café is located. Use the full city name (e.g., &quot;Berlin&quot; not &quot;BER&quot;).
              </p>
            </div>

            <div>
              <label htmlFor="address" className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                {t(dict, 'submit.addressLabel')} <span className="text-red-500" aria-label="required">*</span>
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                aria-required="true"
                aria-invalid={!!(error && !formData.address.trim())}
                aria-describedby="address-hint"
                className={`w-full px-4 py-3 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 focus:border-primary-500 ${loading ? 'bg-gray-50 cursor-not-allowed' : ''} ${error && !formData.address.trim() ? 'border-red-300' : ''}`}
                placeholder={t(dict, 'submit.addressPlaceholder')}
                disabled={loading}
              />
              <p id="address-hint" className="mt-1.5 text-sm text-gray-500 leading-relaxed">
                Include the street name and number so visitors can easily find the café.
              </p>
            </div>

            <div>
              <label htmlFor="website" className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                {t(dict, 'submit.websiteLabel')}
              </label>
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                aria-invalid={!!(error && formData.website.length > 0)}
                aria-describedby="website-hint"
                className={`w-full px-4 py-3 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 focus:border-primary-500 ${loading ? 'bg-gray-50 cursor-not-allowed' : ''} ${error && formData.website ? 'border-red-300' : ''}`}
                placeholder={t(dict, 'submit.websitePlaceholder')}
                disabled={loading}
              />
              <p id="website-hint" className="mt-1.5 text-sm text-gray-500 leading-relaxed">
                The café&apos;s official website URL. Include &quot;https://&quot; at the beginning.
              </p>
            </div>

            <div>
              <label htmlFor="google_maps_url" className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                {t(dict, 'submit.mapsLabel')}
              </label>
              <input
                type="url"
                id="google_maps_url"
                name="google_maps_url"
                value={formData.google_maps_url}
                onChange={handleChange}
                aria-invalid={!!(error && formData.google_maps_url.length > 0)}
                aria-describedby="google_maps_url-hint"
                className={`w-full px-4 py-3 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 focus:border-primary-500 ${loading ? 'bg-gray-50 cursor-not-allowed' : ''} ${error && formData.google_maps_url ? 'border-red-300' : ''}`}
                placeholder={t(dict, 'submit.mapsPlaceholder')}
                disabled={loading}
              />
              <p id="google_maps_url-hint" className="mt-1.5 text-sm text-gray-500 leading-relaxed">
                Copy and paste the Google Maps link for this location to help verify the address.
              </p>
            </div>

            <div>
              <label htmlFor="submitter_email" className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                {t(dict, 'submit.emailLabel')}
              </label>
              <input
                type="email"
                id="submitter_email"
                name="submitter_email"
                value={formData.submitter_email}
                onChange={handleChange}
                aria-describedby="submitter_email-hint"
                className={`w-full px-4 py-3 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 focus:border-primary-500 ${loading ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                placeholder={t(dict, 'submit.emailPlaceholder')}
                disabled={loading}
              />
              <p id="submitter_email-hint" className="mt-1.5 text-sm text-gray-500 leading-relaxed">
                We&apos;ll only use this to notify you if your submission is approved. Your email won&apos;t be shared publicly.
              </p>
            </div>

            <div className="border-t border-gray-200 pt-5 sm:pt-6 mt-5 sm:mt-6">
              <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-4 sm:mb-5">
                Laptop Friendliness Details <span className="text-gray-500 text-xs sm:text-sm font-normal">(optional)</span>
              </h2>
              <div className="space-y-5 sm:space-y-6">
                <div>
                  <label htmlFor="wifi_notes" className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                    {t(dict, 'submit.wifiNotesLabel')}
                  </label>
                  <textarea
                    id="wifi_notes"
                    name="wifi_notes"
                    value={formData.wifi_notes}
                    onChange={handleChange}
                    rows={3}
                    aria-describedby="wifi_notes-hint"
                    className={`w-full px-4 py-3 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 focus:border-primary-500 ${loading ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                    placeholder="e.g., Fast WiFi, password required, free"
                    disabled={loading}
                  />
                  <p id="wifi_notes-hint" className="mt-1.5 text-sm text-gray-500 leading-relaxed">
                    Describe the WiFi quality, speed, and whether a password is needed.
                  </p>
                </div>
                <div>
                  <label htmlFor="power_notes" className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                    {t(dict, 'submit.powerNotesLabel')}
                  </label>
                  <textarea
                    id="power_notes"
                    name="power_notes"
                    value={formData.power_notes}
                    onChange={handleChange}
                    rows={3}
                    aria-describedby="power_notes-hint"
                    className={`w-full px-4 py-3 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 focus:border-primary-500 ${loading ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                    placeholder="e.g., Plenty of outlets, some tables have outlets"
                    disabled={loading}
                  />
                  <p id="power_notes-hint" className="mt-1.5 text-sm text-gray-500 leading-relaxed">
                    Note how many outlets are available and where they&apos;re located (tables, walls, etc.).
                  </p>
                </div>
                <div>
                  <label htmlFor="noise_notes" className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                    {t(dict, 'submit.noiseNotesLabel')}
                  </label>
                  <textarea
                    id="noise_notes"
                    name="noise_notes"
                    value={formData.noise_notes}
                    onChange={handleChange}
                    rows={3}
                    aria-describedby="noise_notes-hint"
                    className={`w-full px-4 py-3 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 focus:border-primary-500 ${loading ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                    placeholder="e.g., Quiet, moderate, loud, variable"
                    disabled={loading}
                  />
                  <p id="noise_notes-hint" className="mt-1.5 text-sm text-gray-500 leading-relaxed">
                    Describe the typical noise level - is it quiet for focused work, moderate with background conversation, or louder?
                  </p>
                </div>
                <div>
                  <label htmlFor="time_limit_notes" className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                    {t(dict, 'submit.timeLimitNotesLabel')}
                  </label>
                  <textarea
                    id="time_limit_notes"
                    name="time_limit_notes"
                    value={formData.time_limit_notes}
                    onChange={handleChange}
                    rows={3}
                    aria-describedby="time_limit_notes-hint"
                    className={`w-full px-4 py-3 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 focus:border-primary-500 ${loading ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                    placeholder="e.g., No time limit, 2 hour limit, unlimited"
                    disabled={loading}
                  />
                  <p id="time_limit_notes-hint" className="mt-1.5 text-sm text-gray-500 leading-relaxed">
                    Note if there are any restrictions on how long customers can stay with a laptop.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                {t(dict, 'submit.notesLabel')}
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={5}
                aria-describedby="notes-hint"
                className={`w-full px-4 py-3 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 focus:border-primary-500 ${loading ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                placeholder={t(dict, 'submit.notesPlaceholder')}
                disabled={loading}
              />
              <p id="notes-hint" className="mt-1.5 text-sm text-gray-500 leading-relaxed">
                Share anything else that would help remote workers decide if this café is right for them (seating comfort, lighting, parking, etc.).
              </p>
            </div>

            <div className="pt-4 sm:pt-5">
              <button
                type="submit"
                disabled={loading || success}
                aria-busy={loading}
                aria-live="polite"
                className="w-full px-6 py-4 sm:py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[48px] touch-manipulation"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-base">{t(dict, 'submit.submitSubmitting')}</span>
                  </span>
                ) : success ? (
                  <span className="flex items-center justify-center">
                    <svg className="h-5 w-5 text-white mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-base">{t(dict, 'submit.submitSuccess')}</span>
                  </span>
                ) : (
                  <span className="text-base">{t(dict, 'submit.submitButton')}</span>
                )}
              </button>
            </div>

            <p className="text-sm text-gray-500 text-center mt-4 sm:mt-5 leading-relaxed px-2">
              {t(dict, 'submit.reviewNote')}
            </p>
          </form>
        </div>
      </main>
    </div>
  )
}
