# Vercel Deployment Setup Guide

## Environment Variables Required

For your Café Directory to work with Supabase on Vercel, you need to add the following environment variables in your Vercel project settings.

### Steps to Add Environment Variables in Vercel:

1. Go to your Vercel project dashboard: https://vercel.com/dashboard
2. Click on your project
3. Go to **Settings** → **Environment Variables**
4. Add each of the following variables:

### Required Environment Variables:

#### 1. `NEXT_PUBLIC_SUPABASE_URL`
- **Value**: Your Supabase project URL
- **Example**: `https://abcdefghijklmnop.supabase.co`
- **Where to find**: Supabase Dashboard → Settings → API → Project URL
- **Environment**: Production, Preview, and Development

#### 2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value**: Your Supabase anonymous/public key
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (long JWT token)
- **Where to find**: Supabase Dashboard → Settings → API → Project API keys → `anon` `public`
- **Environment**: Production, Preview, and Development

#### 3. `SUPABASE_SERVICE_ROLE_KEY` (Optional - for admin operations)
- **Value**: Your Supabase service role key
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (long JWT token)
- **Where to find**: Supabase Dashboard → Settings → API → Project API keys → `service_role` `secret`
- **Environment**: Production, Preview, and Development
- **⚠️ WARNING**: This key has admin privileges. Never expose it in client-side code.

#### 4. `NEXT_PUBLIC_SITE_URL` (Optional but recommended)
- **Value**: Your production site URL
- **Example**: `https://your-site.vercel.app` or your custom domain
- **Environment**: Production
- **Used for**: SEO (sitemap, canonical URLs, Open Graph)

#### 5. `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (Optional)
- **Value**: Your Google Maps API key
- **Environment**: Production, Preview, and Development
- **Used for**: Google Maps embeds on café detail pages

### How to Find Your Supabase Credentials:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click **Settings** (gear icon) in the left sidebar
4. Click **API** in the settings menu
5. You'll see:
   - **Project URL** - Copy this for `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API keys** section:
     - **anon public** - Copy this for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - **service_role secret** - Click "Reveal" to copy this for `SUPABASE_SERVICE_ROLE_KEY`

### After Adding Environment Variables:

1. **Redeploy your application**:
   - Go to Vercel Dashboard → Your Project → Deployments
   - Click the three dots (⋯) on the latest deployment
   - Select "Redeploy"
   - Or push a new commit to trigger a new deployment

2. **Verify the variables are set**:
   - Environment variables are available at build time and runtime
   - Check Vercel build logs to ensure no placeholder URL errors
   - The app should now connect to your Supabase database

### Troubleshooting:

#### App still shows mock/sample data:
- ✅ Verify environment variables are set in Vercel
- ✅ Check that variable names match exactly (case-sensitive)
- ✅ Ensure you've redeployed after adding variables
- ✅ Check Vercel build logs for any errors
- ✅ Verify your Supabase project is active and accessible
- ✅ Check browser console for Supabase connection errors

#### Build fails:
- Check that `NEXT_PUBLIC_SUPABASE_URL` is a valid URL
- Ensure `NEXT_PUBLIC_SUPABASE_ANON_KEY` is a valid JWT token
- Verify all required variables are set for the correct environment

#### Database queries fail:
- Verify your Supabase project has the correct tables
- Check that Row Level Security (RLS) policies allow the operations you're trying to perform
- Ensure the `cafes` table exists and has the correct schema
- Check Supabase logs for any errors

### Testing Your Setup:

After deploying with environment variables:

1. Visit your Vercel deployment URL
2. Check the browser console (F12) for any Supabase errors
3. Try adding a café through the admin dashboard
4. Verify that real data appears instead of mock data
5. Check that the "Demo Mode" banner is no longer visible (if it was showing)

### Quick Reference:

| Variable | Required | Environment | Where to Find |
|----------|----------|-------------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Yes | All | Supabase Dashboard → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Yes | All | Supabase Dashboard → Settings → API → anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | ⚠️ Admin ops | All | Supabase Dashboard → Settings → API → service_role key |
| `NEXT_PUBLIC_SITE_URL` | ⚠️ SEO | Production | Your Vercel deployment URL |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | ❌ Optional | All | Google Cloud Console |

### Security Notes:

- `NEXT_PUBLIC_*` variables are exposed to the browser - only include safe public keys
- `SUPABASE_SERVICE_ROLE_KEY` is NOT prefixed with `NEXT_PUBLIC_` - it's server-only
- Never commit environment variables to git (they're in `.gitignore`)
