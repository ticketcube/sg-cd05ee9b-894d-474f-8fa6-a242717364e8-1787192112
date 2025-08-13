# Project Plan: Role-Based Access for 'otwstaff' (Revised)

## 1. Objective
To implement a role-based access control (RBAC) system that creates a special user group called `otwstaff`. This group will have exclusive access to certain pages and UI elements that are unavailable to standard users.

## 2. Progress Update
Based on recent updates, the following foundational work is already complete:
- **Database Schema Updated:** The `user-profiles` table now includes a `role` column.
- **Test User Assigned:** The user `alan@alanrakov.com` has been assigned the `otwstaff` role.
- **Type Definitions Updated:** The `src/integrations/supabase/types.ts` file has been synced with the database changes.
- **Initial UI Added:** A preliminary "OTW STAFF ONLY" module has been added to the `/profile` page.

## 3. Revised Implementation Strategy
The remaining work will focus on integrating the `role` into the application logic and refining the UI.

### Phase 1: Data Integration (Backend &amp; Context)
This phase ensures the application's service layer and global state are aware of the new `role` attribute.

1.  **Update Data Services:** The `userProfileService.ts` needs to be modified. The function responsible for fetching a user's profile (`getFullUserProfile`) must be updated to select the new `role` column from the `user-profiles` table.
2.  **Update Authentication Context:** The `AuthContext.tsx` will be enhanced to fetch, store, and provide the user's `role` alongside other profile data. This makes the role globally accessible to any component for easy access control checks.

### Phase 2: Frontend Implementation &amp; Cleanup
This phase focuses on the user-facing changes and securing protected areas.

1.  **Refine Profile Page UI:** The new "OTW STAFF ONLY" module on `profile.tsx` will be reviewed and cleaned up. This includes ensuring it's only visible to `otwstaff` users, styling the buttons to match the site's design system, and ensuring the links are correct.
2.  **Create Protected Route:** The `/brandfolder-upload` page will be secured. We will use a client-side check within the component's lifecycle (`useEffect`). This check will validate the user's role via the `AuthContext`. If the user is not an `otwstaff` member, they will be programmatically redirected to the homepage (`/`).

## 4. Next Steps
1.  **Review this revised plan.**
2.  **Provide feedback or approval.**
3.  If approved, **switch to Creative Mode or Standard Mode** so I can begin the implementation as outlined above.
