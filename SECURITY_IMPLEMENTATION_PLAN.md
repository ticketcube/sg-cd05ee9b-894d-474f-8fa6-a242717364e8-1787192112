# Complete Security Implementation Plan for OTWChart

## Overview
This document outlines the complete security implementation plan to properly secure the OTWChart application using Row Level Security (RLS) policies and a secure API pattern for administrative actions.

## Current Status ✅
- ✅ All user references converted to `auth_id` (UUID)
- ✅ Database foreign keys updated with cascade
- ✅ Service layer uses `auth_id` throughout
- ✅ API endpoints properly configured
- ✅ Deployment blocking TypeScript errors resolved

---

## 1. API Security Strategy: The Admin Role Check Pattern

This is the most critical part of our backend security. The `service_role` key bypasses all RLS policies, so it must only be used after verifying the user is an administrator. The user role is stored in the `user_profiles` table under the `role` column (e.g., `'otwstaff'`).

**The Correct Pattern for Admin-Only API Routes:**

1.  **Authenticate User**: Use `@supabase/auth-helpers-nextjs` to get the user from the secure cookie.
2.  **Authorize User**: Using the **standard client**, query the `user_profiles` table to check if the user's role is `'otwstaff'`.
3.  **Execute with Privileged Client**: Only if both checks pass, use the `supabaseAdmin` client (with the `service_role` key) to perform the action.

**Example Admin API Route (`/pages/api/admin/some-action.ts`):**

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { supabaseAdmin } from '@/lib/supabaseAdmin'; // The privileged client

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Authenticate the user
  const supabase = createPagesServerClient({ req, res });
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized: You must be logged in.' });
  }

  // 2. Authorize the user by checking their role
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('auth_id', user.id)
    .single();

  if (profileError || !profile) {
    return res.status(403).json({ error: 'Forbidden: User profile not found.' });
  }

  if (profile.role !== 'otwstaff') {
    return res.status(403).json({ error: 'Forbidden: You do not have administrative privileges.' });
  }

  // 3. Execute privileged action
  // Now it is safe to use the admin client
  try {
    const { data, error } = await supabaseAdmin.from('some_table').select('*');
    if (error) throw error;
    return res.status(200).json(data);
  } catch (error) {
    console.error('Admin API error:', error);
    return res.status(500).json({ error: 'Internal server error during admin operation.' });
  }
}
```

---

## 2. Row-Level Security (RLS) Policies

These policies apply to all queries made with the standard, non-admin Supabase client.

### Step 2.1: Enable RLS on Critical Tables

```sql
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE top25_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
```

### Step 2.2: `user_profiles` Policies
```sql
-- Users can view their own profile.
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = auth_id);

-- Users can insert their own profile.
CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = auth_id);

-- Users can update their own profile.
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = auth_id);
```

### Step 2.3: `user_engagements` Policies
```sql
-- Users can manage their own engagements.
CREATE POLICY "Users can manage own engagements" ON user_engagements
    FOR ALL USING (auth.uid() = auth_id);
```

### Step 2.4: Voting & Ratings Tables Policies
```sql
-- Users can manage their own weekly votes.
CREATE POLICY "Users can manage own weekly_votes" ON weekly_votes
    FOR ALL USING (auth.uid() = auth_id);

-- Users can manage their own weekly ratings.
CREATE POLICY "Users can manage own weekly_ratings" ON weekly_ratings
    FOR ALL USING (auth.uid() = auth_id);
```
*(Apply similar policies to `top25_votes`, `user_streaks`, etc.)*

**Note:** The `service_role` does not need explicit `CREATE POLICY` statements because it automatically bypasses all RLS checks.

---

## 3. Frontend Security Strategy

- **Client-Side Supabase Usage**: The frontend will always use the regular client with the `anon` key. RLS policies automatically filter all data, ensuring users only see what they are permitted to.
- **Admin Operations**: Any administrative action (e.g., viewing all users, refreshing data) MUST be done by calling a dedicated admin API endpoint that implements the secure pattern described in Section 1.

---

## 4. Testing & Rollback

### Testing Strategy
1.  **Admin API Tests**: Create tests to ensure non-admins are correctly blocked with a 403 error from admin endpoints.
2.  **RLS Functional Tests**: As a logged-in user, attempt to fetch another user's data via the client-side API and confirm it fails.
3.  **Positive Case Tests**: Confirm that users can still view and edit their own data and that admins can successfully perform privileged actions.

### Rollback Plan
If critical issues arise, RLS can be temporarily disabled on a per-table basis.
`ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;`

---
## Summary of Changes

-   This plan now mandates a **three-step check (Authenticate -> Authorize -> Execute)** for all API routes that use the `service_role` key.
-   It provides a concrete code example for a secure admin API route.
-   It clarifies that RLS policies are for standard users, and admins will use secure API endpoints to bypass them when necessary.
