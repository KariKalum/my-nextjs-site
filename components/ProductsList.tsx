'use client'

import { useState, useEffect, FormEvent } from 'react'
import { createClient } from '@/src/lib/supabase/client'

interface Product {
  id: string
  [key: string]: unknown
}

export default function ProductsList() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [insertLoading, setInsertLoading] = useState(false)
  const [insertError, setInsertError] = useState<string | null>(null)
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})

  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)

      const supabase = createClient()
      const { data, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) {
        throw fetchError
      }

      setProducts(data || [])
    } catch (err: unknown) {
      let errorMessage = 'An unknown error occurred while fetching products'
      
      if (err && typeof err === 'object' && 'code' in err) {
        const errorCode = (err as { code?: string }).code
        const errorMessageProp = (err as { message?: string }).message || ''
        
        // Handle specific Supabase error codes
        if (errorCode === 'PGRST116') {
          errorMessage = 'The products table does not exist. Please create it in your Supabase database.'
        } else if (errorCode === '42501' || errorMessageProp.includes('permission denied') || errorMessageProp.includes('row-level security')) {
          errorMessage = 'Permission denied. Check your Row Level Security (RLS) policies in Supabase to allow reading from the products table.'
        } else if (errorMessageProp.includes('failed to fetch') || errorMessageProp.includes('NetworkError')) {
          errorMessage = 'Network error. Please check your internet connection and Supabase URL configuration.'
        } else if (errorMessageProp) {
          errorMessage = errorMessageProp
        }
      } else if (err instanceof Error) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
      console.error('Error fetching products:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleInsert = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    try {
      setInsertLoading(true)
      setInsertError(null)

      // Convert form data, handling empty strings as null for optional fields
      const productData: Record<string, unknown> = {}
      Object.entries(formData).forEach(([key, value]) => {
        productData[key] = value.trim() === '' ? null : value.trim()
      })

      const supabase = createClient()
      const { data, error: insertError } = await supabase
        .from('products')
        .insert([productData])
        .select()

      if (insertError) {
        throw insertError
      }

      // Reset form
      setFormData({})
      
      // Refresh the products list
      await fetchProducts()

      console.log('Product inserted successfully:', data)
    } catch (err: unknown) {
      let errorMessage = 'An unknown error occurred while inserting the product'
      
      if (err && typeof err === 'object' && 'code' in err) {
        const errorCode = (err as { code?: string }).code
        const errorMessageProp = (err as { message?: string }).message || ''
        
        // Handle specific Supabase error codes
        if (errorCode === 'PGRST116') {
          errorMessage = 'The products table does not exist. Please create it in your Supabase database.'
        } else if (errorCode === '42501' || errorMessageProp.includes('permission denied') || errorMessageProp.includes('new row violates row-level security')) {
          errorMessage = 'Permission denied. You may not have insert permissions. Check your Row Level Security (RLS) policies in Supabase.'
        } else if (errorCode === '23505') {
          errorMessage = 'A product with this information already exists (duplicate key violation).'
        } else if (errorCode === '23502') {
          errorMessage = 'Required fields are missing. Please fill in all required fields.'
        } else if (errorCode === '23503') {
          errorMessage = 'Invalid reference. One or more fields reference a non-existent value.'
        } else if (errorMessageProp) {
          errorMessage = errorMessageProp
        }
      } else if (err instanceof Error) {
        errorMessage = err.message
      }
      
      setInsertError(errorMessage)
      console.error('Error inserting product:', err)
    } finally {
      setInsertLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return
    }

    try {
      setDeletingIds((prev) => new Set(prev).add(id))
      setDeleteError(null)

      const supabase = createClient()
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (deleteError) {
        throw deleteError
      }

      // Refresh the products list
      await fetchProducts()

      console.log('Product deleted successfully')
    } catch (err: unknown) {
      let errorMessage = 'An unknown error occurred while deleting the product'
      
      if (err && typeof err === 'object' && 'code' in err) {
        const errorCode = (err as { code?: string }).code
        const errorMessageProp = (err as { message?: string }).message || ''
        
        // Handle specific Supabase error codes
        if (errorCode === 'PGRST116') {
          errorMessage = 'The products table does not exist. Please create it in your Supabase database.'
        } else if (errorCode === '42501' || errorMessageProp.includes('permission denied') || errorMessageProp.includes('new row violates row-level security')) {
          errorMessage = 'Permission denied. You may not have delete permissions. Check your Row Level Security (RLS) policies in Supabase.'
        } else if (errorCode === '23503') {
          errorMessage = 'Cannot delete this product. It may be referenced by other records.'
        } else if (errorMessageProp.includes('not found') || errorMessageProp.includes('does not exist')) {
          errorMessage = 'Product not found. It may have already been deleted.'
        } else if (errorMessageProp) {
          errorMessage = errorMessageProp
        }
      } else if (err instanceof Error) {
        errorMessage = err.message
      }
      
      setDeleteError(errorMessage)
      console.error('Error deleting product:', err)
    } finally {
      setDeletingIds((prev) => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="text-gray-600">Loading products...</div>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Products Management</h2>

      {/* Fetch Error */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="text-red-600 font-semibold">Fetch Error:</div>
          <div className="text-red-500 mt-1 text-sm">{error}</div>
        </div>
      )}

      {/* Insert Form */}
      <div className="mb-6 p-4 bg-gray-50 rounded-md border">
        <h3 className="text-lg font-semibold mb-3">Add New Product</h3>
        
        {insertError && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded text-sm">
            <div className="text-red-600 font-semibold">Insert Error:</div>
            <div className="text-red-500 mt-1">{insertError}</div>
          </div>
        )}

        <form onSubmit={handleInsert} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price || ''}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          </div>

          <button
            type="submit"
            disabled={insertLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {insertLoading ? 'Inserting...' : 'Add Product'}
          </button>
        </form>
      </div>

      {/* Delete Error */}
      {deleteError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="text-red-600 font-semibold">Delete Error:</div>
          <div className="text-red-500 mt-1 text-sm">{deleteError}</div>
        </div>
      )}

      {/* Products List */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-3">
          Products ({products.length})
        </h3>
        {products.length === 0 ? (
          <p className="text-gray-600">No products found.</p>
        ) : (
          <div className="space-y-2">
            {products.map((product) => (
              <div
                key={product.id}
                className="p-4 bg-white border border-gray-200 rounded-md flex items-start justify-between"
              >
                <div className="flex-1">
                  <div className="font-semibold mb-2">
                    ID: {product.id}
                  </div>
                  <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
                    {JSON.stringify(product, null, 2)}
                  </pre>
                </div>
                <button
                  onClick={() => handleDelete(product.id)}
                  disabled={deletingIds.has(product.id)}
                  className="ml-4 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {deletingIds.has(product.id) ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
