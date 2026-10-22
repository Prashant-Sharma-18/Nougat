import { prisma } from "@/lib/prisma";

export interface RateLimitCheckResult {
  allowed: boolean;
  reason?: string;
  retryAfterSeconds?: number;
}

const MAX_REDEMPTIONS_PER_10_MINUTES = 5;
const MAX_POINTS_PER_24_HOURS = 25000; // $250 max redemption velocity per day

export async function checkRedemptionVelocity(
  userId: string,
  pointsRequested: number
): Promise<RateLimitCheckResult> {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // 1. Check redemption frequency (max 5 orders per 10 min)
  const recentOrdersCount = await prisma.redemptionOrder.count({
    where: {
      userId,
      createdAt: { gte: tenMinutesAgo },
    },
  });

  if (recentOrdersCount >= MAX_REDEMPTIONS_PER_10_MINUTES) {
    return {
      allowed: false,
      reason: `Velocity limit exceeded: Maximum ${MAX_REDEMPTIONS_PER_10_MINUTES} redemption attempts per 10 minutes. Please wait before redeeming again.`,
      retryAfterSeconds: 300,
    };
  }

  // 2. Check 24-hour total point redemption limit
  const ordersLast24Hours = await prisma.redemptionOrder.findMany({
    where: {
      userId,
      createdAt: { gte: twentyFourHoursAgo },
      status: { in: ["COMPLETED", "PROCESSING"] },
    },
    select: { pointsSpent: true },
  });

  const totalPointsSpentLast24h = ordersLast24Hours.reduce(
    (sum, order) => sum + order.pointsSpent,
    0
  );

  if (totalPointsSpentLast24h + pointsRequested > MAX_POINTS_PER_24_HOURS) {
    const remainingCap = Math.max(0, MAX_POINTS_PER_24_HOURS - totalPointsSpentLast24h);
    return {
      allowed: false,
      reason: `Daily redemption threshold exceeded: Your 24-hour limit is ${MAX_POINTS_PER_24_HOURS} points. You have ${remainingCap} points remaining for today.`,
    };
  }

  return { allowed: true };
}

