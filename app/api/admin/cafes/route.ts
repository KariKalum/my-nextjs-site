import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { getSupabaseService } from '@/lib/supabase-service'

// Mark as dynamic since we use request body
export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/cafes
 * Create a new café (admin only)
 * 
 * This route:
 * 1. Validates the current user is authenticated
 * 2. Checks if the user is an admin using public.is_current_user_admin()
 * 3. Uses service role client to insert the café (bypasses RLS)
 * 4. Returns the created café row
 */
export async function POST(request: NextRequest) {
  try {
    // Step 1: Get authenticated user using server client
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in.' },
        { status: 401 }
      )
    }

    // Step 2: Check if user is admin using is_current_user_admin() function
    const { data: adminCheck, error: adminError } = await supabase
      .rpc('is_current_user_admin')

    if (adminError) {
      console.error('Error checking admin status:', adminError)
      return NextResponse.json(
        { error: 'Failed to verify admin status.' },
        { status: 500 }
      )
    }

    if (!adminCheck) {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required to create cafés.' },
        { status: 403 }
      )
    }

    // Step 3: Parse request body
    const body = await request.json()

    // Step 4: Validate required fields
    if (!body.name || !body.address || !body.city) {
      return NextResponse.json(
        { error: 'Name, address, and city are required fields.' },
        { status: 400 }
      )
    }

    // Validate lat/lng if provided
    if (body.latitude != null) {
      const lat = typeof body.latitude === 'string' ? parseFloat(body.latitude) : body.latitude
      if (isNaN(lat) || lat < -90 || lat > 90) {
        return NextResponse.json(
          { error: 'Latitude must be a number between -90 and 90.' },
          { status: 400 }
        )
      }
    }

    if (body.longitude != null) {
      const lng = typeof body.longitude === 'string' ? parseFloat(body.longitude) : body.longitude
      if (isNaN(lng) || lng < -180 || lng > 180) {
        return NextResponse.json(
          { error: 'Longitude must be a number between -180 and 180.' },
          { status: 400 }
        )
      }
    }

    // Validate website URL - reject localhost URLs
    if (body.website && typeof body.website === 'string' && body.website.trim()) {
      try {
        const url = new URL(body.website)
        if (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname.startsWith('127.')) {
          return NextResponse.json(
            { error: 'Localhost URLs are not allowed. Please provide a public website URL.' },
            { status: 400 }
          )
        }
      } catch (err: any) {
        if (!err.message.includes('Invalid URL')) {
          return NextResponse.json(
            { error: 'Please provide a valid website URL.' },
            { status: 400 }
          )
        }
      }
    }

    // Step 5: Strip unknown keys (safety helper)
    const allowedKeys = [
      'name',
      'description',
      'address',
      'city',
      'state',
      'zip_code',
      'country',
      'phone',
      'website',
      'latitude',
      'longitude',
      'place_id',
      'google_maps_url',
      'google_rating',
      'google_ratings_total',
      'price_level',
      'business_status',
      'hours',
      'work_score',
      'is_work_friendly',
      'ai_score',
      'ai_confidence',
      'ai_wifi_quality',
      'ai_power_outlets',
      'ai_noise_level',
      'ai_laptop_policy',
      'is_active',
      'is_verified',
    ]

    const safeCafeData = Object.fromEntries(
      Object.entries(body).filter(([key]) => allowedKeys.includes(key))
    )

    // Step 6: Insert using service role client (bypasses RLS)
    const supabaseService = getSupabaseService()
    const { data, error } = await supabaseService
      .from('cafes')
      .insert([safeCafeData] as any)
      .select()
      .single()

    if (error) {
      console.error('Error inserting café:', error)
      
      // Provide helpful error messages
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'The cafes table does not exist. Please run the database migrations.' },
          { status: 500 }
        )
      } else if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A café with this information already exists.' },
          { status: 409 }
        )
      }
      
      return NextResponse.json(
        { error: `Failed to create café: ${error.message || 'Database error'}` },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Café was created but no data was returned.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { cafe: data },
      { status: 201 }
    )
  } catch (err) {
    console.error('Error in POST /api/admin/cafes:', err)
    const errorMessage =
      err instanceof Error
        ? err.message
        : 'An unknown error occurred'
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
