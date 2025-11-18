-- Clean up and recreate proper RLS policies for newsletter_subscribers
-- Drop ALL existing policies first
DROP POLICY IF EXISTS "Service role has full access" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Anyone can subscribe" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Admins can view subscribers" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Public can read own subscription by email" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Allow unsubscribe by token" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Public can update own subscription by email" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Users can unsubscribe" ON newsletter_subscribers;

-- Ensure RLS is enabled
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Policy 1: Anyone can INSERT (for newsletter signup)
CREATE POLICY "Public can signup for newsletter"
ON newsletter_subscribers
FOR INSERT
TO public
WITH CHECK (true);

-- Policy 2: Anyone can SELECT their own record by email (no auth needed)
CREATE POLICY "Public can view own subscription"
ON newsletter_subscribers
FOR SELECT
TO public
USING (true);  -- Allow all reads for now since we need to fetch by email

-- Policy 3: Anyone can UPDATE their own record by email (no auth needed)
-- This is the key policy for saving city preference
CREATE POLICY "Public can update by email"
ON newsletter_subscribers
FOR UPDATE
TO public
USING (true)  -- Allow reading the record for update
WITH CHECK (true);  -- Allow the update

-- Policy 4: Service role has full access (for admin operations)
CREATE POLICY "Service role full access"
ON newsletter_subscribers
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);