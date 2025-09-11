import { supabase } from '@/integrations/supabase/client';

export interface SurveyResponse {
  question: string;
  answer: string;
}

export interface MvpSurveyResult {
  success: boolean;
  pointsEarned: number;
  message: string;
  error?: string;
}

export const mvpSurveyService = {
  async submitSurvey(responses: SurveyResponse[]): Promise<MvpSurveyResult> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('User not authenticated');
      }

      const response = await fetch('/api/user/mvp-survey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ responses })
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          pointsEarned: 0,
          message: result.error || 'Survey submission failed',
          error: result.error
        };
      }

      return result;
    } catch (error) {
      console.error('Survey submission error:', error);
      return {
        success: false,
        pointsEarned: 0,
        message: 'Failed to submit survey',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  async checkSurveyCompletion(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return false;
      }

      const { data, error } = await supabase
        .from('user_engagements')
        .select('id')
        .eq('user_id', user.id)
        .eq('engagement_type', 'mvp_survey')
        .limit(1);

      if (error) {
        console.error('Error checking survey completion:', error);
        return false;
      }

      return (data && data.length > 0);
    } catch (error) {
      console.error('Error checking survey completion:', error);
      return false;
    }
  }
};