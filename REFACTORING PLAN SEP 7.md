# Weekly Ratings Page Refactoring Plan (Sept 7)

## 1. Overview

This document outlines a step-by-step plan to refactor the `weekly-ratings` page. The primary goal is to move from a monolithic component to a more maintainable, scalable, and testable architecture based on a clear separation of concerns.

We will follow the collaborative workflow you've defined, where I will provide instructions for each step, and you will implement the changes. I will then verify your work before we proceed to the next step.

## 2. Current Architecture Assessment

After reviewing the current codebase, the problems identified in your draft plan are confirmed:

*   **Monolithic Page Component**: `weekly-ratings.tsx` handles too many responsibilities, including data fetching, state management, business logic, and UI rendering.
*   **State Management Sprawl**: Logic is scattered across numerous `useState` and `useEffect` hooks, making the component fragile and hard to follow.
*   **Coupled Logic**: Business logic is tightly coupled with UI rendering, making it difficult to test in isolation.
*   **Inconsistent Data Flow**: Write paths for user engagements are not unified. We need to funnel all engagements through a single, consistent service function.

## 3. Target Architecture

We will refactor towards a modern React architecture with four distinct layers:

1.  **Service Layer (Data)**: Responsible for all communication with the backend.
    *   `weeklyListService.ts`, `weeklyVotingService.ts`, `userProfileService.ts`
2.  **Hooks Layer (State &amp; Logic)**: Custom hooks that consume services, manage state, and contain business logic.
    *   `useWeeklyLists`, `useWeeklyListDetail`, `usePointsOnboarding`
3.  **Component Layer (UI)**: Small, focused components responsible only for rendering UI.
    *   `WeeklyListSelector`, `WeeklyArtistGrid`, `WeeklyRatingsQuadrant`, etc.
4.  **Constants Layer (Shared Values)**: Centralizes application-wide constant values to ensure consistency.
    *   `engagementTypes.ts`

## 4. File Impact &amp; Structure

Here is the proposed file structure for the refactoring.

```
src/
├── components/
│   └── weekly/  (NEW FOLDER)
│       ├── WeeklyArtistGrid.tsx         (NEW - Renders artist avatars for rating)
│       ├── WeeklyError.tsx              (NEW - Displays error state)
│       ├── WeeklyListSelector.tsx       (NEW - Dropdown to select a weekly list)
│       ├── WeeklyLoading.tsx            (NEW - Displays loading state)
│       ├── WeeklyEmpty.tsx              (NEW - Displays empty state for lists)
│       ├── WeeklyRatingsQuadrant.tsx    (NEW - Renders the quadrant chart)
│       └── WeeklyRewardsHeader.tsx      (NEW - Renders page title and modal button)
├── constants/
│   └── engagementTypes.ts       (EXISTING - Crucial for standardizing engagement type strings)
├── hooks/
│   ├── usePointsOnboarding.ts   (NEW - Manages the onboarding popup logic)
│   ├── useWeeklyListDetail.ts   (NEW - Manages state for a single weekly list)
│   └── useWeeklyLists.ts        (NEW - Manages fetching and selecting from all weekly lists)
├── lib/
│   └── quadrant.ts              (NEW - Utility functions for quadrant/slider math)
├── pages/
│   ├── weekly-ratings.tsx       (REFACTORED - Becomes an orchestrator)
│   └── api/
│       └── voting/
│           ├── submit.ts              (REFACTORED - Quadrant voting endpoint)
│           └── videoview_submit.ts    (REFACTORED - Video view endpoint)
├── services/
│   ├── weeklyListService.ts     (TO BE TIDIED - Minor clean-up)
│   └── weeklyVotingService.ts   (TO BE REFACTORED - Unify write paths)
└── types/
    └── weekly.ts                (NEW - Shared TypeScript types for this feature)
```

## 5. Step-by-Step Refactoring Workflow

We will execute this plan in a series of clear, sequential steps.

*   **Step 1: Foundational Types &amp; Utilities**
    *   **Task 1.1**: Create the shared types file `src/types/weekly.ts`.
    *   **Task 1.2**: Create the quadrant math helper `src/lib/quadrant.ts`.

*   **Step 2: Service Layer Refinement**
    *   **Task 2.1**: Refactor `src/services/weeklyVotingService.ts` to unify write paths using `userProfileService` and `engagementTypes`.
    *   **Task 2.2**: Tidy up `src/services/weeklyListService.ts`.

*   **Step 3: Logic Extraction into Hooks**
    *   **Task 3.1**: Create the `src/hooks/usePointsOnboarding.ts` hook.
    *   **Task 3.2**: Create the `src/hooks/useWeeklyLists.ts` hook.
    *   **Task 3.3**: Create the `src/hooks/useWeeklyListDetail.ts` hook.

*   **Step 4: UI Decomposition into Components**
    *   **Task 4.1**: Create stateless UI components: `WeeklyRewardsHeader`, `WeeklyListSelector`, `WeeklyLoading`, `WeeklyError`, and `WeeklyEmpty`.
    *   **Task 4.2**: Create the `WeeklyArtistGrid` component.
    *   **Task 4.3**: Create the `WeeklyRatingsQuadrant` component.

*   **Step 5: Page Orchestration**
    *   **Task 5.1**: Rewrite `src/pages/weekly-ratings.tsx` to use the new hooks and components.

*   **Step 6: API Endpoint &amp; Cleanup**
    *   **Task 6.1**: Ensure API endpoints (`submit.ts`, `videoview_submit.ts`) correctly use the refactored services.
    *   **Task 6.2**: Identify and remove any redundant code or files.
