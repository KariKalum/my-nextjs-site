'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import type { Cafe } from '@/lib/supabase'

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
    wifi_available: cafe?.wifi_available ?? true,
    wifi_speed_rating: cafe?.wifi_speed_rating?.toString() || '',
    wifi_password_required: cafe?.wifi_password_required ?? true,
    wifi_password: cafe?.wifi_password || '',
    power_outlets_available: cafe?.power_outlets_available ?? false,
    power_outlet_rating: cafe?.power_outlet_rating?.toString() || '',
    seating_capacity: cafe?.seating_capacity?.toString() || '0',
    comfortable_seating: cafe?.comfortable_seating ?? false,
    seating_variety: cafe?.seating_variety || '',
    noise_level: cafe?.noise_level || 'moderate',
    music_type: cafe?.music_type || '',
    conversation_friendly: cafe?.conversation_friendly ?? true,
    table_space_rating: cafe?.table_space_rating?.toString() || '',
    natural_light: cafe?.natural_light ?? false,
    lighting_rating: cafe?.lighting_rating?.toString() || '',
    hours: cafe?.hours ? JSON.stringify(cafe.hours, null, 2) : JSON.stringify({
      monday: '8:00 AM - 6:00 PM',
      tuesday: '8:00 AM - 6:00 PM',
      wednesday: '8:00 AM - 6:00 PM',
      thursday: '8:00 AM - 6:00 PM',
      friday: '8:00 AM - 8:00 PM',
      saturday: '9:00 AM - 8:00 PM',
      sunday: '9:00 AM - 6:00 PM',
    }, null, 2),
    time_limit_minutes: cafe?.time_limit_minutes?.toString() || '',
    reservation_required: cafe?.reservation_required ?? false,
    laptop_policy: cafe?.laptop_policy || 'unlimited',
    parking_available: cafe?.parking_available ?? false,
    parking_type: cafe?.parking_type || '',
    accessible: cafe?.accessible ?? false,
    pet_friendly: cafe?.pet_friendly ?? false,
    outdoor_seating: cafe?.outdoor_seating ?? false,
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
      const numFields = ['latitude', 'longitude', 'wifi_speed_rating', 'power_outlet_rating', 
                         'seating_capacity', 'table_space_rating', 'lighting_rating', 'time_limit_minutes']
      
      numFields.forEach(field => {
        const value = formData[field as keyof typeof formData]
        numericFields[field] = (value && typeof value === 'string') ? parseFloat(value) : null
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
        address: formData.address,
        city: formData.city,
        state: formData.state || null,
        zip_code: formData.zip_code || null,
        country: formData.country,
        phone: formData.phone || null,
        email: formData.email || null,
        website: formData.website || null,
        latitude: numericFields.latitude,
        longitude: numericFields.longitude,
        wifi_available: formData.wifi_available,
        wifi_speed_rating: numericFields.wifi_speed_rating,
        wifi_password_required: formData.wifi_password_required,
        wifi_password: formData.wifi_password || null,
        power_outlets_available: formData.power_outlets_available,
        power_outlet_rating: numericFields.power_outlet_rating,
        seating_capacity: numericFields.seating_capacity || 0,
        comfortable_seating: formData.comfortable_seating,
        seating_variety: formData.seating_variety || null,
        noise_level: formData.noise_level || null,
        music_type: formData.music_type || null,
        conversation_friendly: formData.conversation_friendly,
        table_space_rating: numericFields.table_space_rating,
        natural_light: formData.natural_light,
        lighting_rating: numericFields.lighting_rating,
        hours,
        time_limit_minutes: numericFields.time_limit_minutes,
        reservation_required: formData.reservation_required,
        laptop_policy: formData.laptop_policy || null,
        parking_available: formData.parking_available,
        parking_type: formData.parking_type || null,
        accessible: formData.accessible,
        pet_friendly: formData.pet_friendly,
        outdoor_seating: formData.outdoor_seating,
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
          console.error('Supabase update error:', error)
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
          console.error('Supabase insert error:', error)
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

      {/* WiFi */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">WiFi</h2>
        <div className="space-y-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="wifi_available"
              checked={formData.wifi_available}
              onChange={handleChange}
              className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <span className="text-sm font-medium text-gray-700">WiFi Available</span>
          </label>
          {formData.wifi_available && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WiFi Speed Rating (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  name="wifi_speed_rating"
                  value={formData.wifi_speed_rating}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="wifi_password_required"
                  checked={formData.wifi_password_required}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Password Required</span>
              </label>
              {formData.wifi_password_required && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WiFi Password</label>
                  <input
                    type="text"
                    name="wifi_password"
                    value={formData.wifi_password}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Power Outlets */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Power Outlets</h2>
        <div className="space-y-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="power_outlets_available"
              checked={formData.power_outlets_available}
              onChange={handleChange}
              className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <span className="text-sm font-medium text-gray-700">Power Outlets Available</span>
          </label>
          {formData.power_outlets_available && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Outlet Rating (1-5)</label>
              <input
                type="number"
                min="1"
                max="5"
                name="power_outlet_rating"
                value={formData.power_outlet_rating}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* Seating */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Seating</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Seating Capacity</label>
            <input
              type="number"
              min="0"
              name="seating_capacity"
              value={formData.seating_capacity}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Table Space Rating (1-5)</label>
            <input
              type="number"
              min="1"
              max="5"
              name="table_space_rating"
              value={formData.table_space_rating}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Seating Variety</label>
            <input
              type="text"
              name="seating_variety"
              value={formData.seating_variety}
              onChange={handleChange}
              placeholder="e.g., tables, couches, bar seating"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="comfortable_seating"
              checked={formData.comfortable_seating}
              onChange={handleChange}
              className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <span className="text-sm font-medium text-gray-700">Comfortable Seating</span>
          </label>
        </div>
      </div>

      {/* Environment */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Environment</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Noise Level</label>
            <select
              name="noise_level"
              value={formData.noise_level}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select...</option>
              <option value="quiet">Quiet</option>
              <option value="moderate">Moderate</option>
              <option value="loud">Loud</option>
              <option value="variable">Variable</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Music Type</label>
            <input
              type="text"
              name="music_type"
              value={formData.music_type}
              onChange={handleChange}
              placeholder="e.g., instrumental, jazz"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lighting Rating (1-5)</label>
            <input
              type="number"
              min="1"
              max="5"
              name="lighting_rating"
              value={formData.lighting_rating}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="natural_light"
                checked={formData.natural_light}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Natural Light</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="conversation_friendly"
                checked={formData.conversation_friendly}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Conversation Friendly</span>
            </label>
          </div>
        </div>
      </div>

      {/* Policies */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Policies</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time Limit (minutes)</label>
            <input
              type="number"
              min="0"
              name="time_limit_minutes"
              value={formData.time_limit_minutes}
              onChange={handleChange}
              placeholder="Leave empty for no limit"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
            <p className="text-xs text-gray-500 mt-1">Leave empty or 0 for unlimited</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Laptop Policy</label>
            <select
              name="laptop_policy"
              value={formData.laptop_policy}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="unlimited">Unlimited</option>
              <option value="peak_hours_only">Peak Hours Only</option>
              <option value="restricted">Restricted</option>
            </select>
          </div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="reservation_required"
              checked={formData.reservation_required}
              onChange={handleChange}
              className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <span className="text-sm font-medium text-gray-700">Reservation Required</span>
          </label>
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

      {/* Amenities */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Amenities</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="parking_available"
              checked={formData.parking_available}
              onChange={handleChange}
              className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <span className="text-sm font-medium text-gray-700">Parking Available</span>
          </label>
          {formData.parking_available && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Parking Type</label>
              <input
                type="text"
                name="parking_type"
                value={formData.parking_type}
                onChange={handleChange}
                placeholder="e.g., street, lot, garage"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          )}
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="accessible"
              checked={formData.accessible}
              onChange={handleChange}
              className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <span className="text-sm font-medium text-gray-700">Wheelchair Accessible</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="pet_friendly"
              checked={formData.pet_friendly}
              onChange={handleChange}
              className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <span className="text-sm font-medium text-gray-700">Pet Friendly</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="outdoor_seating"
              checked={formData.outdoor_seating}
              onChange={handleChange}
              className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <span className="text-sm font-medium text-gray-700">Outdoor Seating</span>
          </label>
        </div>
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
