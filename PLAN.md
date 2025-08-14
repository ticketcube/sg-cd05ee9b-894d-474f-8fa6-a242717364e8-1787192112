# OTWChart Points &amp; Engagement System - Improvement Plan

**Document Version:** 2.0
**Date:** 2025-08-14

## 1. Executive Summary

This document outlines a revised, two-phase strategic plan to overhaul the OTWChart points and user engagement systems. Based on new requirements, we will pivot from a static, hardcoded points system to a dynamic, database-driven one. This plan introduces new engagement loops and clarifies existing rules to create a more robust, flexible, and user-centric platform.

---

## **Phase 1: Core System Overhaul &amp; New Engagement Rules**

This phase prioritizes foundational changes and the implementation of critical new features.

### **1.1. Points Allocation: From Hardcoded to Database-Driven**

-   **Action:** All point values will be fetched directly from the `public.points_config` table in Supabase, replacing the current hardcoded values.
-   **Strategic Recommendation:** To maximize flexibility, the `points_config` table should be structured to include:
    -   `action_name` (text, primary key): A unique identifier (e.g., `VIDEO_VIEW`, `VOTE_SUBMIT`).
    -   `points_value` (integer): The points awarded.
    -   `frequency` (text): Defines how often points can be earned (e.g., `ONCE_PER_VIDEO`, `ONCE_PER_WEEKLY_LIST`).
    -   `min_value` (integer, nullable): A conditional value, such as the **15**-second minimum watch time for videos.
-   **Benefit:** This architecture allows for real-time adjustments to the points economy directly from the Supabase dashboard, without requiring new code deployments.

### **1.2. Reworked Video View Points**

-   **New Rule:** Users can earn points for watching a video (15+ seconds) at any time, independent of a weekly list's voting window. This makes all video content "evergreen" for engagement.
-   **Tracking Logic:** Points will be awarded **once per unique artist video**. The system will log each video view to prevent duplicate point awards.

### **1.3. New "Watch Completion" Bonus**

-   **Action:** The previous, confusing "vote completion bonus" will be deprecated.
-   **New Feature:** A **"Watch Completion Bonus"** will be introduced, rewarding users for watching all videos on a given weekly list.
-   **UI Impact:** The frontend will be updated to display a "watched" status indicator (e.g., a checkmark) on videos the user has already viewed, providing clear visual feedback on their progress.

### **1.4. Decouple Voting and Viewing Windows**

-   **Action:** The `start_date` and `end_date` fields on a weekly list will now control **voting eligibility only**.
-   **User Experience:** On expired lists, the voting functionality will be disabled, but users will retain the ability to watch videos and earn associated points.

### **1.5. "How It Works" Onboarding Modal**

-   **Action:** An informational popup will be created to explain the points system.
-   **Implementation:**
    -   A `Dialog` component will be used, capable of displaying text or an embedded video.
    -   It will load automatically on a user's first visit, tracked via the browser's `localStorage`.
    -   A persistent link (e.g., "How It Works?") will be added to the UI, allowing users to access the guide at any time.

---

## **Phase 2: Advanced Growth &amp; Retention Features**

These features add significant value but are more complex and should be built upon the stable foundation of Phase 1.

### **2.1. Weekly Voting Streak Bonus**

-   **Concept:** Reward users with bonus points for voting in consecutive weeks.
-   **Recommendation:** Implement as a **weekly streak** to align with the platform's content cycle. This is a powerful retention mechanic.
-   **Implementation Note:** Requires backend logic to track each user's weekly voting history and check for continuity. This is a well-defined feature perfect for Phase 2.

### **2.2. Referral Bonus System**

-   **Concept:** Reward users with points for referring new users who actively participate.
-   **Recommendation:** Defer to **Phase 2** due to complexity.
-   **Reasoning:** A secure referral system is a significant undertaking. It requires mechanisms for unique code generation, fraud prevention (e.g., preventing users from referring themselves), tracking the lifecycle of referred users, and reliably awarding points upon a valid conversion event (e.g., the new user's first vote).

---

## **Implementation Priority (Phase 1)**

1.  **Backend First:**
    -   Ensure `points_config` schema is updated.
    -   Refactor all services (`weeklyVotingService`, etc.) to read from this table instead of using hardcoded values.
    -   Update `weeklyListService` to use `start_date` and `end_date` for voting status.
2.  **Frontend Next:**
    -   Implement the video watch timer and the logic to call the backend.
    -   Develop the "watched" status UI indicators.
    -   Build the "How It Works" modal and its associated `localStorage` logic.
3.  **Testing:**
    -   Thoroughly test all point-awarding scenarios to ensure accuracy and adherence to the new rules.
