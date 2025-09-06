export const ENGAGEMENT_TYPES = {
    DAILY_LOGIN: "daily_login",
    VIDEO_VIEW: "video_view",
    VIDEO_COMPLETION_BONUS: "video_completion_bonus",
    WEEKLY_STREAK: "weekly_streak",
    REFERRAL_BONUS: "referral_bonus",
    RATING_COMPLETION_BONUS: "rating_completion_bonus",
    ARTIST_RATING: "artist_rating",
    QUADRANT: "quadrant",
} as const;

export type EngagementType = (typeof ENGAGEMENT_TYPES)[keyof typeof ENGAGEMENT_TYPES];
