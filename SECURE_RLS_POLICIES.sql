-- 🔒 SECURE RLS POLICY UPDATES FOR OTWCHART
-- CRITICAL: These updates will immediately lock down overly permissive policies
-- Deploy during maintenance window with careful rollback plan

-- ==========================================
-- 1. SECURE USER PROFILES
-- ==========================================

-- Drop overly permissive policy
DROP POLICY IF EXISTS "user_profiles_all_policy" ON user_profiles;

-- Create restricted policies
CREATE POLICY "user_profiles_read_own" ON user_profiles
  FOR SELECT USING (auth.uid()::text = auth_id);

CREATE POLICY "user_profiles_update_own" ON user_profiles  
  FOR UPDATE USING (auth.uid()::text = auth_id);

CREATE POLICY "user_profiles_insert_own" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid()::text = auth_id);

-- Admin access for all operations
CREATE POLICY "user_profiles_admin_all" ON user_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = auth.email()
    )
  );

-- ==========================================
-- 2. SECURE USER ENGAGEMENTS
-- ==========================================

-- Drop overly permissive policy
DROP POLICY IF EXISTS "user_engagements_all_policy" ON user_engagements;

-- Users can only read their own engagements
CREATE POLICY "user_engagements_read_own" ON user_engagements
  FOR SELECT USING (
    user_id = (
      SELECT id FROM user_profiles 
      WHERE auth_id = auth.uid()::text
    )
  );

-- Only service role can insert engagements (via API endpoints)
CREATE POLICY "user_engagements_service_role_only" ON user_engagements
  FOR INSERT USING (auth.role() = 'service_role');

-- Admin access for all operations
CREATE POLICY "user_engagements_admin_all" ON user_engagements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = auth.email()
    )
  );

-- ==========================================
-- 3. SECURE USER STREAKS
-- ==========================================

-- Drop overly permissive policy
DROP POLICY IF EXISTS "user_streaks_all_policy" ON user_streaks;

-- Users can only read their own streaks
CREATE POLICY "user_streaks_read_own" ON user_streaks
  FOR SELECT USING (
    user_id = (
      SELECT id FROM user_profiles 
      WHERE auth_id = auth.uid()::text
    )
  );

-- Only service role can modify streaks
CREATE POLICY "user_streaks_service_role_only" ON user_streaks
  FOR ALL USING (auth.role() = 'service_role');

-- Admin access for all operations
CREATE POLICY "user_streaks_admin_all" ON user_streaks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = auth.email()
    )
  );

-- ==========================================
-- 4. SECURE WEEKLY VOTES
-- ==========================================

-- Drop overly permissive policy
DROP POLICY IF EXISTS "weekly_votes_all_policy" ON weekly_votes;

-- Users can only read their own votes
CREATE POLICY "weekly_votes_read_own" ON weekly_votes
  FOR SELECT USING (
    user_id = (
      SELECT id FROM user_profiles 
      WHERE auth_id = auth.uid()::text
    )
  );

-- Only service role can insert/modify votes
CREATE POLICY "weekly_votes_service_role_only" ON weekly_votes
  FOR ALL USING (auth.role() = 'service_role');

-- Admin access for all operations
CREATE POLICY "weekly_votes_admin_all" ON weekly_votes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = auth.email()
    )
  );

-- ==========================================
-- 5. SECURE TICKETMASTER EVENTS
-- ==========================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "ticketmaster_events_select_policy" ON ticketmaster_events;
DROP POLICY IF EXISTS "ticketmaster_events_insert_policy" ON ticketmaster_events;
DROP POLICY IF EXISTS "ticketmaster_events_update_policy" ON ticketmaster_events;
DROP POLICY IF EXISTS "ticketmaster_events_delete_policy" ON ticketmaster_events;

-- Public read access for events (needed for tour page)
CREATE POLICY "ticketmaster_events_public_read" ON ticketmaster_events
  FOR SELECT USING (true);

-- Only admins can modify events
CREATE POLICY "ticketmaster_events_admin_modify" ON ticketmaster_events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = auth.email()
    )
  );

-- ==========================================
-- 6. ENSURE ADMIN_USERS TABLE EXISTS
-- ==========================================

-- Create admin_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on admin_users
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Only admins can see admin list
CREATE POLICY "admin_users_admin_only" ON admin_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.email = auth.email()
    )
  );

-- Insert default admin users (replace with actual admin emails)
INSERT INTO admin_users (email) VALUES 
  ('admin@otw.com'),
  ('alan@alanrakov.com')
ON CONFLICT (email) DO NOTHING;

-- ==========================================
-- 7. SECURE OTHER SENSITIVE TABLES
-- ==========================================

-- Video watch tracking - users can only access their own
CREATE POLICY "video_watches_read_own" ON video_watches
  FOR SELECT USING (
    user_id = (
      SELECT id FROM user_profiles 
      WHERE auth_id = auth.uid()::text
    )
  ) IF EXISTS;

CREATE POLICY "video_watches_service_role_only" ON video_watches
  FOR INSERT USING (auth.role() = 'service_role') IF EXISTS;

-- Top 25 votes - users can only see their own
CREATE POLICY "top25_votes_read_own" ON top25_votes
  FOR SELECT USING (
    user_id = (
      SELECT id FROM user_profiles 
      WHERE auth_id = auth.uid()::text
    )
  ) IF EXISTS;

CREATE POLICY "top25_votes_service_role_only" ON top25_votes
  FOR INSERT USING (auth.role() = 'service_role') IF EXISTS;

-- ==========================================
-- 8. ROLLBACK POLICIES (COMMENT OUT FOR DEPLOYMENT)
-- ==========================================

/*
-- ROLLBACK SCRIPT - UNCOMMENT ONLY IF NEEDED TO RESTORE OLD POLICIES

-- Restore old permissive policies (DANGEROUS - USE ONLY IN EMERGENCY)
DROP POLICY IF EXISTS "user_profiles_read_own" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_own" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_own" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_admin_all" ON user_profiles;

CREATE POLICY "user_profiles_all_policy" ON user_profiles
  FOR ALL USING (true) WITH CHECK (true);

-- Repeat similar rollback for other tables if needed
-- WARNING: This restores critical security vulnerabilities
*/

-- ==========================================
-- DEPLOYMENT VERIFICATION QUERIES
-- ==========================================

-- Verify policies are applied correctly
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN (
  'user_profiles', 
  'user_engagements', 
  'user_streaks', 
  'weekly_votes', 
  'ticketmaster_events',
  'admin_users'
)
ORDER BY tablename, policyname;

-- Check admin users table
SELECT email FROM admin_users;

-- Verify RLS is enabled on critical tables
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE tablename IN (
  'user_profiles', 
  'user_engagements', 
  'user_streaks', 
  'weekly_votes', 
  'ticketmaster_events',
  'admin_users'
)
ORDER BY tablename;
