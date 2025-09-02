# Auth Migration Plan: Custom AuthProvider to Supabase Auth Helpers

This document outlines the necessary steps to complete the migration from a legacy `AuthContext` to the modern `@supabase/auth-helpers-react` and `@supabase/auth-helpers-nextjs` libraries.

**Project-Specific Notes:**
*   **User Profile Key:** The `user_profiles` table is linked to the `auth.users` table via the `auth_id` field.
*   **Admin Role:** Access control for staff is determined by the `role` column in `user_profiles` having the value `"otwstaff"`.

---

## Migration Strategy

The migration will be executed in three main phases:

1.  **Phase 1: Core Refactoring &amp; Setup.** Set up the new `UserProfileContext`, update the application's root structure, and establish an automatic profile creation mechanism. The old `AuthContext` will be marked for deprecation.
2.  **Phase 2: Client-Side Migration.** Systematically refactor all pages and components to use the new `useUser` and `useUserProfile` hooks instead of the deprecated `useAuth` hook.
3.  **Phase 3: Server-Side &amp; Cleanup.** Secure API routes, update server-side logic, and remove the deprecated `AuthContext` once it's no longer in use.

---

## Phase 1: Core Refactoring &amp; Setup

### 1.1. Create `UserProfileContext`
A new context will manage application-specific user profile data.

*   **File:** `src/contexts/UserProfileContext.tsx` (New File)
*   **Functionality:**
    *   Uses `useUser()` from `@supabase/auth-helpers-react` to monitor the authenticated user.
    *   When the user is available, it fetches the corresponding row from the `user_profiles` table.
    *   **Provides:**
        *   `profile`: The full user profile object.
        *   `role`: The user's role (e.g., `"otwstaff"`).
        *   `loading`: A boolean for the initial fetch state.
        *   `error`: An `Error` object if the profile fetch fails.
        *   `refreshProfile`: A function to manually re-fetch data.

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
    *   The file will be deleted in Phase 3 after all its usages have been removed.

---

## Phase 2: Client-Side Migration

The primary task is replacing all `useAuth()` calls.

*   **Action:** Perform a project-wide search for `useAuth`.
*   **Refactoring Rule:**
    *   Replace `const { user } = useAuth()` with `const user = useUser()`.
    *   Replace `const { userProfile, role } = useAuth()` with `const { profile, role, loading, error } = useUserProfile()`.
*   **Key Files to Update:**
    *   `src/components/layout/AppLayout.tsx`
    *   `src/components/AuthGuard.tsx`
    *   `src/components/AuthDialog.tsx`
    *   `src/pages/profile.tsx`
    *   `src/pages/admin.tsx`
    *   ... and all other components using `useAuth`.

---

## Phase 3: Server-Side &amp; Cleanup

### 3.1. Secure API Routes
Update all protected API routes to use the standard Auth Helpers method for server-side user verification.

*   **Action:** For each API route in `src/pages/api/...` that requires authentication:
    *   Replace manual JWT logic with `createPagesServerClient` from `@supabase/auth-helpers-nextjs`.

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
