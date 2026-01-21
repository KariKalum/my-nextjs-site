# Supabase Security & Best Practices Audit Report

**Date**: 2024-01-XX  
**Project**: Café Directory  
**Auditor**: AI Assistant

---

## Executive Summary

This audit examined the project's Supabase implementation for security issues, best practices, and potential improvements. The project generally follows good practices but has several areas that need attention.

**Overall Grade: B+** ⚠️

**Key Findings:**
- ✅ Good: Client/server separation mostly correct
- ⚠️ **CRITICAL**: Old `lib/supabase.ts` with placeholder keys used in client components
- ⚠️ **CRITICAL**: Admin pages using client-side Supabase client instead of service role in API routes
- ⚠️ **SECURITY**: RLS policies allow any authenticated user to modify cafes (should be admin-only)
- ⚠️ **CONFIG**: Multiple Supabase client implementations causing confusion

---

## 1. Environment Variables

### ✅ **GOOD**: `.env.local` is properly gitignored
- `.gitignore` correctly excludes `.env*.local` and `.env`
- No secrets committed to repository

### ⚠️ **ISSUE**: Missing environment variable validation
- No validation that required variables are set at build time
- Missing `SUPABASE_SERVICE_ROLE_KEY` documentation in some places

**Recommendation:**
- Add runtime validation in API routes
- Create `.env.example` file with all required variables
- Document which variables are required vs optional

---

## 2. Client vs Server Usage

### ✅ **GOOD**: Proper separation in most places
- `lib/supabase-client.ts`: Correctly marked with `'use client'`, uses `@supabase/ssr`
- `lib/supabase-server.ts`: Server-only, uses cookies correctly
- `lib/supabase-service.ts`: Server-only, uses SERVICE_ROLE_KEY properly

### ❌ **CRITICAL ISSUE**: Old `lib/supabase.ts` still in use
**Location**: `lib/supabase.ts`

**Problem:**
```typescript
// lib/supabase.ts - Creates a client at module level
export const supabase = createClient(url, key)
```

This file:
1. Uses placeholder values when env vars are missing
2. Creates a singleton client instance
3. Is imported in **client components** (`components/CafeListing.tsx`, `app/admin/submissions/page.tsx`)
4. Doesn't use `@supabase/ssr` for proper cookie handling

**Impact:**
- Client components may not have proper session handling
- Placeholder keys could cause confusion
- Mixing with proper SSR clients causes inconsistencies

**Files using `lib/supabase.ts`:**
- `components/CafeListing.tsx` (client component)
- `app/admin/submissions/page.tsx` (client component)
- `components/CafeForm.tsx` (client component)
- `app/api/submissions/route.ts` (API route - should use service role!)
- `app/cafe/[id]/page.tsx` (server component - should use server client)
- `app/sitemap.xml/route.ts` (server route)
- `app/cities/[city]/page.tsx` (server component)
- `app/admin/page.tsx` (client component)
- `app/admin/cafes/[id]/edit/page.tsx` (server component)

**Recommendation:**
1. **DEPRECATE** `lib/supabase.ts` immediately
2. Migrate client components to `lib/supabase-client.ts`
3. Migrate server components to `lib/supabase-server.ts`
4. Migrate API routes to use `lib/supabase-service.ts` for admin operations

### ⚠️ **ISSUE**: Admin operations in client components
**Location**: `app/admin/submissions/page.tsx`

**Problem:**
```typescript
// This is a CLIENT component doing admin operations
const { data: createdCafe, error: cafeError } = await supabase
  .from('cafes')
  .insert([cafeData])
```

Client-side admin operations:
- Bypass API route security
- Expose business logic to browser
- Can't properly handle service role key
- No rate limiting or additional validation

**Recommendation:**
Create API routes for admin operations:
- `POST /api/admin/cafes` - Create cafe
- `PUT /api/admin/cafes/[id]` - Update cafe
- `DELETE /api/admin/cafes/[id]` - Delete cafe
- `PATCH /api/admin/submissions/[id]/approve` - Approve submission
- `PATCH /api/admin/submissions/[id]/reject` - Reject submission

Then use service role key in these routes.

### ⚠️ **ISSUE**: API route using wrong client
**Location**: `app/api/submissions/route.ts`

**Problem:**
```typescript
import { supabase } from '@/lib/supabase' // Old client, not service role
```

Public submission API should:
- Use anon key (correct for public writes)
- But should be more explicit about which client it's using

**Recommendation:**
Use `lib/supabase-server.ts` for clarity, or create a dedicated public client.

---

## 3. Row Level Security (RLS)

### ✅ **GOOD**: RLS is enabled on all tables
- Migration `20240101000009_secure_rls_policies.sql` properly enables RLS
- Public read access is correctly configured

### ❌ **CRITICAL ISSUE**: Any authenticated user can modify cafes
**Location**: `supabase/migrations/20240101000009_secure_rls_policies.sql`

**Problem:**
```sql
CREATE POLICY "Authenticated users can insert cafes"
ON cafes
FOR INSERT
TO authenticated
WITH CHECK (true); -- ⚠️ Any authenticated user!
```

This policy allows **ANY** authenticated user to:
- Insert cafes
- Update cafes
- Delete cafes

**Expected Behavior:**
Only admins (users in `admin_users` table) should be able to modify cafes.

**Recommendation:**
```sql
-- Better policy example:
CREATE POLICY "Only admins can insert cafes"
ON cafes
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.user_id = auth.uid()
  )
);
```

Apply similar logic to UPDATE and DELETE policies.

### ✅ **GOOD**: Public can read, authenticated can write submissions
The submissions table has proper policies for public inserts.

### ⚠️ **ISSUE**: Conflicting migrations
Two migrations affect RLS:
1. `20240101000005_enable_public_access.sql` - Allows public write access
2. `20240101000009_secure_rls_policies.sql` - Removes public write access

**Recommendation:**
- Consolidate migrations
- Remove `20240101000005_enable_public_access.sql` if not needed for backwards compatibility
- Document which migration should be run in production

---

## 4. Service Role Key Security

### ✅ **EXCELLENT**: Service role key properly protected
- `lib/supabase-service.ts` has clear warnings
- Only used in server-side contexts
- Not exposed to client

### ✅ **GOOD**: Environment variable naming
- Uses `SUPABASE_SERVICE_ROLE_KEY` (not in `NEXT_PUBLIC_*`)
- Correctly not exposed to browser

### ⚠️ **MINOR**: Missing validation in some API routes
The example API route `app/api/admin/products/route.ts` has good comments but no actual admin check.

**Recommendation:**
Implement admin check in all admin API routes:
```typescript
import { createClient } from '@/lib/supabase-server'
import { isAdmin } from '@/lib/admin' // Or similar

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user || !await isAdmin(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  
  // Use service role key here
}
```

---

## 5. Authentication & Authorization

### ✅ **GOOD**: Middleware protects admin routes
- `middleware.ts` correctly checks authentication
- Redirects unauthenticated users to login

### ⚠️ **ISSUE**: No admin role check in middleware
**Location**: `middleware.ts`

**Problem:**
Middleware only checks if user is authenticated, not if they're an admin.

**Current:**
```typescript
if (!user) {
  // Redirect to login
}
```

**Should be:**
```typescript
if (!user || !await isAdmin(user)) {
  // Redirect or return 403
}
```

**Recommendation:**
Add admin check in middleware for `/admin/*` routes.

### ✅ **GOOD**: Client components check auth state
`app/admin/layout.tsx` properly checks user and redirects if needed.

---

## 6. API Route Security

### ❌ **CRITICAL**: Public submission API has rate limiting issues
**Location**: `app/api/submissions/route.ts`

**Current Rate Limiting:**
```typescript
// Only checks for duplicate in last hour
const { data: recentSubmissions } = await supabase
  .from('submissions')
  .select('id')
  .eq('name', name.trim())
  .eq('city', city.trim())
  .eq('address', address.trim())
  .gte('created_at', oneHourAgo)
  .limit(1)
```

**Problems:**
1. Rate limiting is too simple (same name/city/address only)
2. No IP-based rate limiting
3. No CAPTCHA for public submissions
4. Could be bypassed with slightly different addresses

**Recommendation:**
- Implement IP-based rate limiting
- Add CAPTCHA for public submissions
- Use a rate limiting library or service

### ✅ **GOOD**: Input validation
Submission API properly validates:
- Required fields
- URL format
- Email format

---

## 7. Code Organization

### ⚠️ **ISSUE**: Multiple Supabase client implementations
The project has:
1. `lib/supabase.ts` - Old, should be deprecated
2. `lib/supabase-client.ts` - Client components (correct)
3. `lib/supabase-server.ts` - Server components (correct)
4. `lib/supabase-service.ts` - Service role (correct)
5. `src/lib/supabaseClient.ts` - Another client? (duplicate)

**Recommendation:**
- Consolidate to 3 clients:
  1. Client: `lib/supabase-client.ts`
  2. Server: `lib/supabase-server.ts`
  3. Service: `lib/supabase-service.ts`
- Remove `lib/supabase.ts` after migration
- Remove `src/lib/supabaseClient.ts` if duplicate

---

## 8. Error Handling

### ✅ **GOOD**: Error handling in most components
- Components handle Supabase errors gracefully
- Mock data fallback in development

### ⚠️ **ISSUE**: Error messages may leak information
Some error messages might reveal database structure:
```typescript
if (error.message?.includes('column') || error.code === '42703') {
  // Reveals column names don't exist
}
```

**Recommendation:**
- Sanitize error messages before showing to users
- Log detailed errors server-side only
- Show generic messages to clients

---

## Priority Action Items

### 🔴 **CRITICAL** (Fix Immediately)
1. **Migrate away from `lib/supabase.ts`**
   - Replace all imports with appropriate client
   - Client components → `lib/supabase-client.ts`
   - Server components → `lib/supabase-server.ts`
   - API routes → `lib/supabase-service.ts`

2. **Fix RLS policies to require admin role**
   - Update policies to check `admin_users` table
   - Prevent any authenticated user from modifying cafes

3. **Move admin operations to API routes**
   - Create API routes for approve/reject submissions
   - Create API routes for CRUD cafes
   - Use service role key in these routes

4. **Add admin check to middleware**
   - Verify user is admin before allowing `/admin/*` access

### 🟡 **HIGH** (Fix Soon)
5. **Consolidate Supabase client files**
   - Remove duplicate implementations
   - Document which client to use where

6. **Improve rate limiting**
   - Add IP-based rate limiting
   - Consider CAPTCHA for public submissions

7. **Sanitize error messages**
   - Don't expose database structure in client errors

### 🟢 **MEDIUM** (Nice to Have)
8. **Add environment variable validation**
   - Validate at build time
   - Create `.env.example`

9. **Add API route tests**
   - Test authentication/authorization
   - Test rate limiting

10. **Document client usage patterns**
    - Clear guide on which client to use when

---

## Security Best Practices Checklist

- [x] SERVICE_ROLE_KEY never exposed to client
- [x] RLS enabled on all tables
- [ ] RLS policies restrict access appropriately (⚠️ any authenticated user can modify)
- [x] Environment variables gitignored
- [ ] Admin operations require admin role check (⚠️ missing in RLS)
- [ ] Rate limiting on public APIs (⚠️ basic only)
- [x] Input validation on public APIs
- [ ] Error messages don't leak info (⚠️ some do)
- [ ] API routes use service role when needed (⚠️ some don't)
- [ ] Client/server separation clear (⚠️ mixed usage)

---

## Conclusion

The project shows good understanding of Supabase security fundamentals but has several critical issues that need immediate attention:

1. **Migration away from legacy `lib/supabase.ts`** is the highest priority
2. **RLS policies are too permissive** - any authenticated user can modify cafes
3. **Admin operations should move to API routes** for better security and control

Once these issues are addressed, the project will follow Supabase best practices and be production-ready from a security perspective.

---

## Additional Resources

- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Middleware with Supabase](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [RLS Policy Examples](https://supabase.com/docs/guides/auth/row-level-security#policies)
