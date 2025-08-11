
# Stripe Integration Plan: TicketCube Pricing Tiers

This document outlines the plan to integrate Stripe for monetizing the TicketCube feature.

## Part 1: Stripe Account &amp; Product Setup (Manual Steps)

1.  **API Keys**:
    *   Log in to the Stripe Dashboard.
    *   Go to `Developers` > `API keys`.
    *   Copy the **Publishable key** and **Secret key**.
    *   Add them to `.env.local`:
        ```
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
        STRIPE_SECRET_KEY=sk_...
        ```

2.  **Create Products**:
    *   Go to the `Products` tab in the Stripe Dashboard.
    *   **Pro Tier ($25)**:
        *   Name: Pro TicketCube
        *   Price: $25.00 (One-time)
        *   Copy the Price API ID (`price_...`).
    *   **Collector's Tier ($50)**:
        *   Name: Collector's TicketCube
        *   Price: $50.00 (One-time)
        *   Copy the Price API ID (`price_...`).

3.  **Webhooks**:
    *   Go to `Developers` > `Webhooks`.
    *   Add an endpoint for `YOUR_DOMAIN/api/stripe/webhook`.
    *   Listen for the `checkout.session.completed` event.
    *   Copy the **Webhook signing secret**.
    *   Add it to `.env.local`:
        ```
        STRIPE_WEBHOOK_SECRET=whsec_...
        ```

## Part 2: Database Schema Updates

The `ticketcubes` table will be updated to track subscriptions and usage.

**SQL Script:**
```sql
ALTER TABLE public.ticketcubes
ADD COLUMN tier TEXT DEFAULT 'free',
ADD COLUMN updates_remaining INTEGER,
ADD COLUMN gifts_remaining INTEGER,
ADD COLUMN stripe_payment_intent_id TEXT;
```

These new columns will store:
*   `tier`: The purchased plan ('free', 'pro', 'collector').
*   `updates_remaining`: Counter for the Pro tier.
*   `gifts_remaining`: Counter for giftable cubes.
*   `stripe_payment_intent_id`: A reference to the Stripe transaction.

## Part 3: Backend API Endpoints

Two new API routes will be created to manage the payment flow.

1.  **`src/pages/api/stripe/checkout-session.ts`**:
    *   Creates a Stripe Checkout session.
    *   Receives `priceId` and `cubeId`.
    *   Passes `cubeId` and `userId` in the session `metadata`.
    *   Redirects the user to the Stripe payment page.

2.  **`src/pages/api/stripe/webhook.ts`**:
    *   Listens for the `checkout.session.completed` event from Stripe.
    *   Verifies the webhook signature for security.
    *   Updates the `ticketcubes` table in Supabase with the correct tier and usage limits based on the completed purchase.

## Part 4: Frontend Implementation

1.  **`src/components/pricing/PricingModal.tsx`**:
    *   A modal UI to display the three pricing tiers.
    *   Handles user selection and initiates the payment process by calling the backend.

2.  **Update `src/pages/ticketcube.tsx`**:
    *   The "Secure Cube" button will now open the `PricingModal`.

3.  **Success/Cancel Pages**:
    *   `src/pages/payment/success.tsx`: Confirmation page after a successful payment.
    *   `src/pages/payment/cancel.tsx`: Page displayed if the user cancels.

4.  **Update Services and Context**:
    *   `ticketCubeService.ts` and `CubeContext.tsx` will be updated to include "feature gating" logic based on the cube's `tier`.
