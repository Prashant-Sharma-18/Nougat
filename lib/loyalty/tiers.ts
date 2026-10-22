export type TierName = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";

export interface UserTierInfo {
  tier: TierName;
  displayName: string;
  badgeColor: string;
  earnMultiplier: number;
  discountPercentage: number;
  minPoints: number;
  maxPoints: number | null;
  progressPercentage: number;
  pointsToNextTier: number;
  nextTierName: TierName | null;
  perks: string[];
}

export function getUserTier(lifetimePoints: number): UserTierInfo {
  if (lifetimePoints >= 30000) {
    return {
      tier: "PLATINUM",
      displayName: "Platinum VIP",
      badgeColor: "bg-zinc-950 text-zinc-100 border-zinc-800",
      earnMultiplier: 1.5,
      discountPercentage: 5, // 5% discount on redemptions
      minPoints: 30000,
      maxPoints: null,
      progressPercentage: 100,
      pointsToNextTier: 0,
      nextTierName: null,
      perks: ["1.5x Purchase Points (15 pts/$)", "5% Redemption Discount", "Priority Fulfillment", "Exclusive Brands"],
    };
  }

  if (lifetimePoints >= 15000) {
    const progress = Math.min(100, Math.round(((lifetimePoints - 15000) / 15000) * 100));
    return {
      tier: "GOLD",
      displayName: "Gold VIP",
      badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
      earnMultiplier: 1.25,
      discountPercentage: 2,
      minPoints: 15000,
      maxPoints: 30000,
      progressPercentage: progress,
      pointsToNextTier: 30000 - lifetimePoints,
      nextTierName: "PLATINUM",
      perks: ["1.25x Purchase Points (12.5 pts/$)", "2% Redemption Discount", "Milestone Multipliers"],
    };
  }

  if (lifetimePoints >= 5000) {
    const progress = Math.min(100, Math.round(((lifetimePoints - 5000) / 10000) * 100));
    return {
      tier: "SILVER",
      displayName: "Silver Member",
      badgeColor: "bg-zinc-100 text-zinc-800 border-zinc-300",
      earnMultiplier: 1.1,
      discountPercentage: 0,
      minPoints: 5000,
      maxPoints: 15000,
      progressPercentage: progress,
      pointsToNextTier: 15000 - lifetimePoints,
      nextTierName: "GOLD",
      perks: ["1.1x Purchase Points (11 pts/$)", "Accelerated Daily Streaks"],
    };
  }

  // Bronze Tier
  const progress = Math.min(100, Math.round((lifetimePoints / 5000) * 100));
  return {
    tier: "BRONZE",
    displayName: "Bronze Member",
    badgeColor: "bg-zinc-50 text-zinc-700 border-zinc-200",
    earnMultiplier: 1.0,
    discountPercentage: 0,
    minPoints: 0,
    maxPoints: 5000,
    progressPercentage: progress,
    pointsToNextTier: 5000 - lifetimePoints,
    nextTierName: "SILVER",
    perks: ["Standard Earning Rate (10 pts/$)", "Instant Digital Delivery"],
  };
}

