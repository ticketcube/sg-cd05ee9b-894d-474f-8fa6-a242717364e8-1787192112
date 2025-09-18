
# Implementing "Sign in with Apple" using Supabase

This document provides a step-by-step guide to configure and implement Apple OAuth in your Next.js application with Supabase.

---

## Part 1: Supabase &amp; Apple Developer Configuration

This is the most involved part. It requires you to have an active Apple Developer Program membership.

### Step 1: Create a Services ID in Apple Developer Portal

This ID will act as the `client_id` for the OAuth flow.

1.  Log in to your [Apple Developer Account](https://developer.apple.com/account).
2.  Navigate to **Certificates, Identifiers &amp; Profiles** > **Identifiers**.
3.  Click the `+` button to register a new identifier.
4.  Select **Services IDs** and click **Continue**.
5.  **Description**: Give it a memorable name (e.g., "OTWChart Sign In").
6.  **Identifier**: Create a reverse-domain style string (e.g., `com.otwchart.signin`). **This is your Client ID.**
7.  Click **Continue** and then **Register**.
8.  Find your newly created Services ID in the list, click on it, and check the box to enable **Sign in with Apple**.
9.  Click the **Configure** button next to "Sign in with Apple".
10. In the "Domains and Subdomains" field, add the domain of your app.
11. In the "Return URLs" field, you must add your Supabase callback URL. You can find this in your Supabase project dashboard under **Authentication** > **Providers** > **Apple**. It will look like this: `https://<your-project-ref>.supabase.co/auth/v1/callback`.

### Step 2: Create a Private Key for Authentication

This key is used to sign communication between Supabase and Apple.

1.  In the Apple Developer portal, navigate to **Certificates, Identifiers &amp; Profiles** > **Keys**.
2.  Click the `+` button to register a new key.
3.  **Key Name**: Give it a name (e.g., "Supabase Apple Auth Key").
4.  Check the box to enable **Sign in with Apple**.
5.  Click the **Configure** button and select the **Primary App ID** associated with your app.
6.  Click **Continue** and then **Register**.
7.  **IMPORTANT**: You will now see an option to **Download** your key. Download the `.p8` file immediately. **You cannot re-download this key later.**


8.  Make a note of the **Key ID**, which is displayed on the same page.
4NSZ4S68UM

### Step 3: Find Your Team ID

Your Team ID is located in the top-right corner of the Apple Developer portal, under your account name.

### Step 4: Configure the Apple Provider in Supabase

1.  Go to your Supabase Project Dashboard.
2.  Navigate to **Authentication** > **Providers**.
3.  Find **Apple** in the list and expand it.
4.  Toggle the **Enable Apple provider** switch.
5.  You will see your Supabase **Callback URL**. Double-check that this is the exact URL you used in Step 1.
6.  **Client ID**: Enter the **Services ID** you created in Step 1 (e.g., `com.otwchart.signin`).
7.  **Team ID**: Enter the Team ID from Step 3.
8.  **Private Key**: Open the `.p8` file you downloaded in Step 2 with a text editor. Copy the entire contents of the file (including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`) and paste it into this field.
9.  Click **Save**.

---

## Part 2: Frontend Code Implementation

Now, let's add the sign-in button to your app. The relevant files appear to be `src/components/AuthDialog.tsx` for the UI and `src/services/authService.ts` for the logic.

### Step 1: Update `authService.ts`

Add a new function to handle the Apple sign-in flow.

**File**: `src/services/authService.ts`

```typescript
// Add this function inside the authService object

async function signInWithApple() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: `${window.location.origin}/discovery-dashboard`,
    },
  });
  if (error) {
    console.error('Error signing in with Apple:', error.message);
    // Optionally, show a toast notification to the user
  }
}
```

### Step 2: Update `AuthDialog.tsx`

Add a new button for "Sign in with Apple" alongside your existing Google button.

**File**: `src/components/AuthDialog.tsx`

```tsx
// 1. Import the new service function
import { authService } from '@/services/authService';

// 2. Add the Apple sign-in button inside your component's return statement,
//    likely near the Google sign-in button. You may need to find an SVG icon for Apple.

<Button
  variant="outline"
  className="w-full flex items-center justify-center gap-2"
  onClick={authService.signInWithApple} // Use the new function here
>
  {/* Replace this with an actual Apple SVG icon if you have one */}
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20.94c1.5 0 2.75 1.06 4 0 1.25-1.06 2.5-2.25 2.5-4.25 0-2-1.25-3.06-2.5-3.06-1.25 0-2.5 1.06-4 0-1.25-1.06-2.5-2.25-2.5-4.25 0-2-1.25-3.06-2.5-3.06-1.25 0-2.5 1.06-4 0-1.25-1.06-2.5-2.25-2.5-4.25 0-2-1.25-3.06-2.5-3.06-1.25 0-2.5 1.06-4 0-1.25-1.06-2.5-2.25-2.5-4.25 0-2 1.25-3.06 2.5-3.06 1.25 0 2.5 1.06 4 0 1.25-1.06 2.5 2.25 2.5 4.25a4.5 4.5 0 0 1-4.5 4.5c-2.22 0-4-1.78-4-4s1.78-4 4-4 4 1.78 4 4-1.78 4-4 4z"/><path d="M12 20.94c1.5 0 2.75 1.06 4 0 1.25-1.06 2.5-2.25 2.5-4.25 0-2-1.25-3.06-2.5-3.06-1.25 0-2.5 1.06-4 0-1.25-1.06-2.5-2.25-2.5-4.25 0-2-1.25-3.06-2.5-3.06-1.25 0-2.5 1.06-4 0-1.25-1.06-2.5-2.25-2.5-4.25 0-2 1.25-3.06 2.5-3.06 1.25 0 2.5 1.06 4 0 1.25-1.06 2.5 2.25 2.5 4.25a4.5 4.5 0 0 1-4.5 4.5c-2.22 0-4-1.78-4-4s1.78-4 4-4 4 1.78 4 4-1.78 4-4 4z"/></svg> 
  Sign in with Apple
</Button>
```

---

Once you have completed these steps, you should be able to see the new "Sign in with Apple" button and use it to authenticate.

Go ahead and follow these steps. Let me know once you've made the changes, and I'll be ready to check your work!
