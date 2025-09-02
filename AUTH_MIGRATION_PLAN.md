# Auth Migration Plan: Custom AuthProvider to Supabase Auth Helpers

This document outlines the necessary steps to complete the migration from a legacy `AuthContext` to the modern `@supabase/auth-helpers-react` and `@supabase/auth-helpers-nextjs` libraries.

**Update:** This plan has been revised to incorporate the provided `UserProfileContext.tsx` and `withAdminGuard.tsx` files, which accelerate the migration.

**Project-Specific Notes:**
*   **User Profile Key:** The `user_profiles` table is linked to the `auth.users` table via the `auth_id` field.
*   **Admin Role:** Access control for staff is determined by the `role` column in `user_profiles` having the value `"otwstaff"`.

---

## Migration Strategy

The migration will be executed in three main phases:

1.  **Phase 1: Core Refactoring &amp; Setup.** Integrate the new `UserProfileContext`, update the application's root structure, and establish an automatic profile creation mechanism. The old `AuthContext` will be marked for deprecation.
2.  **Phase 2: Client-Side Migration.** Systematically refactor all pages and components to use the new `useUser` and `useUserProfile` hooks, and implement the new `withAdminGuard` HOC for protecting admin pages.
3.  **Phase 3: Server-Side &amp; Cleanup.** Secure API routes, update server-side logic, and remove the deprecated `AuthContext` once it's no longer in use.

---

## Phase 1: Core Refactoring &amp; Setup

### 1.1. Adopt `UserProfileContext`
The provided `UserProfileContext.tsx` is well-structured and ready for integration. It correctly handles fetching profile data based on the Supabase user, including loading and error states.

*   **File:** `src/contexts/UserProfileContext.tsx`
*   **Action:** No changes needed. The file is ready to be used.

### 1.2. Update Application Root (`_app.tsx`)
This ensures providers are correctly layered and the Supabase client is initialized once.

*   **File:** `src/pages/_app.tsx`
*   **Changes:**
    *   A singleton instance of the Supabase client will be created and passed to the `SessionContextProvider`.
    *   The component tree will be wrapped as follows:
        ```jsx
        <SessionContextProvider supabaseClient={supabase}>
          <UserProfileProvider>
            <AppLayout>
              <Component {...pageProps} />
            </AppLayout>
          </UserProfileProvider>
        </SessionContextProvider>
        ```

### 1.3. Implement Automatic Profile Creation
To ensure every new user has a profile, we will use a Supabase Edge Function.

*   **Action:** Create a new Supabase Edge Function.
*   **Trigger:** This function will be triggered by the `auth.users.created` event.
*   **Logic:** Upon user creation, the function will insert a new row into the `user_profiles` table, linking it via the new user's `id` to the `auth_id` column.

### 1.4. Mark `AuthContext.tsx` as Deprecated
To avoid breaking the build mid-migration, we will phase out the old context gracefully.

*   **File:** `src/contexts/AuthContext.tsx`
*   **Action:**
    *   Add a `/** @deprecated */` JSDoc comment to the `AuthContext` and `useAuth` hook.
    *   The file will be deleted in Phase 3.

---

## Phase 2: Client-Side Migration

### 2.1. Implement Admin Page Protection with `withAdminGuard` HOC
The provided `withAdminGuard.tsx` HOC simplifies protecting admin routes.

*   **File to Update:** `src/pages/admin.tsx` (and any other admin-only pages).
*   **Action:**
    1.  Import the HOC: `import { withAdminGuard } from '@/components/guards/withAdminGuard';`
    2.  Wrap the page component in the HOC upon export.
    3.  Remove any manual, role-checking logic from within the page component itself.
    *   **Example:**
        ```jsx
        // In src/pages/admin.tsx
        const AdminPage = () => { /* page content */ };
        export default withAdminGuard(AdminPage);
        ```

### 2.2. Standard Client-Side Migration
The primary task is replacing all remaining `useAuth()` calls.

*   **Action:** Perform a project-wide search for `useAuth`.
*   **Refactoring Rule:**
    *   For authentication status: Replace `const { user } = useAuth()` with `const user = useUser()`.
    *   For profile data/role: Replace `const { userProfile, role } = useAuth()` with `const { profile, role, loading, error } = useUserProfile()`.
*   **Key Files to Update:**
    *   `src/components/layout/AppLayout.tsx`
    *   `src/components/AuthGuard.tsx` (This can be refactored to use `useUser` for non-admin protected routes).
    *   `src/components/AuthDialog.tsx`
    *   `src/pages/profile.tsx`
    *   ... and all other components using `useAuth`.

---

## Phase 3: Server-Side &amp; Cleanup

### 3.1. Secure API Routes
Update all protected API routes to use the standard Auth Helpers method for server-side user verification.

*   **Action:** For each API route in `src/pages/api/...` that requires authentication, replace manual JWT logic with `createPagesServerClient` from `@supabase/auth-helpers-nextjs`.

### 3.2. Update Admin Logic (`supabaseAdmin.ts`)
The helper function for verifying admin access needs to be corrected.

*   **File:** `src/lib/supabaseAdmin.ts`
*   **Changes:**
    *   Update `verifyAdminAccess` to query the `user_profiles` table and check if a user's `role` is `"otwstaff"`.

### 3.3. Final Cleanup
Once all components and pages have been migrated, the old context can be removed.

*   **Action:** Delete the file `src/contexts/AuthContext.tsx`.

---

## Future Improvements

*   **Role Management:** To improve scalability, the hardcoded `"otwstaff"` string should be replaced. Consider implementing a roles `enum` or a dedicated `roles` table in the database that can be managed dynamically.
