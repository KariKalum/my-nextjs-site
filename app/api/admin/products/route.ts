import { NextRequest, NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase-service'

// Mark as dynamic since we use request.url for query params
export const dynamic = 'force-dynamic'

/**
 * API Route using SUPABASE_SERVICE_ROLE_KEY
 * 
 * This route demonstrates server-only operations that bypass RLS.
 * 
 * ⚠️ IMPORTANT SECURITY NOTES:
 * 1. This route runs ONLY on the server - never exposed to the browser
 * 2. Uses SUPABASE_SERVICE_ROLE_KEY which bypasses all RLS policies
 * 3. Should be protected by additional authentication (e.g., admin check)
 * 4. Never expose the SUPABASE_SERVICE_ROLE_KEY in client-side code
 */

/**
 * GET /api/admin/products
 * Fetch all products (bypasses RLS)
 */
export async function GET() {
  try {
    // ⚠️ This operation bypasses RLS because we're using SUPABASE_SERVICE_ROLE_KEY
    // In production, add admin authentication check here
    // Example: const user = await getAuthenticatedUser()
    //          if (!await isAdmin(user.id)) return unauthorized response

    const { data, error } = await supabaseService
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ products: data || [] })
  } catch (err) {
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

/**
 * POST /api/admin/products
 * Create a product (bypasses RLS)
 */
export async function POST(request: NextRequest) {
  try {
    // ⚠️ Add admin authentication check in production
    const body = await request.json()

    const { data, error } = await supabaseService
      .from('products')
      .insert([body] as any)
      .select()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { product: data?.[0] },
      { status: 201 }
    )
  } catch (err) {
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

/**
 * DELETE /api/admin/products?id=xxx
 * Delete a product by ID (bypasses RLS)
 */
export async function DELETE(request: NextRequest) {
  try {
    // ⚠️ Add admin authentication check in production
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabaseService
      .from('products')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'Product deleted successfully' },
      { status: 200 }
    )
  } catch (err) {
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
