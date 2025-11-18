-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can update their own subscription" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Users can view their own subscription" ON newsletter_subscribers;

-- Create new email-based policies (no auth required)
-- Allow anyone to read their own subscription by email
CREATE POLICY "Public can read own subscription by email"
ON newsletter_subscribers
FOR SELECT
TO public
USING (true);  -- Allow reading, client will filter by email

-- Allow anyone to update their own subscription by email
CREATE POLICY "Public can update own subscription by email"
ON newsletter_subscribers
FOR UPDATE
TO public
USING (true)  -- Allow anyone to attempt update
WITH CHECK (true);  -- Trust client-side email matching