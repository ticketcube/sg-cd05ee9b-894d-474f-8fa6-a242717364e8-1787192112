# Points &amp; Voting System - Strategic Review &amp; Improvement Plan

**Document Version:** 1.0
**Date:** 2025-08-13

## 1. Executive Summary

This document outlines the findings from a comprehensive review of the OTWChart points and weekly voting system. The current implementation contains several critical inconsistencies related to point allocation, video timers, voting locks, and the logic that determines the active voting week.

The following plan provides a clear, cost-effective strategy to resolve these issues, creating a more robust, automated, and user-friendly system.

## 2. Current State Analysis &amp; Findings

This section answers the key questions about the system's current functionality based on a thorough code review.

### 2.1. Points Allocation

Points are defined in `src/services/weeklyVotingService.ts` and allocated as follows:

-   **Video View**: **5 points**.
    -   **Conditions**: Requires a minimum **15-second** watch time and is only awarded **once per artist per week**.
-   **Vote Submission**: **10 points**.
    -   **Condition**: Awarded only on the **first submission** for a given week.
-   **Completion Bonus**: **5 additional points**.
    -   **Condition**: Awarded when a user votes on exactly **5 artists**.
    -   **Identified Issue**: This is inconsistent, as the weekly list presents 10 artists. Users voting for all 10 will not receive this bonus.

### 2.2. Video Timers

-   **Finding**: **The video watch timer is NOT implemented.**
-   **Impact**: Although the backend is designed to award points based on a `watchTimeSeconds` value, the frontend never tracks or sends this data. As a result, **users cannot earn points for watching videos**.

### 2.3. Weekly Vote Locking

-   **Finding**: A user **can vote multiple times** for the same week by refreshing the page. Their latest vote overwrites the previous one.
-   **Point System**: The system correctly prevents users from earning points on subsequent votes.
-   **Identified Issue**: The UI provides a poor user experience. The "SUBMIT VOTES" button re-enables on page refresh, misleading the user into thinking they can earn more points.

### 2.4. Weekly List Availability

-   **Finding**: The active weekly list is determined by a `status = 'active'` field in the database.
-   **Identified Issue**: The `start_date` and `end_date` fields are **completely ignored**. This requires manual, time-sensitive database updates to start and stop weekly voting contests and is highly prone to human error.

## 3. Strategic Recommendations for Improvement

The following recommendations are designed to be the fastest and most cost-effective way to create a consistent and reliable system.

### Recommendation 1: Centralize and Standardize Points Logic

-   **Action**: Create a single configuration file at `src/config/points.ts` to store all point values (e.g., `VIDEO_VIEW`, `VOTE_SUBMISSION`, `MIN_WATCH_TIME`).
-   **Benefit**: Simplifies future adjustments and ensures all parts of the application use the same values.
-   **Action**: Modify the "Completion Bonus" logic to be flexible, awarding the bonus based on the total number of artists available in that week's list, not a hardcoded value of `5`.

### Recommendation 2: Implement the Video Watch Timer (Critical Fix)

-   **Action**: Modify the video player popup component (`UnifiedArtistPopup.tsx` or equivalent).
-   **Implementation**:
    1.  Use a `useEffect` hook with `setInterval` to start a timer when the video begins playing.
    2.  When the popup is closed or the video ends, call `weeklyVotingService.recordVideoView` and pass the total tracked `watchTimeSeconds`.
-   **Benefit**: This will fix the non-functional video points feature, a core part of the user engagement loop.

### Recommendation 3: Improve Voting State Management &amp; UI

-   **Action**: Implement a persistent "voted" state on the frontend.
-   **Implementation**:
    1.  In `weekly.tsx`, before rendering the page content, make a call to the backend to check if the user has already voted for the current `week_identifier`.
    2.  If they have, permanently disable the "SUBMIT VOTES" button and display a clear, friendly message (e.g., "Thanks for voting this week!").
-   **Benefit**: Prevents user confusion and provides a much better user experience.

### Recommendation 4: Automate Weekly List Availability (Architectural Improvement)

-   **Action**: Modify the backend logic to respect the `start_date` and `end_date` for weekly lists.
-   **Implementation**:
    1.  Update the `weeklyListService.getActiveWeeklyList` function.
    2.  The new database query should select the list where `CURRENT_TIMESTAMP` is between `start_date` and `end_date`. The `status` field can still be used for drafts.
-   **Benefit**: This is a huge improvement. It makes the system **fully automated**, removing the need for manual weekly database updates and eliminating a major potential point of failure.

## 4. Implementation Priority

The recommended order of implementation is:

1.  **High Priority**: Fix the weekly list availability logic (**Rec. 4**) and implement the video timer (**Rec. 2**), as these are core functional gaps.
2.  **Medium Priority**: Improve the voting state UI (**Rec. 3**) to fix the user experience issue.
3.  **Low Priority**: Centralize the points configuration (**Rec. 1**) as a code quality improvement.
