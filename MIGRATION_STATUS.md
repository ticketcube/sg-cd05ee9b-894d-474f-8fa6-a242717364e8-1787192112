
# Auth Migration Status &amp; Next Steps

**Last Updated:** 2025-09-02

This document provides an update on the authentication system migration from the legacy `AuthContext` to the new Supabase Auth Helpers (`@supabase/auth-helpers-react`).

## Current Status: In Progress (Blocked)

The migration is approximately 85% complete. The core infrastructure changes have been made, but a critical blocking issue is preventing the application from running.

**Blocking Issue:**
- **Error:** `Error: Cannot find module '@supabase/auth-helpers-react'`
- **Cause:** The required npm packages (`@supabase/auth-helpers-react` and `@supabase/auth-helpers-nextjs`) were not installed in `package.json`.
- **Impact:** The entire application is failing to load because `_app.tsx` and numerous other components cannot find the Supabase auth modules they depend on.

## Work Completed

- **`_app.tsx` Refactor:**
  - `SessionContextProvider` has been added to wrap the application.
  - The legacy `AuthContext.Provider` has been removed.
- **`UserProfileContext` Implementation:**
  - A new context (`UserProfileContext`) has been created to manage user profile data, fetching it based on the authenticated user's ID.
- **Component &amp; Page Migration:**
  - Most major components and pages have been updated to use the new hooks:
    - `useUser` from `@supabase/auth-helpers-react` for auth state.
    - `useUserProfile` from `UserProfileContext` for profile data.
  - Examples include: `AppLayout`, `admin.tsx`, `discovery-dashboard.tsx`, `profile.tsx`, and `withAdminGuard.tsx`.
- **API Route Protection:**
  - Admin-only API routes like `/api/admin/protected` have been updated to use the new Supabase-based authentication checks.

## Remaining Tasks &amp; Fixes

1.  **Install Dependencies (Critical):**
    - **Action:** Run `npm install @supabase/auth-helpers-react @supabase/auth-helpers-nextjs`.
    - **Outcome:** This will resolve the primary blocking error.

2.  **Fix TypeScript Errors:**
    - **Issue:** Multiple components (`ProfileSetupModal`, `profile.tsx`) are trying to access properties (`email`, `avatar_url`, `raw_city_input`, `created_at`) that are not defined on the `UserProfile` type in `UserProfileContext.tsx`.
    - **Action:** Update the `UserProfile` type definition to include all fields fetched from the `user_profiles` table.
    - **Issue:** A typo (`artists` instead of `artist`) exists in `src/components/ArtistProfileLookup.tsx`.
    - **Action:** Correct the variable name.

3.  **Deprecate `AuthContext.tsx`:**
    - **Action:** The file `src/contexts/AuthContext.tsx` can now be safely deleted as it is no longer used anywhere.

4.  **Final Validation:**
    - **Action:** After applying the fixes, perform a full application test to ensure:
        - Login/Logout functionality works correctly.
        - The index page loads without errors.
        - Protected pages and components are correctly guarded.
        - User profile data is displayed accurately.

Once these steps are complete, the migration will be finished.
