'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SubmitPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

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
    setLoading(true)
    setError(null)
    setSuccess(false)

    // Basic validation
    if (!formData.name.trim()) {
      setError('Café name is required')
      setLoading(false)
      return
    }

    if (!formData.city.trim()) {
      setError('City is required')
      setLoading(false)
      return
    }

    if (!formData.address.trim()) {
      setError('Address is required')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit café suggestion')
      }

      setSuccess(true)
      // Reset form
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

      // Redirect after 3 seconds
      setTimeout(() => {
        router.push('/')
      }, 3000)
    } catch (err: any) {
      console.error('Error submitting form:', err)
      setError(err.message || 'Failed to submit café suggestion. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-2">
            <Link
              href="/"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              ← Back to Directory
            </Link>
          </div>
          <h1 className="text-4xl font-bold text-gray-900">
            Suggest a Café
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Know a great laptop-friendly café? Help us grow our directory!
          </p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800 font-medium mb-2">
                ✅ Thank you! Your café suggestion has been submitted successfully.
              </p>
              <p className="text-sm text-green-700">
                Your submission is pending review. We'll add it to the directory soon. Redirecting to homepage...
              </p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Café Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="e.g., Coffee & Code"
              />
            </div>

            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="e.g., Berlin"
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="e.g., Hauptstraße 123"
              />
            </div>

            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                Website (optional)
              </label>
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="https://example.com"
              />
            </div>

            <div>
              <label htmlFor="google_maps_url" className="block text-sm font-medium text-gray-700 mb-1">
                Google Maps URL (optional)
              </label>
              <input
                type="url"
                id="google_maps_url"
                name="google_maps_url"
                value={formData.google_maps_url}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="https://maps.google.com/..."
              />
            </div>

            <div>
              <label htmlFor="submitter_email" className="block text-sm font-medium text-gray-700 mb-1">
                Your Email (optional)
              </label>
              <input
                type="email"
                id="submitter_email"
                name="submitter_email"
                value={formData.submitter_email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="your@email.com"
              />
              <p className="mt-1 text-xs text-gray-500">We'll only use this to notify you if your submission is approved.</p>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Laptop Friendliness Details (optional)</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="wifi_notes" className="block text-sm font-medium text-gray-700 mb-1">
                    WiFi Notes
                  </label>
                  <textarea
                    id="wifi_notes"
                    name="wifi_notes"
                    value={formData.wifi_notes}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="e.g., Fast WiFi, password required, free"
                  />
                </div>

                <div>
                  <label htmlFor="power_notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Power Outlets (Steckdosen)
                  </label>
                  <textarea
                    id="power_notes"
                    name="power_notes"
                    value={formData.power_notes}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="e.g., Plenty of outlets, some tables have outlets"
                  />
                </div>

                <div>
                  <label htmlFor="noise_notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Noise Level
                  </label>
                  <textarea
                    id="noise_notes"
                    name="noise_notes"
                    value={formData.noise_notes}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="e.g., Quiet, moderate, loud, variable"
                  />
                </div>

                <div>
                  <label htmlFor="time_limit_notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Time Limits
                  </label>
                  <textarea
                    id="time_limit_notes"
                    name="time_limit_notes"
                    value={formData.time_limit_notes}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="e.g., No time limit, 2 hour limit, unlimited"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes (optional)
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Any other information about this café..."
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Suggestion'}
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              All submissions are reviewed before being added to the directory.
            </p>
          </form>
        </div>
      </main>
    </div>
  )
}
