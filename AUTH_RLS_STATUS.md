# Auth &amp; RLS Refactor Status

This document tracks our progress against the `AUTH_RLS_REFACTOR_PLAN.md`.

## Phase 1: Stabilize Auth Flow &amp; Fix Race Condition

- [x] **Task 1.1: Refactor `UserProfileContext`** - Introduce a `loading` state to manage auth states correctly.
- [x] **Task 1.2: Refactor `AuthGuard`** - Use the new `loading` state from `UserProfileContext` to show a loading indicator instead of redirecting prematurely.
- [ ] **Task 1.3: Update `AppLayout` and Pages** - Ensure `AppLayout.tsx` and protected pages like `discovery-dashboard.tsx` handle the loading state gracefully.

## Phase 2: Solidify RLS &amp; Secure API Routes

- [ ] **Task 2.1: Audit &amp; Script RLS Policies** - Review all tables and create a comprehensive SQL script for RLS policies.
- [ ] **Task 2.2: Enable Row Level Security** - Apply the RLS policies to the database.
- [ ] **Task 2.3: Refactor API Routes** - Update all API routes to use the Supabase admin client where necessary and respect RLS.
- [ ] **Task 2.4: Refactor `withAdminGuard`** - Update the admin guard to use the new `isAdmin` flag from `UserProfileContext`.

## Phase 3: Final Testing &amp; Cleanup

- [ ] **Task 3.1: End-to-End Testing** - Verify all authentication and authorization flows.
- [ ] **Task 3.2: Cleanup** - Remove old, unused auth components and helper functions.
