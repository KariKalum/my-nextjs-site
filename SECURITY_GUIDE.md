# Supabase Security Guide

## Why SERVICE_ROLE_KEY Must Never Be Exposed to the Browser

### The SERVICE_ROLE_KEY is Like a Master Password

The `SERVICE_ROLE_KEY` is essentially a **master key** to your Supabase database. Here's why it must never reach the browser:

### 1. **Bypasses All Security Policies**

- **RLS Bypass**: The service role key **completely bypasses** Row Level Security (RLS) policies
- **Full Database Access**: It has **admin-level privileges** on your entire database
- **No Restrictions**: Unlike the anon key, it's not limited by any security rules you've set up

### 2. **Anyone Can Abuse It**

If someone gets your SERVICE_ROLE_KEY:
- They can **read, modify, or delete** ANY data in your database
- They can **bypass all your RLS policies**
- They can **access user data** they shouldn't have access to
- They can **modify or delete** tables and data
- They essentially have **full control** of your database

### 3. **Client-Side Code is Public**

Anything in your client-side code:
- Can be **viewed in browser DevTools**
- Can be **extracted from JavaScript bundles**
- Can be **accessed by anyone** who visits your site
- Can be **reverse-engineered** from your app

### 4. **Real-World Consequences**

If your SERVICE_ROLE_KEY is exposed:
- ❌ Attackers can read all user data (emails, passwords hashes, etc.)
- ❌ Attackers can modify or delete any data
- ❌ Attackers can access other users' private information
- ❌ Your entire database becomes compromised
- ❌ You may need to reset all keys and audit everything

## Key Differences

| Feature | ANON_KEY (Public) | SERVICE_ROLE_KEY (Private) |
|---------|------------------|---------------------------|
| **RLS Policies** | ✅ Respects all policies | ❌ Bypasses all policies |
| **Access Level** | Limited by policies | Full admin access |
| **Safe for Client** | ✅ Yes (publicly exposed) | ❌ **NEVER** |
| **Use Cases** | Client-side operations | Server-side admin operations |
| **Security** | Protected by RLS | Protected by secrecy |

## Best Practices

### ✅ DO:

1. **Use ANON_KEY in client-side code**
   ```typescript
   // ✅ Safe - in client components
   import { supabaseClient } from '@/src/lib/supabaseClient'
   ```

2. **Use SERVICE_ROLE_KEY only in API routes**
   ```typescript
   // ✅ Safe - in app/api/*/route.ts
   import { supabaseService } from '@/lib/supabase-service'
   ```

3. **Use SERVICE_ROLE_KEY in server components**
   ```typescript
   // ✅ Safe - in app/**/page.tsx (no 'use client')
   import { supabaseService } from '@/lib/supabase-service'
   ```

4. **Protect API routes with authentication**
   ```typescript
   // ✅ Check authentication before using service key
   const user = await getAuthenticatedUser()
   if (!user || !isAdmin(user)) {
     return unauthorized()
   }
   ```

### ❌ DON'T:

1. **Never use SERVICE_ROLE_KEY in client components**
   ```typescript
   // ❌ DANGEROUS - exposed to browser!
   'use client'
   import { supabaseService } from '@/lib/supabase-service' // DON'T!
   ```

2. **Never log or expose the key**
   ```typescript
   // ❌ DANGEROUS
   console.log(process.env.SUPABASE_SERVICE_ROLE_KEY) // DON'T!
   ```

3. **Never commit to git**
   ```bash
   # ✅ Already in .gitignore, but double-check
   # Make sure .env.local is ignored
   ```

4. **Never send in API responses**
   ```typescript
   // ❌ DANGEROUS
   return Response.json({ key: process.env.SUPABASE_SERVICE_ROLE_KEY }) // DON'T!
   ```

## How to Get Your SERVICE_ROLE_KEY

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click **Settings** (gear icon) → **API**
4. Find **service_role** key under "Project API keys"
5. **Click to reveal** (it starts with `eyJ...`)
6. Copy it to your `.env.local` file:

```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **Remember**: Never share this key, never commit it, never use it in client-side code!

## When to Use SERVICE_ROLE_KEY

### ✅ Appropriate Uses:

1. **Admin Operations**: Operations that need to bypass RLS
   - Bulk data operations
   - Admin dashboard operations
   - System-level maintenance

2. **Server-Side Only**: 
   - API routes (`app/api/*/route.ts`)
   - Server Components (without 'use client')
   - Server Actions
   - Background jobs/cron tasks

3. **Protected Endpoints**: 
   - Operations that are already protected by authentication
   - Admin-only features
   - Operations that need to access all data

### ❌ Inappropriate Uses:

1. **Client Components**: Never use in components with 'use client'
2. **Browser JavaScript**: Never import in client-side code
3. **Public Operations**: If you can do it with anon key + RLS, do that instead
4. **User Operations**: Regular CRUD operations should use anon key + RLS

## Example: Secure API Route

```typescript
// app/api/admin/products/route.ts
import { supabaseService } from '@/lib/supabase-service'
import { createClient } from '@/lib/supabase-client'

export async function POST(request: Request) {
  // 1. First, verify the user is authenticated (using anon key)
  const supabase = createClient() // Uses anon key
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // 2. Check if user is admin (query with anon key + RLS)
  const { data: adminCheck } = await supabase
    .from('admin_users')
    .select('id')
    .eq('id', user.id)
    .single()
  
  if (!adminCheck) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }
  
  // 3. NOW use service role key for admin operation
  const body = await request.json()
  const { data, error } = await supabaseService
    .from('products')
    .insert([body])
    .select()
  
  // ... handle response
}
```

## Summary

- **ANON_KEY**: Public, safe for client, respects RLS → Use in client-side code
- **SERVICE_ROLE_KEY**: Secret, server-only, bypasses RLS → Use only in API routes and server components

The golden rule: **If your code runs in the browser, use ANON_KEY. If it runs only on the server and you need admin access, use SERVICE_ROLE_KEY with proper authentication checks.**
