'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase, type Cafe } from '@/lib/supabase'

export default function AdminDashboard() {
  const [cafes, setCafes] = useState<Cafe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showActiveOnly, setShowActiveOnly] = useState(true)

  useEffect(() => {
    fetchCafes()
  }, [])

  const fetchCafes = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('cafes')
        .select('*')
        .order('created_at', { ascending: false })

      if (showActiveOnly) {
        query = query.eq('is_active', true)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      setCafes(data || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching cafes:', err)
      setError('Failed to load cafés. Check your Supabase connection.')
      // Use mock data for development
      setCafes(getMockCafes())
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (cafeId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('cafes')
        .update({ is_active: !currentStatus })
        .eq('id', cafeId)

      if (error) throw error

      // Update local state
      setCafes(cafes.map(cafe =>
        cafe.id === cafeId ? { ...cafe, is_active: !currentStatus } : cafe
      ))
    } catch (err) {
      console.error('Error updating café status:', err)
      alert('Failed to update café status')
    }
  }

  const handleDelete = async (cafeId: string, cafeName: string) => {
    if (!confirm(`Are you sure you want to delete "${cafeName}"? This action cannot be undone.`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('cafes')
        .delete()
        .eq('id', cafeId)

      if (error) throw error

      setCafes(cafes.filter(cafe => cafe.id !== cafeId))
    } catch (err) {
      console.error('Error deleting café:', err)
      alert('Failed to delete café')
    }
  }

  const filteredCafes = cafes.filter(cafe =>
    cafe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cafe.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cafe.address.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading cafés...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <Link
            href="/admin/cafes/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Café
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, city, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showActiveOnly}
              onChange={(e) => {
                setShowActiveOnly(e.target.checked)
                fetchCafes()
              }}
              className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Active only</span>
          </label>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">{error}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Total Cafés</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{cafes.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Active</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {cafes.filter(c => c.is_active).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Verified</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {cafes.filter(c => c.is_verified).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">With Reviews</p>
          <p className="text-3xl font-bold text-purple-600 mt-2">
            {cafes.filter(c => (c.google_ratings_total ?? 0) > 0).length}
          </p>
        </div>
      </div>

      {/* Cafés Table */}
      {filteredCafes.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 text-lg mb-4">
            {searchTerm ? 'No cafés found matching your search.' : 'No cafés found.'}
          </p>
          {!searchTerm && (
            <Link
              href="/admin/cafes/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              Add Your First Café
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Café
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCafes.map((cafe) => (
                  <tr key={cafe.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{cafe.name}</div>
                          <div className="text-sm text-gray-500">
                            {cafe.google_ratings_total ? `${cafe.google_ratings_total.toLocaleString()} Google reviews` : 'No reviews yet'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{cafe.city}</div>
                      <div className="text-sm text-gray-500">{cafe.address}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        const score = cafe.work_score ?? cafe.ai_score
                        return score != null ? (
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-900">
                              {score.toFixed(0)}
                            </span>
                            <span className="ml-1 text-gray-500 text-xs">/100</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {cafe.is_active ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                            Inactive
                          </span>
                        )}
                        {cafe.is_verified && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            Verified
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={`/cafe/${cafe.id}`}
                          target="_blank"
                          className="text-primary-600 hover:text-primary-900"
                          title="View"
                        >
                          👁️
                        </Link>
                        <Link
                          href={`/admin/cafes/${cafe.id}/edit`}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          ✏️
                        </Link>
                        <button
                          onClick={() => handleToggleActive(cafe.id, cafe.is_active)}
                          className={`${
                            cafe.is_active
                              ? 'text-yellow-600 hover:text-yellow-900'
                              : 'text-green-600 hover:text-green-900'
                          }`}
                          title={cafe.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {cafe.is_active ? '⏸️' : '▶️'}
                        </button>
                        <button
                          onClick={() => handleDelete(cafe.id, cafe.name)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// Mock data for development
function getMockCafes(): Cafe[] {
  return [
    {
      id: '1',
      name: 'The Cozy Corner',
      description: 'A quiet café perfect for focused work',
      address: '123 Main Street',
      city: 'San Francisco',
      state: 'CA',
      zip_code: '94102',
      country: 'US',
      phone: '+1-555-0101',
      email: null,
      website: null,
      latitude: 37.7749,
      longitude: -122.4194,
      wifi_available: true,
      wifi_speed_rating: 5,
      wifi_password_required: true,
      wifi_password: 'cozy2024',
      power_outlets_available: true,
      power_outlet_rating: 5,
      seating_capacity: 30,
      comfortable_seating: true,
      seating_variety: 'tables, couches',
      noise_level: 'quiet',
      music_type: 'instrumental',
      conversation_friendly: true,
      table_space_rating: 5,
      natural_light: true,
      lighting_rating: 5,
      hours: {},
      time_limit_minutes: null,
      reservation_required: false,
      laptop_policy: 'unlimited',
      parking_available: true,
      parking_type: 'street',
      accessible: true,
      pet_friendly: false,
      outdoor_seating: true,
      google_rating: 4.8,
      google_ratings_total: 127,
      price_level: 2,
      business_status: 'OPERATIONAL',
      is_active: true,
      is_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]
}
