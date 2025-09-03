
# RLS Policy Assessment & Update Plan

## Current Status Analysis

### ✅ **CORRECTLY UPDATED (No Action Required)**
These tables/policies already use the correct column references:
- `user_profiles` - correctly uses `user_id`
- `artists` - correctly references `user_profiles.user_id` for staff checks
- `staff_modules` - correctly references `user_profiles.user_id` for staff checks
- `weekly_list_artists` - correctly references `user_profiles.user_id` for staff checks

### ⚠️ **REQUIRES IMMEDIATE UPDATES**
These tables still have `auth_id` columns and need schema + RLS policy updates:

## 1. **ticketcubes** Table Issues
**Column:** Still uses `auth_id` 
**Policies affected:**
- Users can create their own ticketcubes
- Users can delete their own ticketcubes  
- Users can manage their own cubes
- Users can update their own ticketcubes
- Users can view their own ticketcubes

**Required Action:** 
- Column rename: `auth_id` → `user_id`
- Update all 5 RLS policies

## 2. **cube_faces** Table Issues
**Column:** References `ticketcubes.auth_id` in policies
**Policies affected:**
- All cube_faces policies (5 policies)

**Required Action:**
- Update RLS policies to reference `ticketcubes.user_id`

## 3. **top25_votes** Table Issues  
**Column:** Still uses `auth_id`
**Policies affected:**
- Users can insert own top25 votes
- Users can view own top25 votes

**Required Action:**
- Column rename: `auth_id` → `user_id`
- Update 2 RLS policies

## 4. **user_engagements** Table Issues
**Column:** Still uses `auth_id` (also has confusing `user_auth_id`)
**Policies affected:**
- Users can insert own engagements
- Users can view own engagements

**Required Action:**
- Column rename: `auth_id` → `user_id`
- Remove confusing `user_auth_id` column
- Update 2 RLS policies

## 5. **user_streaks** Table Issues
**Column:** Still uses `auth_id`
**Policies affected:**
- user_streaks_read_own

**Required Action:**
- Column rename: `auth_id` → `user_id`
- Update 1 RLS policy

## 6. **weekly_votes** Table Issues
**Column:** Still uses `auth_id`
**Policies affected:**
- Users can insert own votes
- Users can view own votes

**Required Action:**
- Column rename: `auth_id` → `user_id`
- Update 2 RLS policies

---

## **SECURITY ASSESSMENT**

### Current Security Goals ✅
1. **Only logged in users can view and insert/update their data** - ACHIEVED
   - All user-owned data is properly scoped to `auth.uid()` 
   - No unauthorized cross-user access possible

2. **Only logged in users with role 'otwstaff' can access staff modules** - ACHIEVED
   - Staff access properly checks `user_profiles.role = 'otwstaff'`
   - Artist management, staff modules, weekly lists all properly restricted

### Additional Security Considerations 📋

#### **A. Database Column Naming Consistency**
**Recommendation: STANDARDIZE on `user_id`**
- **Pros:** Clear, consistent, follows convention
- **Cons:** Requires migration effort
- **Impact:** Reduces future confusion, improves maintainability

#### **B. OAuth Provider Setup**
**Google OAuth Setup Steps:**
1. Google Cloud Console → Create OAuth 2.0 credentials
2. Supabase Dashboard → Authentication → Providers → Google
3. Add client ID, client secret, configure redirect URLs
4. Add Google sign-in button to AuthDialog

**Apple OAuth Setup Steps:**  
1. Apple Developer Account → Sign in with Apple setup
2. Supabase Dashboard → Authentication → Providers → Apple
3. Configure service ID, team ID, key ID, private key
4. Add Apple sign-in button to AuthDialog

#### **C. Enhanced RLS Patterns**
Consider these security improvements:
- Add audit trails for sensitive operations
- Implement rate limiting for user actions
- Add soft deletes instead of hard deletes
- Consider row-level encryption for PII data

---

## **RECOMMENDED EXECUTION PLAN**

### Phase 1: Database Schema Updates ($2-3)
1. Rename `auth_id` → `user_id` on remaining tables
2. Remove redundant/confusing columns
3. Update foreign key constraints

### Phase 2: RLS Policy Updates ($1-2)  
1. Update all affected policies
2. Test policy effectiveness
3. Verify no unauthorized access

### Phase 3: OAuth Enhancement ($3-4)
1. Google OAuth integration
2. Apple OAuth integration  
3. Enhanced AuthDialog UI
4. Social login testing

**Total Estimated Cost: $6-9 worth of tokens**
