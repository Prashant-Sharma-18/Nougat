"use server";

import { prisma } from "@/lib/prisma";
import { redeemPointsForCard } from "@/actions/redeem";
import { getUserTier } from "@/lib/loyalty/tiers";
import { SupportedProvider } from "@/lib/giftcards/router";
import { createNotification } from "@/actions/notifications";
import { revalidatePath } from "next/cache";

export interface BulkRecipientItem {
  id: string;
  name: string;
  email: string;
  brandId: string;
  faceValue: number;
  greeting?: string;
}

export async function validateBulkBatch({
  userId,
  recipients,
}: {
  userId: string;
  recipients: BulkRecipientItem[];
}) {
  if (!recipients || recipients.length === 0) {
    throw new Error("Recipient list cannot be empty.");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      transactions: { where: { type: "EARNED" } },
    },
  });

  if (!user) {
    throw new Error("User account not found.");
  }

  const lifetimeEarned = user.transactions.reduce((sum, t) => sum + t.amount, 0);
  const tierInfo = getUserTier(lifetimeEarned);

  // Validate each recipient and calculate total points required
  let totalFaceValue = 0;
  let totalPointsRequired = 0;
  const errors: string[] = [];

  for (let i = 0; i < recipients.length; i++) {
    const r = recipients[i];
    if (!r.name?.trim()) errors.push(`Recipient #${i + 1}: Name is required.`);
    if (!r.email?.trim() || !r.email.includes("@")) errors.push(`Recipient #${i + 1}: Valid email is required.`);
    if (!r.faceValue || r.faceValue <= 0) errors.push(`Recipient #${i + 1}: Card value must be greater than $0.`);
    if (!r.brandId?.trim()) errors.push(`Recipient #${i + 1}: Brand must be selected.`);

    let pts = Math.round(r.faceValue * 100);
    if (tierInfo.discountPercentage > 0) {
      const discount = Math.round((pts * tierInfo.discountPercentage) / 100);
      pts = Math.max(100, pts - discount);
    }
    totalFaceValue += r.faceValue;
    totalPointsRequired += pts;
  }

  const userBalance = user.pointBalance;
  const canAffordAll = userBalance >= totalPointsRequired;
  const shortfallPoints = Math.max(0, totalPointsRequired - userBalance);
  const shortfallCash = shortfallPoints / 100;

  return {
    valid: errors.length === 0,
    errors,
    totalRecipients: recipients.length,
    totalFaceValue,
    totalPointsRequired,
    userBalance,
    canAffordAll,
    shortfallPoints,
    shortfallCash,
    tierDiscountPercentage: tierInfo.discountPercentage,
    tierName: tierInfo.displayName,
  };
}

export async function executeBulkRewards({
  userId,
  recipients,
  preferredProvider = "AUTO_FAILOVER",
  useCorporateCardTopUp = false,
  corporateCardMask,
}: {
  userId: string;
  recipients: BulkRecipientItem[];
  preferredProvider?: SupportedProvider;
  useCorporateCardTopUp?: boolean;
  corporateCardMask?: string;
}) {
  const validation = await validateBulkBatch({ userId, recipients });
  if (!validation.valid) {
    throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
  }

  if (!validation.canAffordAll && !useCorporateCardTopUp) {
    throw new Error(
      `Insufficient points for bulk batch. You need ${validation.totalPointsRequired.toLocaleString()} pts, but have ${validation.userBalance.toLocaleString()} pts.`
    );
  }

  const results: any[] = [];
  let successCount = 0;
  let failureCount = 0;
  let totalPointsSpent = 0;
  let totalCashSpent = 0;

  // Distribute points and cash across orders if corporate card top-up is active
  let remainingUserPoints = validation.userBalance;

  for (const r of recipients) {
    let orderPointsRequired = Math.round(r.faceValue * 100);
    if (validation.tierDiscountPercentage > 0) {
      const discount = Math.round((orderPointsRequired * validation.tierDiscountPercentage) / 100);
      orderPointsRequired = Math.max(100, orderPointsRequired - discount);
    }

    let pointsToUse = Math.min(remainingUserPoints, orderPointsRequired);
    let cashToCharge = 0;
    let useSplit = false;

    if (pointsToUse < orderPointsRequired && useCorporateCardTopUp) {
      cashToCharge = (orderPointsRequired - pointsToUse) / 100;
      useSplit = true;
    }

    try {
      const order = await redeemPointsForCard({
        userId,
        brandId: r.brandId,
        faceValue: r.faceValue,
        preferredProvider,
        isGift: true,
        recipientName: r.name,
        recipientEmail: r.email,
        giftMessage: r.greeting || "Thank you for being a valued team member. Enjoy this corporate reward.",
        useSplitTender: useSplit,
        cashAmount: cashToCharge,
        paymentCardMask: useSplit ? corporateCardMask || "Corp Card (Mastercard •••• 9012)" : undefined,
        skipVelocityCheck: true,
      });

      remainingUserPoints = Math.max(0, remainingUserPoints - pointsToUse);
      totalPointsSpent += pointsToUse;
      totalCashSpent += cashToCharge;
      successCount++;

      results.push({
        status: "SUCCESS",
        recipientName: r.name,
        recipientEmail: r.email,
        brandName: order.brandName,
        faceValue: r.faceValue,
        pointsSpent: pointsToUse,
        cashSpent: cashToCharge,
        orderId: order.orderId,
        claimUrl: order.claimUrl,
        cardCode: order.cardCode,
        cardPin: order.cardPin,
        providerUsed: order.providerUsed,
      });
    } catch (err: any) {
      failureCount++;
      results.push({
        status: "FAILED",
        recipientName: r.name,
        recipientEmail: r.email,
        faceValue: r.faceValue,
        error: err.message,
      });
    }
  }

  // Create notification for bulk batch
  try {
    await createNotification({
      userId,
      title: "Corporate Batch Rewards Fulfilled",
      message: `Completed batch of ${successCount} rewards (${totalPointsSpent.toLocaleString()} pts${totalCashSpent > 0 ? ` + $${totalCashSpent.toFixed(2)} Corp Card` : ""}).`,
      type: "ORDER",
      link: "/orders",
    });
  } catch (e) {
    // Non-blocking
  }

  revalidatePath("/");
  revalidatePath("/wallet");
  revalidatePath("/orders");
  revalidatePath("/history");

  return {
    success: failureCount === 0,
    totalRecipients: recipients.length,
    successCount,
    failureCount,
    totalPointsSpent,
    totalCashSpent,
    results,
  };
}

export async function exportBulkBatchCsvAction(results: any[]): Promise<string> {
  const headers = [
    "Recipient Name",
    "Recipient Email",
    "Brand",
    "Face Value ($)",
    "Status",
    "Points Spent",
    "Cash Spent ($)",
    "Order ID",
    "Card Code",
    "Card PIN",
    "Claim URL",
    "Provider Used",
  ];

  const rows = results.map((r) => [
    `"${r.recipientName}"`,
    `"${r.recipientEmail}"`,
    `"${r.brandName || "N/A"}"`,
    r.faceValue,
    `"${r.status}"`,
    r.pointsSpent || 0,
    r.cashSpent || 0,
    `"${r.orderId || "N/A"}"`,
    `"${r.cardCode || "N/A"}"`,
    `"${r.cardPin || "N/A"}"`,
    `"${r.claimUrl || "N/A"}"`,
    `"${r.providerUsed || "N/A"}"`,
  ]);

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}

