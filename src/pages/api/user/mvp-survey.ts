
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';
import { createClient } from '@supabase/supabase-js';

// Use admin client for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user from session
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const { responses } = req.body;
    
    // Updated to expect 1 response instead of 3
    if (!responses || !Array.isArray(responses) || responses.length !== 1) {
      return res.status(400).json({ error: 'Invalid survey response - expected exactly 1 response' });
    }

    // Check if user has already completed the MVP survey
    const { data: existingSurvey, error: checkError } = await supabaseAdmin
      .from('user_engagements')
      .select('id')
      .eq('user_id', user.id)
      .eq('engagement_type', 'mvp_survey')
      .limit(1);

    if (checkError) {
      console.error('Error checking existing survey:', checkError);
      return res.status(500).json({ error: 'Database error' });
    }

    if (existingSurvey && existingSurvey.length > 0) {
      return res.status(400).json({ 
        error: 'Survey already completed',
        success: false,
        message: 'You have already completed the MVP survey'
      });
    }

    // Record the survey completion in user_engagements with 25 points
    const { error: insertError } = await supabaseAdmin
      .from('user_engagements')
      .insert({
        user_id: user.id,
        engagement_type: 'mvp_survey',
        points_earned: 25,
        metadata: {
          responses: responses,
          completed_at: new Date().toISOString()
        }
      });

    if (insertError) {
      console.error('Error recording survey:', insertError);
      return res.status(500).json({ error: 'Failed to record survey' });
    }

    // Award 25 points using the increment function
    const { error: pointsError } = await supabaseAdmin
      .rpc('increment_user_points', {
        user_id: user.id,
        points_to_add: 25
      });

    if (pointsError) {
      console.error('Error awarding points:', pointsError);
      // Survey was recorded but points failed - still return success
      return res.status(200).json({
        success: true,
        pointsEarned: 25,
        message: 'Survey completed! Points may take a moment to appear in your profile.'
      });
    }

    return res.status(200).json({
      success: true,
      pointsEarned: 25,
      message: 'Survey completed successfully! You earned 25 points.'
    });

  } catch (error) {
    console.error('MVP Survey API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
