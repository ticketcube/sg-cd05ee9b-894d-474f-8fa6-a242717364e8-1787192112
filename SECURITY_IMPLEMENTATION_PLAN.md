# Complete Security Implementation Plan for OTWChart

## Overview
This document outlines the complete security implementation plan to properly secure the OTWChart application using Row Level Security (RLS) policies while maintaining full functionality.

## Current Status ✅
- ✅ All user references converted to `auth_id` (UUID)
- ✅ Database foreign keys updated with cascade
- ✅ Service layer uses `auth_id` throughout
- ✅ API endpoints properly configured
- ✅ Deployment blocking TypeScript errors resolved

## Security Implementation Steps

### Step 1: Enable RLS on Critical Tables

```sql
-- Enable RLS on user-facing tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE top25_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

-- Public read-only tables (no RLS needed)
-- artists, weekly_lists, weekly_list_artists, points_config
```

### Step 2: User Profiles Policies

```sql
-- Users can only see and modify their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = auth_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = auth_id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = auth_id);

-- Service role bypass (for API endpoints)
CREATE POLICY "Service role full access" ON user_profiles
    FOR ALL USING (auth.role() = 'service_role');
```

### Step 3: User Engagements Policies

```sql
-- Users can only see their own engagements
CREATE POLICY "Users can view own engagements" ON user_engagements
    FOR SELECT USING (auth.uid() = auth_id);

CREATE POLICY "Users can insert own engagements" ON user_engagements
    FOR INSERT WITH CHECK (auth.uid() = auth_id);

-- Service role bypass
CREATE POLICY "Service role full access" ON user_engagements
    FOR ALL USING (auth.role() = 'service_role');
```

### Step 4: Voting Tables Policies

```sql
-- Weekly votes
CREATE POLICY "Users can view own votes" ON weekly_votes
    FOR SELECT USING (auth.uid() = auth_id);

CREATE POLICY "Users can insert own votes" ON weekly_votes
    FOR INSERT WITH CHECK (auth.uid() = auth_id);

CREATE POLICY "Service role full access" ON weekly_votes
    FOR ALL USING (auth.role() = 'service_role');

-- Top25 votes (same pattern)
CREATE POLICY "Users can view own top25 votes" ON top25_votes
    FOR SELECT USING (auth.uid() = auth_id);

CREATE POLICY "Users can insert own top25 votes" ON top25_votes
    FOR INSERT WITH CHECK (auth.uid() = auth_id);

CREATE POLICY "Service role full access" ON top25_votes
    FOR ALL USING (auth.role() = 'service_role');
```

### Step 5: User Streaks Policies

```sql
CREATE POLICY "Users can view own streaks" ON user_streaks
    FOR SELECT USING (auth.uid() = auth_id);

CREATE POLICY "Users can insert own streaks" ON user_streaks
    FOR INSERT WITH CHECK (auth.uid() = auth_id);

CREATE POLICY "Service role full access" ON user_streaks
    FOR ALL USING (auth.role() = 'service_role');
```

### Step 6: Public Read-Only Tables (No RLS)

These tables should remain public for read access:
- `artists` - Public artist data
- `weekly_lists` - Public weekly lists
- `weekly_list_artists` - Public weekly list contents  
- `points_config` - Public points configuration

## API Security Strategy

### Current API Endpoints Status:

#### ✅ Secure Endpoints (Using Service Role)
- `/api/user/profile-by-auth-id.ts` - Uses service role properly
- `/api/user/secure-profile.ts` - Uses service role properly
- `/api/user/secure-profile-by-id.ts` - Uses service role properly

#### 🔧 Needs Review Endpoints
- `/api/user/engagement.ts` - Needs service role configuration
- `/api/voting/submit.ts` - Needs service role configuration
- `/api/weekly-lists/active.ts` - Should use service role for consistency

### Service Role Implementation Pattern

```typescript
// Correct pattern for API endpoints
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Use supabaseAdmin for all database operations in API routes
```

## Frontend Security Strategy

### Client-Side Supabase Usage
- ✅ Frontend uses regular client with anon key
- ✅ RLS policies will automatically filter data
- ✅ Service role operations handled via API endpoints

### Authentication Flow
- ✅ User signs in via Supabase Auth
- ✅ `auth.uid()` available in RLS policies
- ✅ Client-side operations automatically secured

## Testing Strategy

### Step 1: Enable RLS Gradually
1. Start with `user_profiles` table only
2. Test profile creation and updates
3. Verify service role bypass works
4. Add remaining tables one by one

### Step 2: Functional Testing
1. User registration and profile creation
2. Video watching and points earning
3. Weekly ratings submission
4. Profile viewing and updates
5. Top100 voting

### Step 3: Security Testing
1. Attempt to access other users' data
2. Test service role endpoints
3. Verify RLS policy effectiveness
4. Test with multiple users

## Rollback Plan

If issues arise during RLS implementation:

```sql
-- Quick disable RLS
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_engagements DISABLE ROW LEVEL SECURITY;
-- etc...

-- Remove specific problematic policies
DROP POLICY "policy_name" ON table_name;
```

## Monitoring and Maintenance

### Key Metrics to Monitor
- User registration success rate
- Profile creation success rate  
- Points system functionality
- Video watch tracking
- Voting system operation

### Performance Considerations
- RLS policies may impact query performance
- Monitor slow queries after implementation
- Consider indexes on `auth_id` columns if not already present

## Implementation Timeline

### Phase 1: Core Security (Day 1)
- Enable RLS on user_profiles
- Test profile operations
- Verify service role bypass

### Phase 2: Engagement Security (Day 2) 
- Enable RLS on user_engagements
- Test points system
- Verify video watching

### Phase 3: Voting Security (Day 3)
- Enable RLS on voting tables
- Test all voting features
- Complete security testing

### Phase 4: Final Verification (Day 4)
- End-to-end testing
- Performance optimization
- Documentation updates

## Success Criteria

- ✅ All user data properly secured with RLS
- ✅ Service role operations work correctly
- ✅ No functionality regression
- ✅ Good application performance
- ✅ Security policies properly tested

## Next Steps

1. **Review this plan** - Ensure all requirements covered
2. **Set up test environment** - Clone production for testing
3. **Implement Phase 1** - Start with user_profiles RLS
4. **Progressive rollout** - Enable security incrementally
5. **Monitor and adjust** - Watch for issues and performance impact

The key to success is implementing RLS policies gradually while maintaining the service role bypass pattern for API endpoints. This ensures security without breaking functionality.
