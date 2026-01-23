# Bilingual Support (EN + DE) - READ-ONLY Audit Report

## 1. Framework/Router Confirmation

**Framework**: Next.js 14.0.0  
**Router**: App Router (confirmed by `app/` directory structure)  
**TypeScript**: Yes (strict mode enabled)

### Key Routing Files:
- `app/layout.tsx` - Root layout with `<html lang="en">`
- `app/page.tsx` - Homepage (server component)
- `middleware.ts` - Handles auth redirects (no i18n currently)
- `app/cafe/[id]/page.tsx` - Dynamic cafe detail route
- `app/cities/[city]/page.tsx` - Dynamic city route
- `app/find/[feature]/page.tsx` - Dynamic feature route

### Current Route Structure:
```
/                          → Homepage
/cafe/[id]                 → Cafe detail (place_id or UUID)
/cities                    → Cities index
/cities/[city]             → City detail (slug-based)
/find/[feature]            → Feature pages (wifi, outlets, quiet, time-limit)
/submit                    → Submission form
/admin/*                   → Admin routes (protected)
/api/*                     → API routes
```

**No i18n library detected** - No `next-intl`, `react-i18next`, or similar in dependencies.

---

## 2. Page Inventory

### Public Pages (Need i18n):
1. **Homepage** (`app/page.tsx`)
   - Server component
   - Hardcoded text: "Suggest a Café", "Browse by City →", "Access Denied", etc.
   - Uses: Hero, ValueProps, FeaturedCities, HomepageData, CommunityCTA

2. **Cafe Detail** (`app/cafe/[id]/page.tsx`)
   - Server component with `generateMetadata`
   - Dynamic route: `/cafe/[id]`
   - Uses: CafeDetailSEO component

3. **Cities Index** (`app/cities/page.tsx`)
   - Server component
   - Lists all cities with counts

4. **City Detail** (`app/cities/[city]/page.tsx`)
   - Server component with `generateMetadata`
   - Dynamic route: `/cities/[city]`
   - Hardcoded city intros in English

5. **Feature Pages** (`app/find/[feature]/page.tsx`)
   - Server component with `generateMetadata`
   - Dynamic route: `/find/[feature]`
   - Hardcoded feature configs (title, description)

6. **Submit Page** (`app/submit/page.tsx`)
   - Client component
   - Form with validation messages

### Admin Pages (May skip i18n or keep EN-only):
- `app/admin/page.tsx` - Dashboard
- `app/admin/cafes/[id]/edit/page.tsx` - Edit cafe
- `app/admin/cafes/new/page.tsx` - New cafe
- `app/admin/submissions/page.tsx` - Submissions

### API Routes (No i18n needed):
- `app/api/cafes/nearby/route.ts`
- `app/api/cafes/nearby-feature/route.ts`
- `app/api/submissions/route.ts`
- `app/api/admin/products/route.ts`

---

## 3. Data Flow Map

### Database Access Points:

**Server-Side (Supabase):**
- `src/lib/supabase/server.ts` - Server client creation
- `src/lib/cafes/homepage.ts` - `getTopRatedCafes()`, `getRecentlyAddedCafes()`
- `src/lib/cafes/cities.ts` - `getTopCitiesWithImages()`
- `app/cafe/[id]/page.tsx` - Direct Supabase query in `getCafe()`
- `app/cities/[city]/page.tsx` - Direct Supabase query in `getCafesByCity()`
- `app/sitemap.xml/route.ts` - Fetches cafes for sitemap

**Client-Side (Supabase):**
- `src/lib/supabase/client.ts` - Client client creation
- `components/home/Hero.tsx` - Fetches suggestions (cities, cafes)
- `components/CafeListing.tsx` - Fetches all cafes
- `components/FeaturePageTemplate.tsx` - Fetches nearby cafes via API

**API Routes:**
- `/api/cafes/nearby` - Returns JSON (no text)
- `/api/cafes/nearby-feature` - Returns JSON (no text)
- `/api/submissions` - Accepts form data, returns JSON

### Database Schema:
- **Table**: `cafes` (city names stored in `city` column - no i18n in DB)
- **Table**: `major_cities` (slug, image_url, name - no i18n in DB)
- **No multilingual fields** - All data is single-language

---

## 4. Static Text Inventory

### Hardcoded English Strings Found:

**Homepage (`app/page.tsx`):**
- "Suggest a Café"
- "Browse by City →"
- "Access Denied: You do not have admin privileges..."

**Hero Component (`components/home/Hero.tsx`):**
- "Find the Best Laptop-Friendly Cafés in Germany ☕💻"
- "Work remotely with fast Wi-Fi, power outlets, and quiet spaces."
- "Search by city or café (e.g. Berlin, Hamburg, coworking café)"
- "Searching…"
- "Search"
- "Popular:"
- "Submit a café"
- "Location access denied."
- "City" / "Café" (suggestion labels)

**ValueProps (`components/home/ValueProps.tsx`):**
- "Why Choose Our Directory"
- "Find cafés with all the amenities you need for productive remote work"
- "Fast Wi-Fi" / "Power Outlets" / "Quiet Spaces" / "Time-Limit Friendly"
- Descriptions for each feature

**FeaturedCities (`components/home/FeaturedCities.tsx`):**
- "Cities with Most Cafés"
- "Explore cities with the highest number of laptop-friendly cafés"
- "café" / "cafés" (pluralization)

**HomepageData (`components/home/HomepageData.tsx`):**
- "Top Rated to Work From"
- "Highest-rated cafés for productive remote work based on user reviews"
- "Recently Added"
- "Discover the newest laptop-friendly cafés added to our directory"
- "No cafés have been rated yet."
- "No cafés have been added yet. Be the first to add one!"

**CommunityNotice (`components/CommunityNotice.tsx`):**
- "Scout Brew is brewing better café intel."
- "These listings are AI-curated and evolving."
- "Review a café and help Scout Brew perfect it."
- "Learn more"
- "About Scout Brew"
- "Got it"

**CafeCard (`components/CafeCard.tsx`):**
- "Verified" (title attribute)
- "reviews" / "review" (pluralization)
- "Unavailable" (when link invalid)

**CafeDetail (`components/CafeDetail.tsx`):**
- Various labels: "Open in Maps", "Share", "Description", "Hours", etc.

**City Pages (`app/cities/[city]/page.tsx`):**
- City intro paragraphs (hardcoded in `cityIntros` object)
- "No cafés found in {city} yet."

**Feature Pages (`app/find/[feature]/page.tsx`):**
- Feature titles and descriptions in `FEATURE_CONFIGS`

**Metadata (`app/page.tsx`, `app/cafe/[id]/page.tsx`, etc.):**
- All `title` and `description` fields in `generateMetadata` functions

---

## 5. Minimal Safest i18n Plan

### Approach: Next.js App Router Internationalization (No External Library)

**Strategy**: Use Next.js 14's built-in routing with `[locale]` segments, avoiding external i18n libraries to minimize breaking changes.

### File-by-File Change List:

#### Phase 1: Core Infrastructure (No Breaking Changes)

1. **Create i18n utilities** (`lib/i18n/`):
   - `lib/i18n/config.ts` - Locale config (en, de), default locale
   - `lib/i18n/dictionaries.ts` - Translation dictionaries (EN/DE JSON objects)
   - `lib/i18n/get-dictionary.ts` - Server function to load dictionary by locale

2. **Update middleware** (`middleware.ts`):
   - Add locale detection (Accept-Language header, cookie, or default)
   - Rewrite `/` → `/en` or `/de` (or redirect)
   - Extract locale from path for routes like `/en/cafe/[id]`
   - Preserve existing admin/auth logic

3. **Create locale-aware root layout** (`app/[locale]/layout.tsx`):
   - Move current `app/layout.tsx` content here
   - Set `<html lang={locale}>`
   - Pass locale to children

4. **Update root layout** (`app/layout.tsx`):
   - Minimal wrapper that redirects to `/en` or detects locale

#### Phase 2: Route Restructuring (Breaking - Needs Careful Migration)

5. **Move pages to locale structure**:
   - `app/page.tsx` → `app/[locale]/page.tsx`
   - `app/cafe/[id]/page.tsx` → `app/[locale]/cafe/[id]/page.tsx`
   - `app/cities/page.tsx` → `app/[locale]/cities/page.tsx`
   - `app/cities/[city]/page.tsx` → `app/[locale]/cities/[city]/page.tsx`
   - `app/find/[feature]/page.tsx` → `app/[locale]/find/[feature]/page.tsx`
   - `app/submit/page.tsx` → `app/[locale]/submit/page.tsx`

6. **Update routing helpers** (`lib/cafeRouting.ts`):
   - `getCafeHref()` - Accept optional `locale` param, prefix with `/[locale]`
   - Update all `Link` components to include locale

7. **Update components** (gradual):
   - Replace hardcoded strings with `t('key')` calls
   - Pass `dictionary` prop or use context
   - Start with: Hero, ValueProps, HomepageData, CommunityNotice

#### Phase 3: Metadata & SEO

8. **Update metadata generation**:
   - `generateMetadata()` functions accept `{ params: { locale, ... } }`
   - Generate localized titles/descriptions from dictionary

9. **Update sitemap** (`app/sitemap.xml/route.ts`):
   - Generate URLs for both `/en/...` and `/de/...`
   - Add `hreflang` alternates

#### Phase 4: Data Layer (No Changes Needed)

10. **Database queries**: No changes required
    - All queries remain the same
    - City names, cafe names come from DB (single language)
    - Only UI text needs translation

### Files to Create:
```
lib/i18n/
  ├── config.ts              (NEW)
  ├── dictionaries.ts        (NEW)
  └── get-dictionary.ts       (NEW)

app/[locale]/
  ├── layout.tsx             (NEW - move from app/layout.tsx)
  ├── page.tsx                (MOVE from app/page.tsx)
  ├── cafe/[id]/page.tsx      (MOVE from app/cafe/[id]/page.tsx)
  ├── cities/
  │   ├── page.tsx            (MOVE from app/cities/page.tsx)
  │   └── [city]/page.tsx     (MOVE from app/cities/[city]/page.tsx)
  ├── find/[feature]/page.tsx (MOVE from app/find/[feature]/page.tsx)
  └── submit/page.tsx          (MOVE from app/submit/page.tsx)
```

### Files to Modify:
```
middleware.ts                 (ADD locale detection/rewrite)
app/layout.tsx                (MINIMAL - redirect to /[locale])
lib/cafeRouting.ts            (ADD locale param to getCafeHref)
components/home/Hero.tsx      (REPLACE strings with t())
components/home/ValueProps.tsx (REPLACE strings with t())
components/home/HomepageData.tsx (REPLACE strings with t())
components/CommunityNotice.tsx (REPLACE strings with t())
components/CafeCard.tsx       (REPLACE strings with t())
components/CafeDetail.tsx     (REPLACE strings with t())
app/[locale]/cafe/[id]/page.tsx (UPDATE generateMetadata)
app/[locale]/cities/[city]/page.tsx (UPDATE generateMetadata, cityIntros)
app/[locale]/find/[feature]/page.tsx (UPDATE FEATURE_CONFIGS)
app/sitemap.xml/route.ts      (ADD /en and /de URLs)
```

### Estimated Files Changed: ~25-30 files

---

## 6. Rollback Plan

### If Implementation Fails:

**Immediate Rollback Steps:**

1. **Git Revert** (if using git):
   ```bash
   git log --oneline  # Find commit before i18n changes
   git revert <commit-hash>
   # OR
   git reset --hard <commit-before-i18n>
   ```

2. **Manual Rollback** (if no git):
   - Delete `app/[locale]/` directory
   - Restore original `app/page.tsx`, `app/cafe/[id]/page.tsx`, etc. from backup
   - Restore `middleware.ts` to original (remove locale logic)
   - Restore `lib/cafeRouting.ts` (remove locale param)
   - Restore all component files (remove `t()` calls, restore hardcoded strings)
   - Delete `lib/i18n/` directory

3. **Database**: No changes needed (no DB modifications)

4. **Environment Variables**: No new env vars required

### Pre-Implementation Backup:

**Before starting, backup these directories:**
- `app/` (entire directory)
- `components/` (entire directory)
- `lib/cafeRouting.ts`
- `middleware.ts`
- `next.config.js`

**Or use git:**
```bash
git checkout -b i18n-implementation
# Make changes
# If fails: git checkout main && git branch -D i18n-implementation
```

---

## 7. Risk Assessment

### Low Risk:
- ✅ Database queries (no changes)
- ✅ API routes (no changes)
- ✅ Component logic (only string replacement)

### Medium Risk:
- ⚠️ Route restructuring (breaking URLs - need redirects)
- ⚠️ Middleware changes (could break auth if not careful)
- ⚠️ Link generation (all `Link` components need locale)

### High Risk:
- 🔴 URL changes break existing bookmarks/SEO
- 🔴 Missing locale in links causes 404s
- 🔴 Metadata generation breaks if locale missing

### Mitigation:
1. **Add redirects**: `/cafe/[id]` → `/en/cafe/[id]` (in middleware)
2. **Default locale**: Always default to `/en` if locale missing
3. **Test thoroughly**: All routes, all links, all metadata
4. **Gradual rollout**: Implement one page at a time, test, then continue

---

## 8. Implementation Order (Safest)

1. **Week 1**: Infrastructure only (no route changes)
   - Create i18n utilities
   - Create dictionaries
   - Test dictionary loading

2. **Week 2**: Single page migration (test pattern)
   - Move `app/page.tsx` → `app/[locale]/page.tsx`
   - Update middleware for locale detection
   - Update Hero component only
   - Test thoroughly

3. **Week 3**: Remaining pages
   - Move other pages to `[locale]` structure
   - Update all components gradually
   - Test each page

4. **Week 4**: Polish & SEO
   - Update sitemap
   - Add redirects
   - Fix any broken links
   - Final testing

---

## 9. Key Considerations

### Database:
- **No multilingual fields** - City names, cafe names are single-language
- **Translation happens in UI only** - DB remains unchanged

### URLs:
- Current: `/cafe/ChIJ...` → New: `/en/cafe/ChIJ...` or `/de/cafe/ChIJ...`
- **SEO Impact**: Need 301 redirects or `hreflang` tags

### Components:
- **Server Components**: Receive `locale` from route params, load dictionary server-side
- **Client Components**: Receive `dictionary` as prop or use context

### Links:
- All `Link` components must include locale prefix
- Helper function: `getLocalizedHref(href, locale)` recommended

### Metadata:
- All `generateMetadata` functions need locale-aware titles/descriptions
- Use dictionary for SEO text

---

## 10. No-Change Zones (Safe)

These areas require **NO changes**:
- ✅ Database schema
- ✅ Supabase queries
- ✅ API route handlers (they return JSON, no text)
- ✅ Admin pages (can remain EN-only)
- ✅ Authentication logic
- ✅ Data fetching functions (`getTopRatedCafes`, etc.)

---

## Summary

**Current State**: Monolingual (English), App Router, no i18n library  
**Target State**: Bilingual (EN/DE) with `/en` and `/de` prefixes  
**Complexity**: Medium (route restructuring required)  
**Risk Level**: Medium (breaking URL changes, but rollback is straightforward)  
**Estimated Effort**: 4-6 weeks for safe, gradual implementation

**Recommended Approach**: Use Next.js built-in routing with `[locale]` segments, avoid external i18n libraries, implement gradually with thorough testing at each step.
