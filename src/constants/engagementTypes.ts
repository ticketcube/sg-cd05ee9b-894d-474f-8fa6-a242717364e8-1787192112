// constants/engagementTypes.ts
export const ENGAGEMENT_TYPES = {
  VOTE: "vote",
  SHARE: "share",
  STREAM: "stream",
  // ...add more as needed
} as const;

export type EngagementType = typeof ENGAGEMENT_TYPES[keyof typeof ENGAGEMENT_TYPES];
