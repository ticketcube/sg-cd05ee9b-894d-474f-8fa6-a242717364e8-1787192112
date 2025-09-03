# 🔄 Auth Migration: Consolidated Plan & Status

**Status**: 85% Complete | **Blocking Issue**: Missing npm dependencies

---

## 📊 CURRENT STATE

### ✅ COMPLETED (Phase 1 - Foundation)
- **Core Infrastructure**: `_app.tsx` with `SessionContextProvider` + `UserProfileProvider`
- **Profile Management**: `UserProfileContext.tsx` with proper hooks (`useUserProfile()`)
- **Admin Security**: `withAdminGuard.tsx` HOC for protecting admin routes  
- **Layout Migration**: `AppLayout.tsx` converted to new auth system
- **Cleanup**: Legacy `AuthContext.tsx` removed

### ❌ CRITICAL BLOCKING ISSUE
**Error**: `Cannot find module '@supabase/auth-helpers-react'`
**Root Cause**: Missing npm packages in `package.json`
**Fix Required**: 
```bash
npm install @supabase/auth-helpers-react @supabase/auth-helpers-nextjs
```

### 🔄 REMAINING WORK

#### **Component Migration (8 files)**
Components still importing deleted `AuthContext`:
1. `src/components/PromotionPopup.tsx`
2. `src/components/WeeklyArtistPopup.tsx`
3. `src/components/WeeklyArtistRatingPopup.tsx`
4. `src/components/points/VideoWatchStatus.tsx`
5. `src/components/points/WeeklyPointsDashboard.tsx`
6. `src/pages/brandfolder-upload.tsx`
7. `src/pages/test-points.tsx`
8. `src/pages/top100.tsx`

**Migration Pattern**:
```typescript
// OLD (causing errors)
import { useAuth } from '@/contexts/AuthContext';
const { user, role, loading } = useAuth();

// NEW (correct pattern)
import { useUser } from '@supabase/auth-helpers-react';
import { useUserProfile } from '@/contexts/UserProfileContext';
const user = useUser();
const { profile, role, loading } = useUserProfile();
```

---

## 🎯 ROLLOUT PHASES

### **Phase 1: Foundation** ✅ COMPLETE
- [x] `SessionContextProvider` integration in `_app.tsx`
- [x] `UserProfileContext` implementation
- [x] `withAdminGuard` HOC creation
- [x] Core layout migration (`AppLayout.tsx`)
- [x] Legacy `AuthContext` removal

### **Phase 2: Component Migration** 🔄 IN PROGRESS
**Priority 1 - Unblock Application:**
- [ ] Install missing npm packages
- [ ] Fix TypeScript compilation errors

**Priority 2 - Complete Migration:**
- [ ] Update 8 remaining components (using migration pattern above)
- [ ] Test authentication flow (login/logout/signup)
- [ ] Verify admin access controls

### **Phase 3: API Security Review** ⏳ NEXT
**Admin API Routes** (requires security audit):
- `src/pages/api/admin/protected.ts`
- `src/pages/api/admin/refresh-events.ts`

**Security Pattern** (3-step verification):
1. **Authenticate**: Verify session with `createPagesServerClient`
2. **Authorize**: Check `role = 'otwstaff'` in `user_profiles` table
3. **Execute**: Use `supabaseAdmin` only after verification

---

## 🗄️ DATABASE SCHEMA STATUS

### ✅ MIGRATION-READY STRUCTURE
**Key Tables Using `auth_id`:**
- `user_profiles` (primary: `auth_id` → `auth.users.id`)
- `user_engagements` (foreign key: `auth_id`)
- `weekly_votes` (foreign key: `auth_id`)
- `product_roadmap_comments` (foreign key: `auth_id`)
- `ticketcubes` (foreign key: `auth_id`)

### **Schema Recommendations**:
1. **Column Naming**: ✅ Keep `auth_id` - consistently used across all tables
2. **Role Management**: ✅ Current `role = 'otwstaff'` pattern works well
3. **Profile Creation**: ✅ Handled in `AuthDialog.tsx` signup flow

---

## 🔒 SOCIAL LOGIN SETUP (Future Enhancement)

### **Google OAuth Configuration**:
1. **Supabase Dashboard**: Authentication > Providers > Google
2. **Required**: Google Cloud Console OAuth 2.0 credentials
3. **Redirect URLs**: Add your domain to authorized redirects

### **Apple OAuth Configuration**:
1. **Apple Developer Account**: Create Sign in with Apple service
2. **Supabase Dashboard**: Authentication > Providers > Apple
3. **Certificates**: Generate and upload Apple OAuth certificates

### **Implementation**:
```typescript
// Add to AuthDialog.tsx
const handleGoogleLogin = async () => {
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  });
};
```

---

## 🚨 IMMEDIATE ACTIONS REQUIRED

### **Today's Priority List**:
1. **Install Dependencies** (5 min): `npm install @supabase/auth-helpers-react @supabase/auth-helpers-nextjs`
2. **Fix Component Imports** (30 min): Update 8 components using migration pattern
3. **Test Core Flows** (15 min): Login, logout, signup, admin access
4. **Verify Profile System** (10 min): Ensure profile data loads correctly

### **This Week**:
1. **API Security Audit**: Review admin endpoint protection
2. **Performance Testing**: Ensure auth state changes are efficient
3. **Error Handling**: Robust error states for auth failures
4. **Documentation**: Update team on new auth patterns

---

## 📋 TESTING CHECKLIST

### **Core Authentication**:
- [ ] User can sign up with email/password
- [ ] User profiles are created automatically
- [ ] Login/logout works correctly
- [ ] Session persists across page reloads

### **Authorization & Security**:
- [ ] Admin pages only accessible to `otwstaff` users
- [ ] `withAdminGuard` HOC redirects non-admins
- [ ] API routes properly validate user roles
- [ ] Points system correctly identifies users

### **User Experience**:
- [ ] Loading states work during auth transitions
- [ ] Profile data displays correctly
- [ ] Navigation updates auth state immediately
- [ ] Error messages are user-friendly

---

## 🎯 SUCCESS CRITERIA

**Migration Complete When**:
- [ ] All TypeScript compilation errors resolved
- [ ] Application loads without runtime errors
- [ ] All authentication flows functional
- [ ] Admin security properly implemented
- [ ] User profile system working
- [ ] No references to old `AuthContext`

**Performance Goals**:
- Auth state changes < 100ms
- Profile loading < 500ms
- Page transitions smooth
- No unnecessary re-renders