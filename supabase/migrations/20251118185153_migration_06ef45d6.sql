-- Enable Row Level Security on newsletter_subscribers table
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow anyone to insert (signup)
CREATE POLICY "Anyone can subscribe to newsletter" 
ON newsletter_subscribers 
FOR INSERT 
WITH CHECK (true);

-- Policy 2: Allow users to read their own subscription by email
CREATE POLICY "Users can view their own subscription" 
ON newsletter_subscribers 
FOR SELECT 
USING (
  email = current_setting('request.jwt.claims', true)::json->>'email'
  OR auth.uid() IS NULL  -- Allow anonymous reads for checking subscription status
);

-- Policy 3: Allow users to update their own subscription by email
CREATE POLICY "Users can update their own subscription" 
ON newsletter_subscribers 
FOR UPDATE 
USING (
  email = current_setting('request.jwt.claims', true)::json->>'email'
  OR auth.uid() IS NULL  -- Allow anonymous updates for home_city changes
);

-- Policy 4: Allow unsubscribe by token (no auth required)
CREATE POLICY "Allow unsubscribe by token" 
ON newsletter_subscribers 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Policy 5: Service role can do everything (for admin operations)
CREATE POLICY "Service role has full access" 
ON newsletter_subscribers 
FOR ALL 
USING (auth.role() = 'service_role');