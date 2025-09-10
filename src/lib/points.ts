import { supabaseAdmin } from './supabaseAdmin';

/**
 * Fetches the point value for a specific action from the points_config table.
 * @param actionName The name of the action (e.g., 'video_view', 'quadrant_rating').
 * @returns The number of points for that action.
 * @throws If the action is not found in the points_config table.
 */
export async function fetchPointsForAction(actionName: string): Promise<number> {
  try {
    const { data, error } = await supabaseAdmin
      .from('points_config')
      .select('points_value')
      .eq('action_name', actionName)
      .single();

    if (error || !data) {
      console.error(`Error fetching points for action "${actionName}":`, error);
      throw new Error(`Configuration for action "${actionName}" not found.`);
    }

    return data.points_value || 0;
  } catch (error) {
    console.error(`Failed to fetch points for action: ${actionName}`, error);
    // Re-throw the error to be handled by the calling API route
    throw error;
  }
}
