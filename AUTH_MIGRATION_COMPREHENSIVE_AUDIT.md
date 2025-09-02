# 🔄 Auth Migration Comprehensive Audit & Plan

## Overview
Complete analysis of all files that need to be updated to migrate from the old custom `AuthContext` to Supabase Auth Helpers + `UserProfileContext`.

---

## ✅ COMPLETED (Phase 1 - Core Foundation)
- ✅ `src/pages/_app.tsx` - Added `SessionContextProvider` and `UserProfileProvider`  
- ✅ `src/contexts/UserProfileContext.tsx` - New profile management system
- ✅ `src/components/layout/AppLayout.tsx` - Migrated to new auth hooks
- ✅ `src/contexts/AuthContext.tsx` - Marked as deprecated with migration guidance

---

## 🔧 FILES REQUIRING MIGRATION

### **CRITICAL PRIORITY** (Admin & Core Features)

#### **Admin Pages & Components**
- **`src/pages/admin.tsx`** (530 lines) - Complex admin panel with role checking
  - Uses: `useAuth()` for role verification and user management
  - Migration: Replace with `useUser()` + `useUserProfile()` for role checking
  - Security: Must verify `role === 'otwstaff'` pattern

- **`src/components/guards/withAdminGuard.tsx`** (37 lines) - HOC for admin protection  
  - Uses: `useAuth()` for role-based access control
  - Migration: Update to use `useUser()` + `useUserProfile()` hooks
  - Critical: This protects multiple admin routes

#### **Authentication Components**
- **`src/components/AuthDialog.tsx`** (307 lines) - Main auth/signup flow
  - Uses: `useAuth()` for login/signup functionality  
  - Migration: Replace with `useSupabaseClient()` for auth operations
  - Note: Handles profile creation flow

- **`src/components/ProfileSetupModal.tsx`** (272 lines) - New user profile setup
  - Uses: `useAuth()` for profile creation
  - Migration: Update to use `useSupabaseClient()` + `useUserProfile()`

- **`src/components/AuthGuard.tsx`** (20 lines) - Route protection component
  - Uses: `useAuth()` for authentication checking
  - Migration: Simple replacement with `useUser()` hook

### **HIGH PRIORITY** (User-Facing Features)

#### **User Profile & Points System**
- **`src/pages/profile.tsx`** (438 lines) - User profile management page
  - Uses: `useAuth()` extensively for profile data and updates
  - Migration: Replace with `useUserProfile()` for profile data

- **`src/components/points/WeeklyPointsDashboard.tsx`** (195 lines) - Points tracking
  - Uses: `useAuth()` for user identification and points display
  - Migration: Use `useUser()` for auth_id, `useUserProfile()` for points

- **`src/components/points/PointsNotification.tsx`** (191 lines) - Points notifications
  - Uses: `useAuth()` for user context in points system
  - Migration: Update to new profile context

- **`src/components/points/HowPointsWorkModal.tsx`** (275 lines) - Points explanation UI
  - Uses: `useAuth()` for user-specific points information
  - Migration: Use `useUserProfile()` for user data

#### **Voting & Rating Components**
- **`src/pages/weekly-ratings.tsx`** (339 lines) - Weekly artist rating system
  - Uses: `useAuth()` for user identification in voting
  - Migration: Use `useUser().id` for auth_id in API calls

- **`src/components/WeeklyArtistRatingPopup.tsx`** (538 lines) - Rating submission UI
  - Uses: `useAuth()` for user context in rating submissions
  - Migration: Replace with `useUser()` for authentication

### **MEDIUM PRIORITY** (Discovery & Chart Features)

#### **Discovery & Charts**
- **`src/pages/discovery-dashboard.tsx`** (421 lines) - Main discovery interface
  - Uses: `useAuth()` for personalized content
  - Migration: Use `useUser()` for auth state, `useUserProfile()` for role

- **`src/components/WeeklyArtistPopup.tsx`** (367 lines) - Weekly artist details
  - Uses: `useAuth()` for user-specific actions
  - Migration: Update to new auth hooks

- **`src/components/VibeChart.tsx`** (361 lines) - Music vibe visualization  
  - Uses: `useAuth()` for user interactions
  - Migration: Replace with `useUser()` for auth state

#### **Content Pages**  
- **`src/pages/top100.tsx`** (437 lines) - Top 100 chart display
  - Uses: `useAuth()` for user-specific features
  - Migration: Update to new auth pattern

### **LOW PRIORITY** (Utility & Supporting Features)

#### **API Routes** (Requires Security Review)
- **`src/pages/api/admin/protected.ts`** (65 lines) - Admin API endpoint
  - Current: Custom admin verification logic
  - Migration: Update to use the new **Admin Role Check Pattern**
  - Security: Implement 3-step verification (Authenticate → Authorize → Execute)

- **`src/pages/api/admin/refresh-events.ts`** (54 lines) - Admin event refresh
  - Migration: Apply same admin security pattern

#### **Specialized Components**
- **`src/pages/yturl.tsx`** (240 lines) - YouTube URL management
  - Uses: `useAuth()` for user-specific URL handling
  - Migration: Standard auth hook replacement

- **`src/pages/test-points.tsx`** (218 lines) - Points system testing
  - Uses: `useAuth()` for testing user context
  - Migration: Update for testing with new auth system

- **`src/components/StaffPortalTab.tsx`** (52 lines) - Staff-specific interface
  - Uses: `useAuth()` for role-based UI
  - Migration: Use `useUserProfile()` for role checking

---

## 🔍 MIGRATION PATTERNS

### **Pattern 1: Basic Auth State**
```typescript
// OLD
const { isAuthenticated, supabaseUser, loading } = useAuth();

// NEW  
const user = useUser();
const loading = !user; // or use session loading state
const isAuthenticated = !!user;
```

### **Pattern 2: User Profile Data**
```typescript
// OLD
const { user, profileExists } = useAuth();

// NEW
const { profile, loading, error } = useUserProfile();
const profileExists = !!profile;
```

### **Pattern 3: Role-Based Access**
```typescript
// OLD
const { user } = useAuth();
const isAdmin = user?.role === 'otwstaff';

// NEW
const { role } = useUserProfile();
const isAdmin = role === 'otwstaff';
```

### **Pattern 4: Auth Operations**
```typescript
// OLD
const { login, logout } = useAuth();

// NEW  
const supabase = useSupabaseClient();
// Use supabase.auth.signIn(), supabase.auth.signOut()
```

---

## 🚨 CRITICAL SECURITY NOTES

### **Admin API Routes Security**
All admin API routes (`/api/admin/*`) must implement the **3-step verification pattern**:

1. **Authenticate**: Get user from session cookie
2. **Authorize**: Check user role in `user_profiles` table  
3. **Execute**: Only then use `supabaseAdmin` for privileged operations

### **Role Verification**
- Old: `useAuth().user?.role === 'otwstaff'`
- New: `useUserProfile().role === 'otwstaff'`
- **Critical**: Ensure all admin guards use this pattern

---

## 📋 TESTING CHECKLIST

### **Authentication Flow**
- [ ] Login/signup process works with new auth system
- [ ] Profile creation after successful signup  
- [ ] Session persistence across page reloads
- [ ] Logout clears all auth state properly

### **Authorization & Security**  
- [ ] Admin pages only accessible to `otwstaff` users
- [ ] Admin API endpoints reject non-admin requests with 403
- [ ] User-specific data is properly scoped by `auth_id`
- [ ] Points system correctly identifies users

### **User Experience**
- [ ] Navigation auth state updates immediately
- [ ] Profile data loads correctly on app startup
- [ ] Loading states work properly during auth transitions
- [ ] Error handling for failed auth operations

---

## 🎯 ROLLOUT STRATEGY

### **Phase 1**: ✅ Foundation (COMPLETE)
- Core auth infrastructure migration

### **Phase 2**: **Admin & Critical Security** (NEXT)
- Admin guard and admin pages
- API security implementation  
- Critical role-based access control

### **Phase 3**: **User-Facing Features**
- Profile and points components
- Voting and rating systems
- Discovery features

### **Phase 4**: **Final Components & Cleanup**  
- Remaining utility components
- Remove deprecated AuthContext
- Final testing and optimization

---

## 🔗 Key Files for Next Phase

**Immediate Focus:**
1. `src/components/guards/withAdminGuard.tsx` - Critical for admin security
2. `src/pages/admin.tsx` - Main admin interface
3. `src/pages/api/admin/protected.ts` - Admin API security pattern
4. `src/components/AuthDialog.tsx` - Main auth flow