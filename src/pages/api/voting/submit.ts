
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { votes } = req.body;

  if (!votes || !Array.isArray(votes)) {
    return res.status(400).json({ error: 'Invalid votes data' });
  }

  try {
    // Get the current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Insert the votes one by one to avoid complex type issues
    const insertPromises = votes.map(async (vote: { auth_id: string; artist_uuid: string }) => {
      const { error } = await supabase
        .from('top25_votes')
        .insert([{
          user_id: vote.auth_id,
          artist_uuid: vote.artist_uuid
        }]);
      
      if (error) throw error;
    });

    await Promise.all(insertPromises);

    return res.status(200).json({ success: true, message: `${votes.length} votes submitted successfully` });
  } catch (error) {
    console.error('Error submitting votes:', error);
    return res.status(500).json({ error: 'Failed to submit votes' });
  }
}