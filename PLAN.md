# Project Plan: Role-Based Access for 'otwstaff'

## 1. Objective
To implement a role-based access control (RBAC) system that creates a special user group called `otwstaff`. This group will have exclusive access to certain pages and UI elements that are unavailable to standard users.

## 2. Initial Scope
- **Create Role:** Establish a new `otwstaff` user role.
- **Assign Test User:** Assign the `otwstaff` role to the user `alan@alanrakov.com` for testing and validation.
- **Restrict Page Access:** Make the `/brandfolder-upload` page accessible only to users with the `otwstaff` role.
- **Conditional UI:** Add a new button, "OTW Staff Submit Content", to the `/profile` page. This button should only be visible to `otwstaff` users and link to the `/brandfolder-upload` page.

## 3. Implementation Strategy
The project will be executed in three distinct phases to ensure a clean and robust implementation.

### Phase 1: Database Enhancement (Supabase)
The foundation of the RBAC system will be built within the Supabase database.

1.  **Modify `profiles` Table:** A new column named `role` of type `TEXT` will be added to the `public.profiles` table. This approach is scalable and allows for the easy addition of more user roles in the future.
2.  **Assign Role to Test User:** An SQL script will be run to update the profile record associated with `alan@alanrakov.com`, setting the new `role` column to `'otwstaff'`.

### Phase 2: Backend Integration &amp; Type Safety
This phase ensures the application's backend and service layer are aware of the new `role` attribute.

1.  **Update Data Services:** The `userProfileService.ts` will be modified. The function responsible for fetching a user's profile (`getFullUserProfile`) will be updated to select the new `role` column from the `profiles` table.
2.  **Update Type Definitions:** To maintain type safety and leverage TypeScript's benefits, we will update the relevant type definitions. This includes the auto-generated Supabase types in `src/integrations/supabase/types.ts` and any manually defined `Profile` types within the application, such as in `AuthContext.tsx`.

### Phase 3: Frontend Implementation
This phase focuses on the user-facing changes.

1.  **Update Authentication Context:** The `AuthContext.tsx` will be enhanced to fetch, store, and provide the user's `role` alongside other profile data. This makes the role globally accessible to any component.
2.  **Create Protected Route:** The `/brandfolder-upload` page will be secured. We will use a client-side check within the component's lifecycle (`useEffect`). This check will validate the user's role via the `AuthContext`. If the user is not an `otwstaff` member, they will be programmatically redirected to the homepage (`/`).
3.  **Add Conditional UI on Profile Page:** A new button will be added to the `profile.tsx` component. Its visibility will be conditional, based on the `user.profile.role === 'otwstaff'` check. The button will be styled consistently with existing UI elements and will link to `/brandfolder-upload`.

## 4. Next Steps
1.  **Review this plan.**
2.  **Provide feedback or approval.**
3.  If approved, **switch to Creative Mode or Standard Mode** so I can begin the implementation as outlined above.
