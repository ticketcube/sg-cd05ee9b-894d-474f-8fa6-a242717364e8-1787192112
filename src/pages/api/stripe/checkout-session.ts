
import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from "stripe";
import { supabase } from '@/integrations/supabase/client';


// Initialize Stripe with the secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // Use library default version
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const { priceId, cubeId, userId } = req.body;

  if (!priceId || !cubeId || !userId) {
    return res.status(400).json({ error: 'Missing required parameters: priceId, cubeId, and userId are required.' });
  }

  try {
    const { data: cubeData, error: cubeError } = await supabase
      .from('ticketcubes')
      .select('id, user_id')
      .eq('id', cubeId)
      .eq('user_id', userId)
      .single();

    if (cubeError || !cubeData) {
        console.error('Cube not found or user mismatch:', cubeError);
        return res.status(404).json({ error: 'Cube not found or you do not have permission to access it.' });
    }

    const domain = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Create a Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${domain}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${domain}/payment/cancel`,
      // Add metadata to link the session to our internal user and cube
      metadata: {
        cube_id: cubeId,
        user_id: userId,
      },
    });

    if (!session.url) {
        return res.status(500).json({ error: 'Could not create Stripe session.' });
    }

    // Return the session URL to redirect the user
    return res.status(200).json({ sessionId: session.id, url: session.url });

  } catch (error) {
    console.error('Stripe API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: errorMessage });
  }
}