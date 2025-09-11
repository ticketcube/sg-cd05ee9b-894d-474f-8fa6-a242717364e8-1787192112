
# Profile Page Redesign Plan

This document outlines the plan to redesign the user profile page to include three new components: a user data card, an MVP survey, and a favorite artists grid.

## 1. New Components

### `UserProfileCard.tsx`
- **Purpose:** Display core user data.
- **Data:** `username`, `email`, `total_points`.
- **Data Source:** `useUserProfile()` context. No new backend work needed.

### `MvpSurvey.tsx`
- **Purpose:** A one-time survey for MVP feedback, awarding 25 points.
- **Functionality:**
    - A simple 3-question form.
    - Submits to a new API endpoint.
    - Prevents multiple submissions; shows a "completed" state if already taken.
- **API Requirement:** `POST /api/user/mvp-survey`

### `FavoriteArtistsGrid.tsx`
- **Purpose:** Display a grid of the user's most engaged-with artists.
- **Functionality:**
    - Fetches top artists from a new API endpoint.
    - Displays artists in a card format.
    - Includes a "Ticket Links Coming Soon" placeholder on each card.
- **API Requirement:** `GET /api/user/favorite-artists`

## 2. API & Service Layer

### API Endpoint: `POST /api/user/mvp-survey`
- **Logic:**
    - Authenticate user.
    - Check `user_engagements` for an existing `mvp_survey` entry for the user. If found, return an error.
    - Insert a new record into `user_engagements` with `engagement_type = 'mvp_survey'`.
    - Use the `increment_user_points` Supabase RPC to add 25 points to the user's profile.
    - Return a success message with points earned.

### API Endpoint: `GET /api/user/favorite-artists`
- **Logic:**
    - Authenticate user.
    - Query `user_engagements` table.
    - Group by `artist_uuid`, count engagements, and order by the count descending.
    - Limit the result (e.g., to 12 artists).
    - Join with the `artists` table to fetch artist details (name, image_url, etc.).
    - Return the enriched list of artists.

## 3. Page Structure (`src/pages/profile.tsx`)

- The existing content will be removed.
- The page will be structured to cleanly display the three new components.
- A possible layout:
    - A main grid container.
    - **Column 1:** `UserProfileCard` and `MvpSurvey`.
    - **Column 2:** `FavoriteArtistsGrid`.
- The page will handle loading states while data is being fetched and will show an authentication block if the user is not signed in.

## 4. Implementation Steps
1.  **Backend Development:** Build the two new API routes.
2.  **Component Development:** Create the three new React components.
3.  **Page Integration:** Re-assemble `src/pages/profile.tsx` with the new components.
