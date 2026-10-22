"use server";

import { prisma } from "@/lib/prisma";
import { getUserTier } from "@/lib/loyalty/tiers";
import { createNotification } from "@/actions/notifications";
import { revalidatePath } from "next/cache";

export async function earnPoints({
  userId,
  amount,
  description,
  type = "EARNED",
  referenceId,
}: {
  userId: string;
  amount: number;
  description: string;
  type?: "EARNED" | "ADJUSTED";
  referenceId?: string;
}) {
  if (amount <= 0) {
    throw new Error("Points to earn must be greater than zero.");
  }

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: {
        pointBalance: { increment: amount },
      },
    });

    const ledger = await tx.pointLedger.create({
      data: {
        userId,
        amount,
        type,
        description,
        referenceId: referenceId || `ACT-${Date.now()}`,
      },
    });

    return { user, ledger };
  });

  // Send real-time notification
  try {
    await createNotification({
      userId,
      title: type === "EARNED" ? "Points Credited" : "Points Balance Adjusted",
      message: `${description} (+${amount.toLocaleString()} pts)`,
      type: "EARN",
      link: "/history",
    });
  } catch (e) {
    // Non-blocking notification
  }

  revalidatePath("/");
  revalidatePath("/history");
  return { success: true, newBalance: result.user.pointBalance, ledger: result.ledger };
}

export async function simulatePurchase({
  userId,
  spendAmount,
  storeName = "Partner Store",
}: {
  userId: string;
  spendAmount: number;
  storeName?: string;
}) {
  // Check user's VIP Tier to apply loyalty earn multiplier
  const userEarnings = await prisma.pointLedger.findMany({
    where: { userId, type: "EARNED" },
    select: { amount: true },
  });
  const lifetimeEarned = userEarnings.reduce((sum, e) => sum + e.amount, 0);
  const tierInfo = getUserTier(lifetimeEarned);

  // Base: $1 = 10 pts, multiplied by VIP tier
  const basePoints = Math.round(spendAmount * 10);
  const totalPoints = Math.round(basePoints * tierInfo.earnMultiplier);

  const multiplierNote =
    tierInfo.earnMultiplier > 1 ? ` (${tierInfo.displayName} ${tierInfo.earnMultiplier}x Multiplier)` : "";

  return earnPoints({
    userId,
    amount: totalPoints,
    description: `Purchase at ${storeName} ($${spendAmount.toFixed(2)})${multiplierNote}`,
    referenceId: `PURCHASE-${Date.now()}`,
  });
}

export async function claimDailyCheckIn(userId: string) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const existingCheckIn = await prisma.pointLedger.findFirst({
    where: {
      userId,
      type: "EARNED",
      description: { startsWith: "Daily Check-in Streak" },
      createdAt: { gte: startOfDay },
    },
  });

  if (existingCheckIn) {
    throw new Error("You have already claimed your daily check-in bonus today! Come back tomorrow.");
  }

  return earnPoints({
    userId,
    amount: 50,
    description: "Daily Check-in Streak Bonus (+50 pts)",
    referenceId: `CHECKIN-${new Date().toISOString().slice(0, 10)}`,
  });
}

export async function claimMilestoneBonus(userId: string, milestoneName: string, points: number) {
  return earnPoints({
    userId,
    amount: points,
    description: `Milestone Unlocked: ${milestoneName}`,
    referenceId: `MILESTONE-${Date.now()}`,
  });
}

export async function claimReferralBonus(userId: string, referralCode: string) {
  if (!referralCode || referralCode.trim().length < 3) {
    throw new Error("Invalid referral code entered.");
  }

  return earnPoints({
    userId,
    amount: 500,
    description: `Referral Program Reward (code: ${referralCode.toUpperCase()})`,
    referenceId: `REF-${Date.now()}`,
  });
}

export async function getUserLoyaltyProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) return null;

  const earnings = await prisma.pointLedger.findMany({
    where: { userId, type: "EARNED" },
    select: { amount: true },
  });

  const lifetimeEarned = earnings.reduce((sum, e) => sum + e.amount, 0);
  const tier = getUserTier(lifetimeEarned);

  return {
    ...user,
    lifetimeEarned,
    tier,
  };
}

export async function getPointLedger(userId: string, limit = 50) {
  return prisma.pointLedger.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
