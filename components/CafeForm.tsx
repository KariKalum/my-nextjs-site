'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import type { Cafe } from '@/src/lib/supabase/types'

interface CafeFormProps {
  cafe?: Cafe
  mode: 'create' | 'edit'
}

export default function CafeForm({ cafe, mode }: CafeFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    name: cafe?.name || '',
    description: cafe?.description || '',
    address: cafe?.address || '',
    city: cafe?.city || '',
    state: cafe?.state || '',
    zip_code: cafe?.zip_code || '',
    country: cafe?.country || 'US',
    phone: cafe?.phone || '',
    email: cafe?.email || '',
    website: cafe?.website || '',
    latitude: cafe?.latitude?.toString() || '',
    longitude: cafe?.longitude?.toString() || '',
    place_id: cafe?.place_id || '',
    google_maps_url: cafe?.google_maps_url || '',
    google_rating: cafe?.google_rating?.toString() || '',
    google_ratings_total: cafe?.google_ratings_total?.toString() || '',
    price_level: cafe?.price_level?.toString() || '',
    business_status: cafe?.business_status || '',
    hours: cafe?.hours ? JSON.stringify(cafe.hours, null, 2) : JSON.stringify({
      monday: '8:00 AM - 6:00 PM',
      tuesday: '8:00 AM - 6:00 PM',
      wednesday: '8:00 AM - 6:00 PM',
      thursday: '8:00 AM - 6:00 PM',
      friday: '8:00 AM - 8:00 PM',
      saturday: '9:00 AM - 8:00 PM',
      sunday: '9:00 AM - 6:00 PM',
    }, null, 2),
    work_score: cafe?.work_score?.toString() || '',
    is_work_friendly: cafe?.is_work_friendly ?? null,
    ai_score: cafe?.ai_score?.toString() || '',
    ai_confidence: cafe?.ai_confidence?.toString() || '',
    ai_wifi_quality: cafe?.ai_wifi_quality || '',
    ai_power_outlets: cafe?.ai_power_outlets || '',
    ai_noise_level: cafe?.ai_noise_level || '',
    ai_laptop_policy: cafe?.ai_laptop_policy || '',
    is_active: cafe?.is_active ?? true,
    is_verified: cafe?.is_verified ?? false,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Validate required fields
      if (!formData.name || !formData.address || !formData.city) {
        throw new Error('Name, address, and city are required')
      }

      // Parse numeric fields
      const numericFields: Record<string, number | null> = {}
      const numFields = ['latitude', 'longitude', 'google_rating', 'google_ratings_total', 
                         'price_level', 'work_score', 'ai_score']
      
      numFields.forEach(field => {
        const value = formData[field as keyof typeof formData]
        numericFields[field] = (value && typeof value === 'string' && value.trim()) ? parseFloat(value) : null
      })

      // Validate lat/lng ranges (required for now, until geocoding is added)
      const lat = numericFields.latitude
      const lng = numericFields.longitude

      if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) {
        throw new Error('Please enter both latitude and longitude for the café location.')
      }
      if (lat < -90 || lat > 90) {
        throw new Error('Latitude must be between -90 and 90.')
      }
      if (lng < -180 || lng > 180) {
        throw new Error('Longitude must be between -180 and 180.')
      }

      // Validate website URL - reject localhost URLs
      if (formData.website && formData.website.trim()) {
        try {
          const url = new URL(formData.website)
          if (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname.startsWith('127.')) {
            throw new Error('Localhost URLs are not allowed. Please provide a public website URL.')
          }
        } catch (err: any) {
          if (err.message.includes('Localhost')) {
            throw err
          }
          throw new Error('Please provide a valid website URL.')
        }
      }

      // Parse hours JSON
      let hours = {}
      try {
        hours = JSON.parse(formData.hours)
      } catch {
        hours = {}
      }

      // Dynamically import supabase to ensure it's loaded correctly
      const { supabase } = await import('@/lib/supabase')
      
      // Validate Supabase connection before proceeding
      if (!supabase) {
        throw new Error('Supabase client not initialized. Please check your environment variables.')
      }

      const cafeData = {
        name: formData.name,
        description: formData.description || null,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        zip_code: formData.zip_code || null,
        country: formData.country || null,
        phone: formData.phone || null,
        email: formData.email || null,
        website: formData.website || null,
        latitude: numericFields.latitude,
        longitude: numericFields.longitude,
        place_id: formData.place_id || null,
        google_maps_url: formData.google_maps_url || null,
        google_rating: numericFields.google_rating,
        google_ratings_total: numericFields.google_ratings_total,
        price_level: numericFields.price_level,
        business_status: formData.business_status || null,
        hours: hours || null,
        work_score: numericFields.work_score,
        is_work_friendly: formData.is_work_friendly,
        ai_score: numericFields.ai_score,
        ai_confidence: formData.ai_confidence || null,
        ai_wifi_quality: formData.ai_wifi_quality || null,
        ai_power_outlets: formData.ai_power_outlets || null,
        ai_noise_level: formData.ai_noise_level || null,
        ai_laptop_policy: formData.ai_laptop_policy || null,
        is_active: formData.is_active,
        is_verified: formData.is_verified,
      }

      if (mode === 'edit' && cafe) {
        const { data: updateData, error } = await supabase
          .from('cafes')
          .update(cafeData)
          .eq('id', cafe.id)
          .select()

        if (error) {
          if (process.env.NEXT_PUBLIC_DEBUG_LOGS === 'true') {
            console.error('Supabase update error:', error)
          }
          throw new Error(`Failed to update café: ${error.message || 'Database error'}`)
        }
        setSuccess(true)
        setTimeout(() => router.push('/admin'), 1500)
      } else {
        const { data, error } = await supabase
          .from('cafes')
          .insert([cafeData])
          .select()
          .single()

        if (error) {
          if (process.env.NEXT_PUBLIC_DEBUG_LOGS === 'true') {
            console.error('Supabase insert error:', error)
          }
          // Provide more helpful error messages
          if (error.code === 'PGRST116') {
            throw new Error('The cafes table does not exist. Please run the database migrations in your Supabase project.')
          } else if (error.code === '23505') {
            throw new Error('A café with this information already exists.')
          } else if (error.message?.includes('JWT')) {
            throw new Error('Invalid Supabase credentials. Please check your .env.local file.')
          } else if (error.message?.includes('fetch')) {
            throw new Error('Cannot connect to Supabase. Please check your internet connection and Supabase URL.')
          }
          throw new Error(`Failed to create café: ${error.message || 'Database error'}`)
        }
        
        if (!data) {
          throw new Error('Café was created but no data was returned.')
        }
        
        setSuccess(true)
        setTimeout(() => router.push('/admin'), 1500)
      }
    } catch (err: any) {
      console.error('Error saving café:', err)
      // Show user-friendly error message
      const errorMessage = err.message || 
        (err.toString().includes('fetch') ? 'Network error: Cannot connect to Supabase. Check your .env.local credentials.' : 'Failed to save café')
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">
            Café {mode === 'edit' ? 'updated' : 'created'} successfully! Redirecting...
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Café Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Location</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
            <input
              type="text"
              name="zip_code"
              value={formData.zip_code}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
            <input
              type="number"
              step="any"
              name="latitude"
              value={formData.latitude}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
            <input
              type="number"
              step="any"
              name="longitude"
              value={formData.longitude}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Google Maps & Place ID */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Google Maps</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Place ID</label>
            <input
              type="text"
              name="place_id"
              value={formData.place_id}
              onChange={handleChange}
              placeholder="ChIJ..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Google Maps URL</label>
            <input
              type="url"
              name="google_maps_url"
              value={formData.google_maps_url}
              onChange={handleChange}
              placeholder="https://maps.google.com/..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Google Rating (1-5)</label>
            <input
              type="number"
              min="1"
              max="5"
              step="0.1"
              name="google_rating"
              value={formData.google_rating}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Reviews</label>
            <input
              type="number"
              min="0"
              name="google_ratings_total"
              value={formData.google_ratings_total}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price Level (1-4)</label>
            <input
              type="number"
              min="1"
              max="4"
              name="price_level"
              value={formData.price_level}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Status</label>
            <select
              name="business_status"
              value={formData.business_status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select...</option>
              <option value="OPERATIONAL">Operational</option>
              <option value="CLOSED_TEMPORARILY">Closed Temporarily</option>
              <option value="CLOSED_PERMANENTLY">Closed Permanently</option>
            </select>
          </div>
        </div>
      </div>

      {/* Work Score & AI Fields */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Work Score & AI Assessment</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Work Score (0-100)</label>
            <input
              type="number"
              min="0"
              max="100"
              name="work_score"
              value={formData.work_score}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Is Work Friendly</label>
            <select
              name="is_work_friendly"
              value={formData.is_work_friendly === null ? '' : formData.is_work_friendly ? 'true' : 'false'}
              onChange={(e) => setFormData(prev => ({ ...prev, is_work_friendly: e.target.value === '' ? null : e.target.value === 'true' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Not set</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">AI Score (0-100)</label>
            <input
              type="number"
              min="0"
              max="100"
              name="ai_score"
              value={formData.ai_score}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">AI Confidence</label>
            <input
              type="text"
              name="ai_confidence"
              value={formData.ai_confidence}
              onChange={handleChange}
              placeholder="e.g., high, medium, low, or percentage"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">AI WiFi Quality</label>
            <input
              type="text"
              name="ai_wifi_quality"
              value={formData.ai_wifi_quality}
              onChange={handleChange}
              placeholder="e.g., Excellent, Good, Fair"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">AI Power Outlets</label>
            <input
              type="text"
              name="ai_power_outlets"
              value={formData.ai_power_outlets}
              onChange={handleChange}
              placeholder="e.g., Plenty available, Limited"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">AI Noise Level</label>
            <input
              type="text"
              name="ai_noise_level"
              value={formData.ai_noise_level}
              onChange={handleChange}
              placeholder="e.g., Quiet, Moderate, Loud"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">AI Laptop Policy</label>
            <input
              type="text"
              name="ai_laptop_policy"
              value={formData.ai_laptop_policy}
              onChange={handleChange}
              placeholder="e.g., Unlimited, Peak hours only"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Business Hours */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Business Hours (JSON)</h2>
        <textarea
          name="hours"
          value={formData.hours}
          onChange={handleChange}
          rows={8}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm font-mono text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          Format: {"{"} "monday": "8:00 AM - 6:00 PM", "tuesday": "8:00 AM - 6:00 PM" {"}"}
        </p>
      </div>


      {/* Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Status</h2>
        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <span className="text-sm font-medium text-gray-700">Active</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="is_verified"
              checked={formData.is_verified}
              onChange={handleChange}
              className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <span className="text-sm font-medium text-gray-700">Verified</span>
          </label>
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex items-center justify-end space-x-4 pt-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : mode === 'edit' ? 'Update Café' : 'Create Café'}
        </button>
      </div>
    </form>
  )
}
