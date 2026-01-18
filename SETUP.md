# Café Directory - Next.js Setup Guide

This guide will help you set up and run the Next.js café directory application.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Supabase account (optional - app works with mock data if not configured)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
   - Create a `.env.local` file in the root directory
   - Add your Supabase credentials (optional):
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```
   - Add Google Maps API key (optional, for enhanced map embeds):
     ```
     NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
     ```
   - If you don't have Supabase configured, the app will use mock data for demonstration
   - Maps will work without an API key using Google Maps embed fallback

## Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Features

### Café Listing Page
- Responsive grid layout showing café cards
- Filter by city
- Filter by laptop-friendly features:
  - WiFi availability and speed rating
  - Power outlet availability and rating
  - Noise level (quiet, moderate, loud, variable)
  - Overall laptop rating
  - Time limit restrictions
  - Quiet-only filter

### Café Cards
Each café card displays:
- Name, address, and location
- Overall laptop-friendliness rating
- WiFi and power outlet availability with ratings
- Noise level indicator
- Additional amenities (parking, outdoor seating, accessibility, etc.)
- Time limit warnings
- Contact information
- Link to detailed café page

### Café Detail Page
Comprehensive detail page for each café featuring:
- Full café information with ratings and reviews
- **Interactive map embed** showing café location
- **Laptop-friendly indicators** with detailed breakdown:
  - WiFi speed ratings with visual bars
  - Power outlet availability ratings
  - Seating capacity and comfort ratings
  - Lighting quality ratings
  - Noise level indicators
  - Environment details
- Business hours display
- Café policies (time limits, laptop policies)
- Quick info sidebar with amenities
- Contact information and links

### Responsive Design
- Mobile-first approach
- Collapsible filters on mobile
- Sticky filter sidebar on desktop
- Optimized for all screen sizes

## Project Structure

```
├── app/
│   ├── globals.css          # Global styles with Tailwind
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
├── app/
│   ├── cafe/
│   │   └── [id]/
│   │       └── page.tsx     # Dynamic café detail page route
│   ├── globals.css          # Global styles with Tailwind
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   └── not-found.tsx        # 404 page
├── components/
│   ├── CafeCard.tsx              # Individual café card component
│   ├── CafeDetail.tsx            # Café detail page component
│   ├── CafeFiltersPanel.tsx      # Filter sidebar component
│   ├── CafeListing.tsx           # Main listing page component
│   ├── CafeMap.tsx               # Google Maps embed component
│   └── LaptopFriendlyIndicators.tsx  # Detailed laptop-friendly features
├── lib/
│   └── supabase.ts          # Supabase client and types
└── supabase/
    └── migrations/          # Database schema migrations
```

## Connecting to Supabase

1. Create a Supabase project at [supabase.com](https://supabase.com)

2. Run the migrations in the `supabase/migrations/` folder:
   - Option 1: Use Supabase CLI
     ```bash
     supabase init
     supabase link --project-ref your-project-ref
     supabase db push
     ```
   - Option 2: Copy and paste each migration file into the Supabase SQL Editor

3. Add your Supabase URL and anon key to `.env.local`

4. The app will automatically fetch data from your Supabase database

## Building for Production

```bash
npm run build
npm start
```

## Technologies Used

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **Supabase** - Backend as a service (database and API)

## Google Maps Integration

The café detail pages include interactive map embeds. You have two options:

1. **With API Key (Recommended)**: Get a free API key from [Google Cloud Console](https://console.cloud.google.com/)
   - Enable the "Maps Embed API"
   - Add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to your `.env.local`
   - Provides better control and styling

2. **Without API Key**: The app will use Google Maps embed fallback
   - Works out of the box with basic functionality
   - Slightly less customization options

## Admin Dashboard

Access the admin dashboard at `/admin` to manage cafés. **Admin authentication is required.**

### Setting Up Admin Authentication

1. **Enable Supabase Authentication**:
   - In your Supabase dashboard, go to Authentication > Settings
   - Enable Email authentication (or your preferred auth method)

2. **Run the Admin System Migration**:
   - Make sure you've run all migrations including `20240101000007_create_admin_system.sql`
   - This creates the `admin_users` table and RLS policies

3. **Create Your First Admin User**:
   - Sign up for an account at `/login` (or create a user in Supabase Auth dashboard)
   - Once you have a user account, add them as an admin using one of these methods:

   **Method 1: Using Supabase SQL Editor**
   ```sql
   -- Replace 'your-email@example.com' with your actual email
   INSERT INTO admin_users (id, email)
   SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';
   ```

   **Method 2: Using the Helper Function**
   ```sql
   -- Replace 'your-email@example.com' with your actual email
   SELECT add_admin_by_email('your-email@example.com');
   ```

4. **Login**:
   - Go to `/login` and sign in with your admin account
   - You'll be redirected to `/admin` dashboard

### Features:
- **Dashboard Overview**: View all cafés with statistics
- **Café Management**: 
  - View, edit, and delete cafés
  - Toggle active/inactive status
  - Search and filter cafés
- **Add Café**: Complete form to add new cafés with all laptop-friendly attributes
- **Edit Café**: Update existing café information
- **Submissions**: Review and approve café suggestions from users

### Admin Routes:
- `/admin` - Dashboard with café list
- `/admin/cafes/new` - Add new café form
- `/admin/cafes/[id]/edit` - Edit café form
- `/admin/submissions` - Review user submissions

### Security:
- All admin routes are protected by middleware
- Only users in the `admin_users` table can access admin routes
- RLS policies restrict write operations to admins only
- Public users can still read café data and submit suggestions

### Form Sections:
The café form includes comprehensive fields for:
- Basic information (name, description)
- Location (address, coordinates)
- Contact information
- WiFi settings and ratings
- Power outlet availability and ratings
- Seating capacity and comfort
- Environment (noise level, lighting, music)
- Policies (time limits, laptop policies)
- Business hours (JSON format)
- Amenities (parking, accessibility, etc.)
- Status (active, verified)

## Next Steps

- ✅ Café detail pages with maps and indicators
- ✅ Admin dashboard for managing cafés
- ✅ User authentication for admin access
- Add review submission functionality
- Add photo uploads
- Implement location-based search with geolocation
- Add favorites/bookmarks feature
