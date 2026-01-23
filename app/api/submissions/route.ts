import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'

// Mark as dynamic since we use cookies() via createClient()
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      name, 
      city, 
      address, 
      website, 
      google_maps_url,
      submitter_email,
      notes, 
      wifi_notes,
      power_notes,
      noise_notes,
      time_limit_notes
    } = body

    // Validation - required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Café name is required' },
        { status: 400 }
      )
    }

    if (!city || !city.trim()) {
      return NextResponse.json(
        { error: 'City is required' },
        { status: 400 }
      )
    }

    if (!address || !address.trim()) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      )
    }

    // Validate website URL format if provided
    if (website && website.trim()) {
      try {
        const url = new URL(website)
        // Reject localhost/127.0.0.1 URLs
        if (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname.startsWith('127.')) {
          return NextResponse.json(
            { error: 'Localhost URLs are not allowed. Please provide a public website URL.' },
            { status: 400 }
          )
        }
      } catch {
        return NextResponse.json(
          { error: 'Please provide a valid website URL' },
          { status: 400 }
        )
      }
    }

    // Validate Google Maps URL format if provided
    if (google_maps_url && google_maps_url.trim()) {
      try {
        new URL(google_maps_url)
      } catch {
        return NextResponse.json(
          { error: 'Please provide a valid Google Maps URL' },
          { status: 400 }
        )
      }
    }

    // Validate email format if provided
    if (submitter_email && submitter_email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(submitter_email.trim())) {
        return NextResponse.json(
          { error: 'Please provide a valid email address' },
          { status: 400 }
        )
      }
    }

    // Create Supabase client (validated at module load)
    const supabase = await createClient()

    // Basic rate limiting: Check for duplicate submissions in last hour
    // (Simple check - same name + city + address)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { data: recentSubmissions } = await supabase
      .from('submissions')
      .select('id')
      .eq('name', name.trim())
      .eq('city', city.trim())
      .eq('address', address.trim())
      .gte('created_at', oneHourAgo)
      .limit(1)

    if (recentSubmissions && recentSubmissions.length > 0) {
      return NextResponse.json(
        { error: 'A similar submission was recently submitted. Please wait before submitting again.' },
        { status: 429 }
      )
    }

    // Insert submission
    const { data, error } = await supabase
      .from('submissions')
      .insert([
        {
          name: name.trim(),
          city: city.trim(),
          address: address.trim(),
          website: website?.trim() || null,
          google_maps_url: google_maps_url?.trim() || null,
          submitter_email: submitter_email?.trim() || null,
          notes: notes?.trim() || null,
          wifi_notes: wifi_notes?.trim() || null,
          power_notes: power_notes?.trim() || null,
          noise_notes: noise_notes?.trim() || null,
          time_limit_notes: time_limit_notes?.trim() || null,
          status: 'pending',
          source: 'web',
        },
      ])
      .select()
      .single()

    if (error) {
      if (process.env.NEXT_PUBLIC_DEBUG_LOGS === 'true') {
        console.error('Error creating submission:', error)
      }
      return NextResponse.json(
        { error: 'Failed to submit café suggestion. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Submission received successfully', id: data.id },
      { status: 201 }
    )
  } catch (error) {
    if (process.env.NEXT_PUBLIC_DEBUG_LOGS === 'true') {
      console.error('Error processing submission:', error)
    }
    return NextResponse.json(
      { error: 'An error occurred while processing your submission' },
      { status: 500 }
    )
  }
}
