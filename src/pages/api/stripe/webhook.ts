
import { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';
import Stripe from 'stripe';
import { supabase } from '@/integrations/supabase/client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Disable the default body parser for this route to verify the raw body
export const config = {
  api: {
    bodyParser: false,
  },
};

const PRO_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID;
const COLLECTOR_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_COLLECTOR_PRICE_ID;

async function updateCubeTier(cubeId: string, userId: string, priceId: string, paymentIntentId: string) {
    const updates: any = {
        is_secured: true,
        stripe_payment_intent_id: paymentIntentId,
        updated_at: new Date().toISOString(),
    };

    if (priceId === PRO_PRICE_ID) {
        updates.tier = 'pro';
        updates.updates_remaining = 3;
        updates.gifts_remaining = 1;
    } else if (priceId === COLLECTOR_PRICE_ID) {
        updates.tier = 'collector';
        updates.updates_remaining = 9999; // Represents "unlimited"
        updates.gifts_remaining = 5;
    } else {
        // Handle free tier or other cases if necessary
        updates.tier = 'free';
    }

    const { error } = await supabase
        .from('ticketcubes')
        .update(updates)
        .eq('id', cubeId)
        .eq('user_id', userId);

    if (error) {
        console.error(`Failed to update cube ${cubeId} to tier ${updates.tier}:`, error);
        throw new Error(`Database update failed for cube ${cubeId}.`);
    }

    console.log(`Successfully updated cube ${cubeId} for user ${userId} to tier ${updates.tier}.`);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  if (!sig || !webhookSecret) {
    return res.status(400).send('Webhook signature is missing.');
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Webhook signature verification failed: ${errorMessage}`);
    return res.status(400).send(`Webhook Error: ${errorMessage}`);
  }
  
  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // Extract metadata and payment details
    const { cube_id, user_id } = session.metadata || {};
    const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;
    const priceId = session.line_items?.data[0]?.price?.id;

    if (!cube_id || !user_id || !paymentIntentId || !priceId) {
      console.error('Webhook received checkout.session.completed with missing metadata.', { metadata: session.metadata });
      return res.status(400).json({ error: 'Required metadata or payment info is missing.' });
    }

    try {
      // Update the database with the new tier information
      await updateCubeTier(cube_id, user_id, priceId, paymentIntentId);
      console.log('Database updated successfully for cube:', cube_id);
    } catch (error) {
      console.error('Webhook handler failed to update database:', error);
      // Respond with a 500 error to signal Stripe to retry the webhook
      return res.status(500).json({ error: 'Failed to process webhook and update database.' });
    }
  }

  res.status(200).json({ received: true });
}
