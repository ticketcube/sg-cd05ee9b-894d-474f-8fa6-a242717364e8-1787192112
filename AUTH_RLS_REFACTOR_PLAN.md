# Auth &amp; RLS Refactoring Plan

This document outlines the strategy and step-by-step process for refactoring the application's authentication and authorization systems to be secure, robust, and reliant on Supabase Row Level Security (RLS).

## 1. Project Goals

1.  **Enable RLS:** Enforce RLS on all critical tables to ensure data is secure at the database level.
2.  **Centralize Auth Logic:** Consolidate user session and profile management into a clear, predictable system.
3.  **Secure All Writes:** Eliminate all direct database writes from the client-side. All mutations must go through secure, server-side API endpoints.
4.  **Clarify Roles:** Formalize the access control patterns for regular users vs. `otwstaff` administrators.
5.  **Verify Service Role:** Ensure the `supabaseAdmin` client (using the `service_role` key) is used correctly and exclusively for operations that require bypassing RLS.

## 2. Core Principles

*   **RLS is the Single Source of Truth:** The database, not the application, is the ultimate authority on who can access what data.
*   **APIs for All Mutations:** The client-side application **never** writes directly to the database. It calls API endpoints, which then validate the request and perform the database operation.
*   **Defense in Depth:** We will use security at multiple layers:
    *   **UI Layer:** Show/hide components based on user role.
    *   **Page Layer:** Use guards to prevent access to entire pages.
    *   **API Layer:** Validate user sessions and roles on every request.
    *   **Database Layer:** Enforce RLS policies on every query.

## 3. Step-by-Step Refactoring Checklist

---

### **Phase 1: Database &amp; Policy Lockdown**

*   [ ] **Step 1.1: Create SQL Policies File:** Create a new file `SECURE_RLS_POLICIES.sql` to hold all our new RLS policies.
*   [ ] **Step 1.2: Define Helper Functions:** Add SQL helper functions to get the current user's ID and role within policies.
*   [ ] **Step 1.3: Define `user_profiles` Policies:**
    *   Users can `SELECT` their own profile.
    *   Users can `UPDATE` their own profile.
    *   `otwstaff` can `SELECT` all profiles.
    *   (No `INSERT` or `DELETE` for users).
*   [ ] **Step 1.4: Define `user_engagements` Policies:**
    *   Users can `SELECT` their own engagements.
    *   Users can `INSERT` engagements for themselves.
    *   `otwstaff` can `SELECT` all engagements.
    *   (No `UPDATE` or `DELETE` for users).
*   [ ] **Step 1.5: Define Policies for Other Tables:** Add default `SELECT` policies for public-read tables (e.g., `artists`, `weekly_lists`) and restrictive policies for others.
*   [ ] **Step 1.6: Enable RLS on All Tables:** Add `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` for every table with a new policy.
*   [ ] **Step 1.7: Apply Policies:** Execute the `SECURE_RLS_POLICIES.sql` file.

---

### **Phase 2: Backend API &amp; Service Refactoring**

*   [ ] **Step 2.1: Audit &amp; Refactor `pages/api/user/profile.ts`:** Simplify the API. With RLS, the `eq('user_id', userId)` check becomes redundant for security (but good for clarity). Ensure it correctly handles updates.
*   [ ] **Step 2.2: Create `pages/api/user/engagements.ts`:** Create a new API endpoint for recording user engagements. This will replace the client-side `recordEngagement` logic.
*   [ ] **Step 2.3: Refactor `userProfileService.ts`:**
    *   Remove all direct `supabase.from(...).insert/update/delete` calls.
    *   Update functions like `updateUserLocation` and `recordEngagement` to use the `fetch` API to call the new server-side endpoints.
    *   Keep read-only functions like `getUserProfile` as they are (client-side reads are fine).
*   [ ] **Step 2.4: Verify Admin APIs:** Confirm that `pages/api/admin/protected.ts` and any other admin-only endpoints correctly use the `supabaseAdmin` client.

---

### **Phase 3: Client-Side Consolidation &amp; Verification**

*   [ ] **Step 3.1: Solidify `UserProfileContext`:** Ensure the context is robust and reliably provides the user's `profile` and `role`.
*   [ ] **Step 3.2: Create/Verify `withAdminGuard.tsx`:** Implement a Higher-Order Component that protects pages by checking for the `otwstaff` role from `UserProfileContext`.
*   [ ] **Step 3.3: Apply Admin Guard:** Wrap the `AdminPage` in `_app.tsx` or `admin.tsx` with the `withAdminGuard`.
*   [ ] **Step 3.4: Full System Test (As User):**
    *   Log in as a regular user.
    *   Confirm you can update your profile.
    *   Confirm you can perform an action that records an engagement (e.g., vote).
    *   Confirm you **cannot** access `/admin`.
    *   Confirm you **cannot** update another user's profile via API calls.
*   [ ] **Step 3.5: Full System Test (As Admin):**
    *   Log in as an `otwstaff` user.
    *   Confirm you **can** access `/admin`.
    *   Confirm admin-only functionality works.

## 4. File &amp; Code Inventory

*   **New Files:**
    *   `AUTH_RLS_REFACTOR_PLAN.md` (this file)
    *   `AUTH_RLS_STATUS.md`
    *   `SECURE_RLS_POLICIES.sql`
    *   `pages/api/user/engagements.ts`
*   **Files to Modify:**
    *   `pages/api/user/profile.ts`
    *   `services/userProfileService.ts`
    *   `guards/withAdminGuard.tsx` (or create it)
    *   Possibly `pages/admin.tsx` to apply the guard.
