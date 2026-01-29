import crypto from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'

// Mark as dynamic since we use cookies() via createClient()
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  // Generate requestId for tracking
  const requestId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  let step: 'start' | 'validate' | 'rate_limit' | 'insert_submission' | 'log_consent' | 'success' | 'unknown' = 'start'
  
  try {
    console.info('[submissions]', { requestId, step: 'start' })
    
    const body = await request.json()
    const { 
      name, 
      city, 
      address, 
      website, 
      google_maps_url,
      submitter_email,
      email_consent = false, // Default to false if not provided
      locale,
      notes, 
      wifi_notes,
      power_notes,
      noise_notes,
      time_limit_notes
    } = body

    step = 'validate'
    
    // Validation - required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { 
          ok: false,
          requestId,
          step: 'validate',
          error: { message: 'Café name is required' }
        },
        { status: 400 }
      )
    }

    if (!city || !city.trim()) {
      return NextResponse.json(
        { 
          ok: false,
          requestId,
          step: 'validate',
          error: { message: 'City is required' }
        },
        { status: 400 }
      )
    }

    if (!address || !address.trim()) {
      return NextResponse.json(
        { 
          ok: false,
          requestId,
          step: 'validate',
          error: { message: 'Address is required' }
        },
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
            { 
              ok: false,
              requestId,
              step: 'validate',
              error: { message: 'Localhost URLs are not allowed. Please provide a public website URL.' }
            },
            { status: 400 }
          )
        }
      } catch {
        return NextResponse.json(
          { 
            ok: false,
            requestId,
            step: 'validate',
            error: { message: 'Please provide a valid website URL' }
          },
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
          { 
            ok: false,
            requestId,
            step: 'validate',
            error: { message: 'Please provide a valid Google Maps URL' }
          },
          { status: 400 }
        )
      }
    }

    // Validate email format if provided
    if (submitter_email && submitter_email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(submitter_email.trim())) {
        return NextResponse.json(
          { 
            ok: false,
            requestId,
            step: 'validate',
            error: { message: 'Please provide a valid email address' }
          },
          { status: 400 }
        )
      }
    }

    // Create Supabase client (validated at module load)
    const supabase = await createClient()

    // Basic rate limiting: Check for duplicate submissions in last hour
    // (Simple check - same name + city + address)
    step = 'rate_limit'
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { data: recentSubmissions, error: rateLimitError } = await supabase
      .from('submissions')
      .select('id')
      .eq('name', name.trim())
      .eq('city', city.trim())
      .eq('address', address.trim())
      .gte('created_at', oneHourAgo)
      .limit(1)

    if (rateLimitError) {
      console.error('[submissions]', { requestId, step, code: rateLimitError.code, message: rateLimitError.message, details: rateLimitError.details, hint: rateLimitError.hint })
      return NextResponse.json(
        { 
          ok: false,
          requestId,
          step: 'rate_limit',
          error: { message: rateLimitError.message || 'Rate limit check failed', code: rateLimitError.code }
        },
        { status: 500 }
      )
    }

    if (recentSubmissions && recentSubmissions.length > 0) {
      return NextResponse.json(
        { 
          ok: false,
          requestId,
          step: 'rate_limit',
          error: { message: 'A similar submission was recently submitted. Please wait before submitting again.' }
        },
        { status: 429 }
      )
    }

    // Insert submission (core action - must succeed)
    step = 'insert_submission'
    const { error } = await supabase
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

    if (error) {
      console.error('[submissions]', { requestId, step, code: error.code, message: error.message, details: error.details, hint: error.hint })
      return NextResponse.json(
        { 
          ok: false,
          requestId,
          step: 'insert_submission',
          error: { message: error.message || 'Submission failed', code: error.code }
        },
        { status: 500 }
      )
    }

    // Handle email consent logging if submitter_email exists and email_consent is true
    // This is non-blocking - submission already succeeded, so consent logging failures don't fail the request
    if (submitter_email && submitter_email.trim() && email_consent === true) {
      step = 'log_consent'
      try {
        // Use locale from request body, fallback to Accept-Language header, or default to 'de'
        let consentLocale = locale || 'de'
        if (!consentLocale || (consentLocale !== 'en' && consentLocale !== 'de')) {
          const acceptLanguage = request.headers.get('accept-language') || ''
          if (acceptLanguage.includes('en')) {
            consentLocale = 'en'
          } else {
            consentLocale = 'de'
          }
        }

        // Get IP address from request
        const forwarded = request.headers.get('x-forwarded-for')
        const ip = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown'

        // Get user agent
        const userAgent = request.headers.get('user-agent') || 'unknown'

        // Insert into email_consent_log (non-blocking)
        const { error: consentError } = await supabase
          .from('email_consent_log')
          .insert([
            {
              purpose: 'notify_submission',
              consented: true,
              email: submitter_email.trim(),
              locale: consentLocale,
              ip: ip,
              user_agent: userAgent,
            },
          ])

        if (consentError) {
          console.error('[submissions]', { requestId, step, code: consentError.code, message: consentError.message, details: consentError.details, hint: consentError.hint })
          // Log the error but don't fail the submission - it was already successfully saved
        }

        // TODO: send to Brevo list
      } catch (consentLoggingError) {
        console.error('[submissions]', { requestId, step: 'log_consent', error: consentLoggingError })
        // Log the error but don't fail the submission - it was already successfully saved
      }
    }

    step = 'success'
    return NextResponse.json(
      { ok: true, requestId },
      { status: 201 }
    )
  } catch (error) {
    step = 'unknown'
    console.error('[submissions]', {
      requestId,
      step,
      code: undefined,
      message: (error as any)?.message ?? 'Unknown server error',
      details: undefined,
      hint: undefined,
    })
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { 
        ok: false,
        requestId,
        step: 'unknown',
        error: { message: errorMessage }
      },
      { status: 500 }
    )
  }
}
