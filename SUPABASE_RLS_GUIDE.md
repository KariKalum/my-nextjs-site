# Supabase Row Level Security (RLS) Guide

This guide explains how to enable Row Level Security (RLS) in Supabase and provides example policies for common use cases.

## What is Row Level Security (RLS)?

Row Level Security is a PostgreSQL feature that allows you to control access to individual rows in a table based on the user making the request. This is essential for securing your Supabase database.

## How to Enable RLS in Supabase

### Step 1: Access Supabase Dashboard

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Select your project
3. Click on **Table Editor** or **SQL Editor** in the left sidebar

### Step 2: Enable RLS on a Table

**Method 1: Using SQL Editor (Recommended)**

1. Click on **SQL Editor** in the left sidebar
2. Click **New query**
3. Run the following SQL:

```sql
-- Enable RLS on a specific table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
```

**Method 2: Using Table Editor**

1. Click on **Table Editor** in the left sidebar
2. Select the table you want to secure (e.g., `products`)
3. Click on the **Security** tab
4. Toggle **Enable Row Level Security** to ON

### Step 3: Create Policies

Once RLS is enabled, you need to create policies to define who can access what data. Without policies, no one will be able to access the table (not even authenticated users).

## Example SQL Policies

### 1. Public Read Access (Anyone can read)

Allows anyone (including unauthenticated users) to read all rows:

```sql
-- Allow public read access to all products
CREATE POLICY "Public read access"
ON products
FOR SELECT
TO public
USING (true);
```

**What this does:**
- `FOR SELECT`: Applies to read operations
- `TO public`: Applies to all users (authenticated and unauthenticated)
- `USING (true)`: Allows all rows to be visible

### 2. Authenticated Insert (Only logged-in users can insert)

Allows only authenticated users to insert new rows:

```sql
-- Allow authenticated users to insert products
CREATE POLICY "Authenticated users can insert"
ON products
FOR INSERT
TO authenticated
WITH CHECK (true);
```

**What this does:**
- `FOR INSERT`: Applies to insert operations
- `TO authenticated`: Only applies to authenticated users
- `WITH CHECK (true)`: Allows inserting any data (you can add validation here)

### 3. User-Only Update/Delete (Users can only modify their own rows)

Allows users to update and delete only rows they created:

```sql
-- Allow users to update only their own products
CREATE POLICY "Users can update own products"
ON products
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete only their own products
CREATE POLICY "Users can delete own products"
ON products
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
```

**What this does:**
- `auth.uid()`: Returns the current user's ID from Supabase Auth
- `user_id`: Assumes your table has a `user_id` column that stores the creator's user ID
- `USING`: Condition for which rows can be accessed
- `WITH CHECK`: Condition for which rows can be created/updated

### Alternative: Update/Delete for All Authenticated Users

If you want any authenticated user to update/delete any row:

```sql
-- Allow any authenticated user to update
CREATE POLICY "Authenticated users can update"
ON products
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow any authenticated user to delete
CREATE POLICY "Authenticated users can delete"
ON products
FOR DELETE
TO authenticated
USING (true);
```

## Complete Example: Products Table

Here's a complete set of policies for a `products` table with different access levels:

```sql
-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Public can read all products
CREATE POLICY "Public read access"
ON products
FOR SELECT
TO public
USING (true);

-- Only authenticated users can insert
CREATE POLICY "Authenticated users can insert"
ON products
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Only authenticated users can update their own products
-- (Assumes your table has a 'created_by' or 'user_id' column)
CREATE POLICY "Users can update own products"
ON products
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

-- Only authenticated users can delete their own products
CREATE POLICY "Users can delete own products"
ON products
FOR DELETE
TO authenticated
USING (auth.uid() = created_by);
```

## Common RLS Patterns

### Pattern 1: Public Read, Authenticated Write

```sql
-- Anyone can read
CREATE POLICY "Public read"
ON products FOR SELECT TO public USING (true);

-- Authenticated users can insert
CREATE POLICY "Authenticated insert"
ON products FOR INSERT TO authenticated WITH CHECK (true);

-- Authenticated users can update any row
CREATE POLICY "Authenticated update"
ON products FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Authenticated users can delete any row
CREATE POLICY "Authenticated delete"
ON products FOR DELETE TO authenticated USING (true);
```

### Pattern 2: Owner-Based Access Control

```sql
-- Public can read
CREATE POLICY "Public read"
ON products FOR SELECT TO public USING (true);

-- Users can insert (automatically set user_id)
CREATE POLICY "Users insert own"
ON products FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own
CREATE POLICY "Users update own"
ON products FOR UPDATE TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own
CREATE POLICY "Users delete own"
ON products FOR DELETE TO authenticated 
USING (auth.uid() = user_id);
```

### Pattern 3: Admin-Only Write Access

```sql
-- Public can read
CREATE POLICY "Public read"
ON products FOR SELECT TO public USING (true);

-- Only admins can insert/update/delete
-- (Assumes you have an admin_users table or similar)
CREATE POLICY "Admin insert"
ON products FOR INSERT TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.id = auth.uid()
  )
);

CREATE POLICY "Admin update"
ON products FOR UPDATE TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.id = auth.uid()
  )
);

CREATE POLICY "Admin delete"
ON products FOR DELETE TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.id = auth.uid()
  )
);
```

## Important Notes

1. **No Policies = No Access**: When RLS is enabled without policies, no one can access the table (not even you from the dashboard). Always create policies after enabling RLS.

2. **Service Role Bypasses RLS**: The service role key bypasses all RLS policies. Only use it on the server side, never in client-side code.

3. **Anon Key Respects RLS**: The anon/public key respects all RLS policies. Use this in your client-side code.

4. **Testing Policies**: Test your policies thoroughly. You can use the SQL Editor in Supabase to test queries as different users.

## Viewing Existing Policies

To see all policies on a table:

```sql
SELECT * FROM pg_policies WHERE tablename = 'products';
```

## Dropping Policies

To remove a policy:

```sql
DROP POLICY "Policy name" ON products;
```

## Troubleshooting

### "permission denied for table products"

- Check if RLS is enabled: `SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'products';`
- Verify you have policies: `SELECT * FROM pg_policies WHERE tablename = 'products';`
- Make sure your policies use the correct roles (`public`, `authenticated`, etc.)

### "new row violates row-level security policy"

- Check your `WITH CHECK` clause in INSERT/UPDATE policies
- Verify the data you're inserting meets the policy conditions
- Check if you're trying to insert with a different `user_id` than your auth.uid()

### "Could not read from table products"

- Ensure you have a SELECT policy
- Check if the policy's `USING` clause allows access to the rows you're trying to read
- Verify your authentication status matches the policy's role
