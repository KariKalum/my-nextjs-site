# SEO Implementation Checklist for Individual Cafe Page

## ✅ Completed Changes

### 1. Page-Level SEO Metadata (`app/cafe/[id]/page.tsx`)
- [x] Dynamic `<title>` based on cafe attributes:
  - Format: `{name} — Laptop-friendly cafe in {city} ({street/area})`
  - Falls back to `{name} — Cafe in {city} ({street/area})` if not work-friendly
  - Includes site name suffix
- [x] Meta description (140–160 chars) using work_score/overall_laptop_rating + wifi/power outlets + noise level + address
- [x] Canonical URL using place_id (or id as fallback)
- [x] Open Graph tags:
  - og:title, og:description, og:url, og:type, og:locale, og:siteName
  - og:image (if available)
- [x] Twitter Card tags:
  - twitter:card, twitter:title, twitter:description
  - twitter:images (if available)

### 2. On-Page SEO Structure (`components/CafeDetailSEO.tsx`)
- [x] Single H1: `{name} — Laptop-friendly cafe in {city}` format
- [x] Keyword-relevant H2 sections:
  - "Work-friendly overview"
  - "Wi-Fi & power outlets"
  - "Seating, space & comfort"
  - "Noise & vibe"
  - "Hours, policies & time limits"
  - "Location & directions"
  - "Frequently Asked Questions"
- [x] Natural language paragraphs + bullet summaries based on available data
- [x] Exact address, city/state/zip/country, phone, website as crawlable text
- [x] "Last updated" line using updated_at (human readable format)
- [x] Semantic HTML:
  - `<address>` for address information
  - `<time>` for hours
  - Proper heading hierarchy

### 3. JSON-LD Structured Data (`components/CafeStructuredData.tsx`)
- [x] Schema.org `CafeOrCoffeeShop` type
- [x] Core fields:
  - name, description, url (canonical), telephone, email
  - address (PostalAddress with all components)
  - geo (GeoCoordinates with lat/long)
  - openingHoursSpecification (parsed from hours object)
  - priceRange (from price_level)
  - aggregateRating (using google_rating + google_ratings_total if both exist)
  - sameAs (google_maps_url and website)
- [x] Review snippets from google_reviews (up to 3, only if data exists)

### 4. Rich Content Generation
- [x] Laptop-friendly scorecard component:
  - work_score, overall_laptop_rating
  - wifi_available/wifi_speed_rating
  - power_outlets_available/power_outlet_rating
  - noise_level
  - table_space_rating
  - comfortable_seating
  - natural_light/lighting_rating
- [x] Boolean fields converted to readable "Yes/No"
- [x] WiFi password shown behind "Show password" toggle (not plain text)
- [x] Time limit highlighted in "Policies" section
- [x] Reservation required and laptop_policy in "Policies" box

### 5. FAQ for SEO (`components/CafeFAQ.tsx`)
- [x] 6–10 FAQs generated based on available fields:
  - "Is {name} good for working on a laptop?"
  - "Does {name} have Wi-Fi? Is it fast?"
  - "Are power outlets available?"
  - "How noisy is it?"
  - "Is there a time limit for laptops?"
  - "Is {name} pet-friendly / has outdoor seating / wheelchair accessible?"
  - Additional FAQs based on available data
- [x] FAQPage JSON-LD structured data
- [x] Only includes questions whose answers are supported by data

### 6. Internal Linking
- [x] Link to city page: "More laptop-friendly cafes in {city}"
- [x] Nearby cafes section (fetches cafes in same city, excluding current cafe)
- [x] Breadcrumb navigation: Home > {city} > {name}

### 7. Technical SEO / Performance
- [x] Server-side rendering (Next.js App Router with server component data fetching)
- [x] generateMetadata() function for dynamic meta tags
- [x] Semantic HTML throughout
- [x] Map iframe has descriptive title and lazy loading

### 8. Additional Enhancements
- [x] Updated Cafe interface to include all new fields:
  - place_id, work_score, work_signals, is_work_friendly
  - google_rating, google_ratings_total, price_level, business_status
  - google_reviews, google_reviews_fetched_at
  - google_maps_url
- [x] Support for fetching cafes by place_id (in addition to id)
- [x] Helper functions for extracting street from address
- [x] SEO utility functions in `lib/seo/cafe-seo.ts`

## Files Created/Modified

### Created:
1. `lib/seo/cafe-seo.ts` - SEO helper functions
2. `components/CafeStructuredData.tsx` - JSON-LD structured data component
3. `components/CafeFAQ.tsx` - FAQ component with FAQPage JSON-LD
4. `components/CafeDetailSEO.tsx` - Complete SEO-rich cafe detail page

### Modified:
1. `lib/supabase.ts` - Extended Cafe interface with all new fields
2. `app/cafe/[id]/page.tsx`:
   - Enhanced generateMetadata() with improved title/description
   - Added support for place_id lookup
   - Added getNearbyCafes() function
   - Updated to use new CafeDetailSEO component

## Testing Checklist

- [ ] Verify title format matches specification
- [ ] Verify meta description is 140-160 chars
- [ ] Verify canonical URL uses place_id when available
- [ ] Verify Open Graph tags render correctly
- [ ] Verify Twitter Card tags render correctly
- [ ] Verify JSON-LD structured data validates (use Google Rich Results Test)
- [ ] Verify FAQPage JSON-LD validates
- [ ] Verify H1 is unique and formatted correctly
- [ ] Verify H2 sections are properly structured
- [ ] Verify all cafe fields are displayed when available
- [ ] Verify WiFi password is hidden by default
- [ ] Verify breadcrumb navigation works
- [ ] Verify internal links work correctly
- [ ] Verify nearby cafes section displays correctly
- [ ] Verify map has proper title and lazy loading
- [ ] Verify semantic HTML is used correctly
- [ ] Verify last updated date displays correctly
- [ ] Test with cafes that have different field combinations
- [ ] Test with cafes missing various fields (graceful fallbacks)

## Next Steps

1. Test the implementation with real cafe data
2. Validate JSON-LD using Google's Rich Results Test: https://search.google.com/test/rich-results
3. Test Open Graph tags using Facebook's Debugger: https://developers.facebook.com/tools/debug/
4. Test Twitter Card using Twitter Card Validator: https://cards-dev.twitter.com/validator
5. Monitor search console for any structured data errors
6. Consider adding breadcrumb structured data if needed
7. Consider adding review aggregation if not already covered
