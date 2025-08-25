
import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin, verifyUserOwnership } from '@/lib/supabaseAdmin';
import { supabase } from '@/integrations/supabase/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { userId, votes, weekIdentifier } = req.body;

    // Verify user owns these votes
    const isOwner = await verifyUserOwnership(user.id, userId);
    if (!isOwner) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if user already voted this week
    const { data: existingVotes } = await supabaseAdmin
      .from('weekly_votes')
      .select('id')
      .eq('user_id', userId)
      .eq('week_identifier', weekIdentifier);

    if (existingVotes && existingVotes.length > 0) {
      return res.status(409).json({ error: 'Already voted this week' });
    }

    // Insert votes with service role
    const voteInserts = votes.map((vote: any) => ({
      ...vote,
      user_id: userId,
      week_identifier: weekIdentifier
    }));

    const { data: newVotes, error } = await supabaseAdmin
      .from('weekly_votes')
      .insert(voteInserts)
      .select();

    if (error) throw error;

    return res.status(200).json({ success: true, votes: newVotes });
    
  } catch (error) {
    console.error('Voting API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
