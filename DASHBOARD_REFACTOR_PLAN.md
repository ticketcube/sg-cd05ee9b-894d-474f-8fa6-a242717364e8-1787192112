# Discovery Dashboard Refactoring Plan

This document outlines the step-by-step process for refactoring the `discovery-dashboard.tsx` page into a modular, component-based structure.

## 1. Project Goal

The primary goal is to improve the maintainability, readability, and scalability of the Discovery Dashboard page by breaking down its monolithic structure into smaller, reusable React components. This refactor will also help isolate and correctly implement authentication and data-loading logic.

## 2. Proposed Component Structure

A new directory will be created at `src/components/dashboard/` to house the new components.

-   **`src/components/dashboard/DashboardHeader.tsx`**: A presentational component to display the welcome message and user statistics grid.
    -   **Props**: `profile`, `stats` (total points, votes, videos, weeks active).
-   **`src/components/dashboard/HeroVideo.tsx`**: A self-contained component for the hero video section and the "Rate This Week's Artists" call-to-action button.
    -   **Props**: None.
-   **`src/components/dashboard/TabNavigation.tsx`**: Manages the tabbed navigation interface.
    -   **Props**: `activeTab`, `setActiveTab`, `userRole`.
-   **`src/components/dashboard/DiscoverMoreTab.tsx`**: The content panel for the "Discover" tab.
    -   **Props**: None.
-   **`src/components/dashboard/MoreRewardsTab.tsx`**: The content panel for the "Rewards" tab.
    -   **Props**: `totalPoints`, `weeksActive`, `totalVideos`.
-   **`src/components/dashboard/DashboardLoading.tsx`**: A simple loading state component displayed while fetching user data.
    -   **Props**: None.
-   **`src/components/dashboard/DashboardAuthBlock.tsx`**: A component shown to unauthenticated users, prompting them to sign in.
    -   **Props**: `onSignInClick`.

## 3. Refactoring Checklist

### Step 1: Create Component Files
-   [x] Create `src/components/dashboard/` directory.
-   [x] Create `DashboardHeader.tsx`.
-   [x] Create `HeroVideo.tsx`.
-   [x] Create `TabNavigation.tsx`.
-   [x] Create `DiscoverMoreTab.tsx`.
-   [x] Create `MoreRewardsTab.tsx`.
-   [x] Create `DashboardLoading.tsx`.
-   [x] Create `DashboardAuthBlock.tsx`.

### Step 2: Implement Helper Components
-   [x] Implement the UI for `DashboardLoading.tsx`.
-   [x] Implement the UI and logic for `DashboardAuthBlock.tsx`.

### Step 3: Migrate UI Content to Components
-   [x] Move the `HeroVideo` function from `discovery-dashboard.tsx` to its new file and export it.
-   [x] Move the `DiscoverMoreTab` function from `discovery-dashboard.tsx` to its new file and export it.
-   [x] Move the `MoreRewardsTab` function from `discovery-dashboard.tsx` to its new file and export it.

### Step 4: Implement Core UI Components
-   [x] Extract the header JSX (welcome message, stats grid) into `DashboardHeader.tsx`.
-   [x] Extract the tab buttons and associated logic into `TabNavigation.tsx`.

### Step 5: Refactor the Main Page
-   [x] Rewrite `discovery-dashboard.tsx` to be a container component.
-   [x] It should handle all state management (`activeTab`, `userHistory`, etc.).
-   [x] It should handle all data fetching logic (`useUserProfile`, `userProfileService`).
-   [x] It should implement the loading and unauthenticated guards.
-   [x] It should compose the new components (`DashboardHeader`, `TabNavigation`, etc.) to build the final page.
