
export const quadrantRatingService = {
  async hasUserRatedArtist(userId: string, artistId: number): Promise<boolean> {
    try {
      // Use a simple fetch approach to avoid complex Supabase type inference
      const response = await fetch('/api/user/check-rating', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          artistId,
          engagementType: 'quadrant'
        })
      });

      if (!response.ok) {
        console.error('Error checking rating:', response.statusText);
        return false;
      }

      const result = await response.json();
      return result.hasRated || false;
    } catch (error) {
      console.error('Error checking rating:', error);
      return false;
    }
  }
};
