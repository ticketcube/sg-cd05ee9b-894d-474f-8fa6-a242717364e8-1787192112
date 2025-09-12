
# Google OAuth Debugging Plan

Follow these steps carefully to diagnose and fix the Google OAuth issue. The problem is almost certainly a configuration mismatch in one of these areas.

### **Part 1: Check Your Supabase Configuration**

1.  **Navigate to Supabase Auth Settings:**
    *   Go to your Supabase project dashboard.
    *   Click on the **Authentication** icon in the left sidebar.
    *   Go to the **Providers** section.

2.  **Verify Google Provider is Enabled:**
    *   Find "Google" in the list of providers.
    *   Make sure the toggle switch is **ON**. If it's off, this is your problem.

3.  **Get Your Supabase Callback URL:**
    *   While you're on the Google provider page in Supabase, you will see a field labeled **"Redirect URL (for use in Google credentials)"**.
    *   It will look something like this: `https://<your-project-ref>.supabase.co/auth/v1/callback`.
    *   **COPY THIS URL.** This is the *only* URL that Google should send users back to. You will need it in the next part.

4.  **Check Site URL:**
    *   In the Supabase dashboard, go to **Authentication** -&gt; **Settings**.
    *   Look for the **Site URL**.
    *   For local development, this should be `http://localhost:3000`.
    *   For your live site, it must be your production URL (e.g., `https://www.your-app.com`). An incorrect Site URL can cause redirect issues.

### **Part 2: Check Your Google Cloud Console Configuration**

1.  **Navigate to Google Cloud Console:**
    *   Go to [https://console.cloud.google.com/](https://console.cloud.google.com/).
    *   Make sure you have the correct project selected at the top.
    *   In the search bar, type "APIs &amp; Services" and select it.

2.  **Go to Credentials:**
    *   In the left menu, click on **Credentials**.

3.  **Find Your OAuth 2.0 Client ID:**
    *   You should see your OAuth 2.0 Client ID listed. Click on its name to edit it.

4.  **VERIFY THE REDIRECT URI (Most Likely Cause):**
    *   Look for the section called **"Authorized redirect URIs"**.
    *   There **MUST** be an entry here that **EXACTLY** matches the callback URL you copied from Supabase in Part 1, Step 3.
    *   **Common Mistake:** Do not use `http://localhost:3000/auth/callback`. You must use the Supabase-provided URL: `https://&lt;your-project-ref&gt;.supabase.co/auth/v1/callback`.
    *   If the correct URL is missing, click **"ADD URI"** and paste it in.
    *   **Click SAVE** at the bottom.

5.  **Verify Client ID and Secret:**
    *   On the same screen, you can see your **Client ID** and **Client Secret**.
    *   Go back to your Supabase dashboard (Authentication -&gt; Providers -&gt; Google).
    *   Make sure the Client ID and Client Secret in Supabase **EXACTLY** match what you see in the Google Cloud Console. Copy and paste them again to be sure there are no typos or extra spaces.

### **Summary &amp; Final Check**

-   **Is Google enabled in Supabase?** (Part 1, Step 2)
-   **Is the "Site URL" in Supabase Auth settings correct?** (Part 1, Step 4)
-   **Does the "Authorized redirect URIs" in Google Cloud contain the EXACT callback URL from Supabase?** (Part 2, Step 4)
-   **Do the Client ID and Secret in Supabase match Google Cloud?** (Part 2, Step 5)

If you find and fix a mismatch in any of these steps, your Google OAuth login should start working immediately.
