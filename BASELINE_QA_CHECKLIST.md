# Baseline QA Checklist - Pre-i18n Implementation

**Branch**: `i18n-en-de`  
**Date**: Baseline established before i18n changes  
**Purpose**: Document current site behavior to compare against after i18n implementation

---

## Setup Commands

### Install Dependencies
```bash
npm install
```

### Development Server
```bash
npm run dev
```
**Expected**: Server starts on `http://localhost:3000`  
**Verify**: No console errors, homepage loads

### Type Checking
```bash
npx tsc --noEmit
```
**Expected**: Exit code 0, no TypeScript errors

### Linting
```bash
npm run lint
```
**Note**: ESLint may not be installed (informational only). Next.js build includes linting.

### Build
```bash
npm run build
```
**Expected**: 
- ✓ Compiled successfully
- ✓ Generating static pages (11/11)
- Exit code 0

### Tests (if applicable)
```bash
npm test
```
**Expected**: All tests pass (or no tests present)

---

## Top Public URLs to Test

### 1. Homepage
**URL**: `http://localhost:3000/`

**Checklist**:
- [ ] Page loads without errors
- [ ] Header displays: Logo, "Suggest a Café", "Browse by City →"
- [ ] Community Notice banner appears (☕ "Scout Brew is brewing better café intel...")
- [ ] Hero section: "Find the Best Laptop-Friendly Cafés in Germany ☕💻"
- [ ] Search input placeholder: "Search by city or café (e.g. Berlin, Hamburg, coworking café)"
- [ ] "Popular:" section shows: Berlin, Hamburg, Munich, Cologne, Frankfurt
- [ ] "Submit a café" link works
- [ ] "Cities with Most Cafés" section displays (if data exists)
- [ ] "Top Rated to Work From" section displays (if data exists)
- [ ] "Recently Added" section displays (if data exists)
- [ ] "Why Choose Our Directory" tiles: Fast Wi-Fi, Power Outlets, Quiet Spaces, Time-Limit Friendly
- [ ] No console errors (check browser DevTools)
- [ ] No PGRST205 or Supabase errors

**Screenshot**: Full homepage (scroll to capture all sections)

---

### 2. Cities Index
**URL**: `http://localhost:3000/cities`

**Checklist**:
- [ ] Page loads without errors
- [ ] Title: "Cities - Laptop Friendly Cafés in Germany"
- [ ] Lists all cities with café counts
- [ ] City links are clickable
- [ ] No console errors

**Screenshot**: Cities list page

---

### 3. City Detail Page
**URL**: `http://localhost:3000/cities/berlin` (or any city with cafes)

**Checklist**:
- [ ] Page loads without errors
- [ ] City name displayed in title/heading
- [ ] City intro paragraph displays (e.g., "Berlin, Germany's vibrant capital...")
- [ ] Café cards display for that city
- [ ] Each café card shows: name, address, rating, work score
- [ ] "No cafés found in {city} yet." if empty
- [ ] No console errors

**Screenshot**: City detail page with cafes

---

### 4. Feature Pages
**URLs**:
- `http://localhost:3000/find/wifi`
- `http://localhost:3000/find/outlets`
- `http://localhost:3000/find/quiet`
- `http://localhost:3000/find/time-limit`

**Checklist** (for each feature):
- [ ] Page loads without errors
- [ ] Title matches feature (e.g., "Find cafés with fast Wi-Fi")
- [ ] Description displays correctly
- [ ] Google Map widget loads (if location granted)
- [ ] "Use my location" button works
- [ ] Manual location input works (if location denied)
- [ ] Results list displays nearby cafés (if location provided)
- [ ] Café cards in results are clickable
- [ ] No console errors

**Screenshot**: One feature page (e.g., `/find/wifi`)

---

### 5. Cafe Detail Page
**URL**: `http://localhost:3000/cafe/{place_id}` or `http://localhost:3000/cafe/{uuid}`

**Checklist**:
- [ ] Page loads without errors
- [ ] H1 title format: "{Cafe Name} — Laptop-friendly cafe in {City}"
- [ ] Address appears once (no duplicates)
- [ ] Verification badge: "✅ Verified by Scout Brew" or "🕵️ AI-checked by Scout Brew"
- [ ] "📍 Open in Maps" button works (opens Google Maps)
- [ ] "🔗 Share" button works (copies URL)
- [ ] Map embed displays with pin (not blank)
- [ ] Info card: rating, price level, business status, phone, website
- [ ] Hours section displays (or "Hours not available yet")
- [ ] Description section displays (combined description + ai_inference_notes)
- [ ] Laptop-friendly insights: work_score, ai_confidence, wifi, outlets, noise, policy
- [ ] FAQ section: 5 questions with answers
- [ ] No console errors

**Screenshot**: Full cafe detail page (scroll to capture all sections)

---

### 6. Submit Page
**URL**: `http://localhost:3000/submit`

**Checklist**:
- [ ] Page loads without errors
- [ ] Form fields: name, city, address, website, Google Maps URL, email, notes
- [ ] Required field validation works
- [ ] "Submit" button works
- [ ] Success message displays after submission
- [ ] Error messages display for invalid inputs
- [ ] No console errors

**Screenshot**: Submit form page

---

## Baseline Screenshot List (Recommended)

Capture these pages visually before i18n changes:

1. **Homepage** (`/`)
   - Full page scroll (all sections)
   - Header/navigation
   - Hero section
   - Cities section
   - Top Rated section
   - Recently Added section

2. **City Detail** (`/cities/berlin` or similar)
   - Full page with café cards

3. **Cafe Detail** (`/cafe/{id}`)
   - Full page scroll (header, map, info, description, FAQ)

4. **Feature Page** (`/find/wifi`)
   - Map widget
   - Results list

5. **Submit Page** (`/submit`)
   - Full form

**Storage**: Save screenshots in `docs/baseline-screenshots/` (create directory if needed)

---

## Functional Tests

### Navigation
- [ ] All header links work
- [ ] All footer links work (if present)
- [ ] Breadcrumbs work (if present)
- [ ] "Back" buttons work

### Search
- [ ] Homepage search input accepts text
- [ ] Suggestions dropdown appears
- [ ] City suggestions work
- [ ] Café suggestions work
- [ ] "Use my location" button works
- [ ] Search results page loads

### Forms
- [ ] Submit form validation works
- [ ] Required fields show errors
- [ ] Form submission succeeds
- [ ] Success message displays

### Links
- [ ] All café card links work
- [ ] All city card links work
- [ ] All "View all" links work
- [ ] External links (Google Maps, websites) open in new tab

### Responsive
- [ ] Mobile view (< 768px): Logo centered, 2-column grids
- [ ] Desktop view (≥ 768px): Logo left-aligned, multi-column grids
- [ ] Tablet view: Appropriate breakpoints

---

## Performance Baseline

### Build Metrics
- [ ] Build time: Record `npm run build` duration
- [ ] Bundle sizes: Note First Load JS sizes from build output
- [ ] Static pages: Count of pre-rendered pages

### Runtime Metrics (Optional)
- [ ] Homepage load time (Lighthouse)
- [ ] Time to First Contentful Paint
- [ ] Largest Contentful Paint

---

## Error States

### Test Error Handling
- [ ] Invalid cafe ID → 404 page displays
- [ ] Invalid city slug → 404 page displays
- [ ] Invalid feature → 404 page displays
- [ ] Network error → Error message displays (not crash)
- [ ] Missing Supabase env → Clear error message

---

## Browser Compatibility

Test in:
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest, if available)
- [ ] Mobile browser (Chrome Mobile)

---

## Console Checks

### Browser Console (F12)
- [ ] No JavaScript errors
- [ ] No React warnings
- [ ] No 404s for assets (images, fonts, etc.)
- [ ] No CORS errors
- [ ] No Supabase connection errors

### Server Console (Terminal)
- [ ] No unhandled promise rejections
- [ ] No database query errors
- [ ] No middleware errors

---

## Data Verification

### Database Queries
- [ ] Homepage fetches top rated cafes (10 items)
- [ ] Homepage fetches recently added cafes (10 items)
- [ ] Homepage fetches top cities (5 items)
- [ ] City pages fetch cafes by city name
- [ ] Cafe detail pages fetch by place_id or id
- [ ] Feature pages fetch nearby cafes via API

### API Endpoints
- [ ] `/api/cafes/nearby?lat=...&lng=...` returns JSON
- [ ] `/api/cafes/nearby-feature?lat=...&lng=...&feature=wifi` returns JSON
- [ ] `/api/submissions` accepts POST, returns JSON

---

## Accessibility Baseline (Quick Check)

- [ ] All images have `alt` attributes
- [ ] All links have descriptive text
- [ ] Form inputs have labels
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Focus states visible
- [ ] No color-only information (text + icon)

---

## SEO Baseline

### Metadata
- [ ] Homepage has correct `<title>` and `<meta description>`
- [ ] Cafe detail pages have dynamic titles
- [ ] City pages have SEO-friendly titles
- [ ] OpenGraph tags present (check with social media debugger)

### Sitemap
- [ ] `/sitemap.xml` loads
- [ ] Contains homepage, cities, cafes
- [ ] URLs are valid

### Robots
- [ ] `/robots.txt` loads
- [ ] Allows crawling (or blocks as intended)

---

## Notes

**Current State**:
- All text is in English
- No locale prefixes in URLs
- No language switcher
- Database stores single-language data (city names, cafe names)

**After i18n Implementation**:
- Compare all above items
- URLs will have `/en` or `/de` prefix
- Text should match selected language
- Functionality should remain identical

---

## Sign-off

**Baseline Established**: [Date]  
**Tester**: [Name]  
**Branch**: `i18n-en-de`  
**Status**: ✅ Ready for i18n implementation

---

## Quick Reference: Commands

```bash
# Setup
npm install

# Development
npm run dev                    # Start dev server (http://localhost:3000)

# Quality Checks
npx tsc --noEmit              # TypeScript check
npm run lint                  # Lint check (may require ESLint install)
npm run build                 # Production build
npm test                      # Run tests (if available)

# Git
git checkout -b i18n-en-de   # Create branch (already done)
git status                    # Check current branch
```

---

**Next Step**: After baseline is verified, proceed with i18n implementation following the plan in `I18N_AUDIT_REPORT.md`.
