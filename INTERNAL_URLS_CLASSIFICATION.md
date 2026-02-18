# Internal URLs from workfrom.cafe – Classification

Base: **https://workfrom.cafe**  
All public routes are locale-prefixed: `/{locale}/...` (locales: `en`, `de`). Root `/` redirects to `/de`.

---

## 1. Indexable pages

Canonical, unique content, linked in sitemap (or intended for indexing). Good targets for organic search.

| URL pattern | Example | Notes |
|-------------|---------|--------|
| **Home** | `/de`, `/en` | Sitemap, priority 1.0 |
| **Cities index** | `/de/cities`, `/en/cities` | Sitemap, priority 0.9 |
| **Submit** | `/de/submit`, `/en/submit` | Sitemap, priority 0.8 |
| **How it works** | `/de/how-it-works`, `/en/how-it-works` | Linked from home; has full content & hreflang; **not in sitemap** (consider adding) |
| **Find: feature pages** | `/de/find/wifi`, `/en/find/outlets`, … | Sitemap. Features: `wifi`, `outlets`, `quiet`, `time-limit`, `work-hubs` |
| **City hub** | `/de/cities/berlin`, `/en/cities/munich`, … | Sitemap; cities from DB or fallback list |
| **Berlin districts** | `/de/cities/berlin/mitte`, `/en/cities/berlin/neukoelln`, … | Sitemap. Districts: `mitte`, `charlottenburg`, `prenzlauer-berg`, `neukoelln`, `kreuzberg`, `friedrichshain`, `hbf` |
| **City intent: work** | `/de/cities/berlin/work`, `/en/cities/hamburg/work`, … | Sitemap, priority 0.75 |
| **City intent: laptop-friendly** | `/de/cities/berlin/laptop-friendly`, … | Sitemap, priority 0.75 |
| **Berlin district + work** | `/de/cities/berlin/mitte/work`, … | Sitemap, priority 0.72 |
| **Cafe detail** | `/de/cafe/ChIJ...`, `/en/cafe/<uuid>`, … | Sitemap; identifier = `place_id` (ChIJ...) or `id` (UUID) |

**Full URL examples (indexable):**

- `https://workfrom.cafe/de`
- `https://workfrom.cafe/en/cities`
- `https://workfrom.cafe/de/submit`
- `https://workfrom.cafe/de/how-it-works`
- `https://workfrom.cafe/en/find/wifi`
- `https://workfrom.cafe/de/find/outlets`
- `https://workfrom.cafe/de/find/quiet`
- `https://workfrom.cafe/de/find/time-limit`
- `https://workfrom.cafe/de/find/work-hubs`
- `https://workfrom.cafe/de/cities/berlin`
- `https://workfrom.cafe/de/cities/berlin/mitte`
- `https://workfrom.cafe/de/cities/berlin/work`
- `https://workfrom.cafe/de/cities/berlin/laptop-friendly`
- `https://workfrom.cafe/de/cities/berlin/mitte/work`
- `https://workfrom.cafe/de/cafe/<place_id-or-uuid>`

---

## 2. Thin / duplicate pages

Low added value or high overlap with other URLs; consider noindex or consolidation.

| URL pattern | Example | Reason |
|-------------|---------|--------|
| **City search (query)** | `/de/cities?q=...`, `/en/cities?q=...` | Parameterized; many combinations; results may be thin or duplicate city hub content. |
| **Invalid find feature** | `/de/find/<unknown>`, `/en/find/foo` | Renders “feature not found”; effectively thin. (Valid features: `wifi`, `outlets`, `quiet`, `time-limit`, `work-hubs`.) |

No other obvious thin-content patterns found in the app (e.g. no pagination or sort variants in sitemap).

---

## 3. Parameterized or low-value pages

Utility, auth, or infinite/variable URLs. Should not be indexed (noindex and/or blocked in robots).

| URL pattern | Example | Reason |
|-------------|---------|--------|
| **Login + redirect** | `/login`, `/login?redirect=...` | Auth; redirect param creates many URLs. Should be noindex. |
| **Auth callback** | `/de/auth/callback`, `/en/auth/callback` (with `?next=...`) | OAuth callback; transient, should be noindex. |
| **Admin (all)** | `/admin`, `/admin/cafes/new`, `/admin/submissions`, `/admin/submissions/[id]`, `/admin/edit-suggestions`, `/admin/edit-suggestions/[id]`, `/admin/reviews`, `/admin/reviews/[id]` | Back-office; **Disallow: /admin** in `robots.txt`. Not for crawling. |
| **API routes** | `/api/...` | Not HTML pages; **Disallow: /api** in `robots.txt`. |
| **Cafe fallback** | `/de/cities`, `/en/cities` (when linked as “cafe unavailable”) | Same path as cities index; not a separate pattern. |
| **404 / error** | Not-found and error pages | Low value; typically not linked in sitemap. |

**Admin URL examples (blocked by robots, internal only):**

- `https://workfrom.cafe/admin`
- `https://workfrom.cafe/admin/cafes/new`
- `https://workfrom.cafe/admin/submissions`
- `https://workfrom.cafe/admin/submissions/[id]`
- `https://workfrom.cafe/admin/edit-suggestions`
- `https://workfrom.cafe/admin/edit-suggestions/[id]`
- `https://workfrom.cafe/admin/reviews`
- `https://workfrom.cafe/admin/reviews/[id]`
- `https://workfrom.cafe/admin/cafes/[id]/edit`

**Parameterized / utility (noindex recommended):**

- `https://workfrom.cafe/login`
- `https://workfrom.cafe/login?redirect=...`
- `https://workfrom.cafe/de/auth/callback?next=...`
- `https://workfrom.cafe/en/auth/callback?next=...`

---

## Summary

| Category | Count (pattern level) | Crawl / index |
|----------|------------------------|----------------|
| **Indexable** | Home, cities index, submit, how-it-works, 5 find features, city hubs, Berlin districts, city/district intent pages, cafe details | Allow; in sitemap (add how-it-works if desired) |
| **Thin/duplicate** | City search `?q=`, invalid `/find/[feature]` | Optional noindex or canonical to main page |
| **Parameterized / low-value** | Login, auth callback, admin, API, 404/error | Noindex; admin and API already Disallow in robots.txt |

---

## Source of truth in codebase

- **Routes:** `app/[locale]/` (page.tsx), `app/admin/`, `app/login/`, `app/auth/callback/`, `app/api/`
- **Sitemap:** `app/sitemap.xml/route.ts`
- **Robots:** `app/robots.txt/route.ts` (Disallow: /admin, /api)
- **Locales:** `lib/i18n/config.ts` (`en`, `de`)
- **Cafe URLs:** `lib/cafeRouting.ts` (`getCafeHref` → `/[locale]/cafe/[id]`)
- **Berlin districts:** `app/sitemap.xml/route.ts` (berlinDistricts array)
