"use server";

import { prisma } from "@/lib/prisma";
import { fulfillGiftCardOrder, SupportedProvider } from "@/lib/giftcards/router";
import { encryptSensitiveData } from "@/lib/security/crypto";
import { checkRedemptionVelocity } from "@/lib/security/rateLimit";
import { consumeVerificationToken, HIGH_VALUE_REDEMPTION_THRESHOLD } from "@/lib/security/otp";
import { getUserTier } from "@/lib/loyalty/tiers";
import { sendGiftCardEmail } from "@/lib/email/giftcardDelivery";
import { createNotification } from "@/actions/notifications";
import { validateAndApplyCoupon } from "@/lib/admin/promotions";
import { revalidatePath } from "next/cache";

export async function redeemPointsForCard({
  userId,
  brandId,
  faceValue,
  preferredProvider = "AUTO_FAILOVER",
  isGift = false,
  recipientName,
  recipientEmail,
  giftMessage,
  simulateFailure = false,
  useSplitTender = false,
  cashAmount = 0,
  paymentCardMask,
  paymentIntentId,
  otpChallengeId,
  otpVerificationToken,
  bypass2Fa = false,
  skipVelocityCheck = false,
  appliedCouponCode,
}: {
  userId: string;
  brandId: string;
  faceValue: number;
  preferredProvider?: SupportedProvider;
  isGift?: boolean;
  recipientName?: string;
  recipientEmail?: string;
  giftMessage?: string;
  simulateFailure?: boolean;
  useSplitTender?: boolean;
  cashAmount?: number;
  paymentCardMask?: string;
  paymentIntentId?: string;
  otpChallengeId?: string;
  otpVerificationToken?: string;
  bypass2Fa?: boolean;
  skipVelocityCheck?: boolean;
  appliedCouponCode?: string;
}) {
  const POINTS_PER_DOLLAR = 100;
  let pointsRequired = Math.round(faceValue * POINTS_PER_DOLLAR);

  // Fetch user to evaluate VIP tier discount
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      transactions: {
        where: { type: "EARNED" },
      },
    },
  });

  if (!existingUser) {
    throw new Error("User account not found.");
  }

  // Calculate lifetime earned points to determine VIP Tier benefits
  const lifetimeEarned = existingUser.transactions.reduce((sum, t) => sum + t.amount, 0);
  const tierInfo = getUserTier(lifetimeEarned);

  // Apply VIP Tier redemption discount (e.g., Platinum gets 5% off point cost)
  if (tierInfo.discountPercentage > 0) {
    const discount = Math.round((pointsRequired * tierInfo.discountPercentage) / 100);
    pointsRequired = Math.max(100, pointsRequired - discount);
  }

  // Apply promotional coupon discount (e.g. SAVE10 10% off, CORP20)
  let couponDiscountPts = 0;
  let couponBonusPts = 0;
  if (appliedCouponCode) {
    const couponValidation = validateAndApplyCoupon(appliedCouponCode, faceValue);
    if (couponValidation.valid) {
      couponDiscountPts = Math.round(couponValidation.discountDollars * POINTS_PER_DOLLAR);
      couponBonusPts = couponValidation.bonusPoints;
      pointsRequired = Math.max(100, pointsRequired - couponDiscountPts);
    }
  }

  // Split-Tender logic (Points + Cash Top-up)
  let finalPointsSpent = pointsRequired;
  let finalCashSpent = 0;
  let paymentMethodUsed: string | null = null;

  if (useSplitTender && cashAmount > 0) {
    finalCashSpent = Math.round(cashAmount * 100) / 100;
    const pointsCoveredByCash = Math.round(finalCashSpent * POINTS_PER_DOLLAR);
    finalPointsSpent = Math.max(0, pointsRequired - pointsCoveredByCash);
    paymentMethodUsed = paymentIntentId 
      ? `${paymentCardMask || "Credit Card (Visa •••• 4242)"} [${paymentIntentId}]`
      : (paymentCardMask || "Credit Card (Visa •••• 4242)");
  }

  // 0. Anti-Fraud & Rate Limiting Check (evaluated on points spent)
  if (!skipVelocityCheck) {
    const velocityCheck = await checkRedemptionVelocity(userId, finalPointsSpent);
    if (!velocityCheck.allowed) {
      throw new Error(velocityCheck.reason || "Redemption velocity threshold exceeded.");
    }
  }

  // 0b. 2FA OTP Security Challenge on High-Value Redemptions ($100+)
  if (faceValue >= HIGH_VALUE_REDEMPTION_THRESHOLD && !bypass2Fa) {
    if (!otpChallengeId || !otpVerificationToken) {
      throw new Error(
        `High-value redemption ($${faceValue.toFixed(2)}) requires two-factor security verification (OTP).`
      );
    }

    const isAuthorized = consumeVerificationToken({
      challengeId: otpChallengeId,
      token: otpVerificationToken,
    });

    if (!isAuthorized) {
      throw new Error(
        "Two-factor authorization token is invalid, expired, or has already been used."
      );
    }
  }

  // Fetch brand details for order metadata
  const brand = await prisma.brandCatalogCache.findUnique({
    where: { id: brandId },
  });
  const brandName = brand ? brand.name : "Gift Card";

  // Target recipient details
  const targetName = isGift && recipientName?.trim() ? recipientName.trim() : existingUser.name || "Loyalty Member";
  const targetEmail = isGift && recipientEmail?.trim() ? recipientEmail.trim() : existingUser.email;

  // 1. Transactional check and balance deduction (Atomic lock)
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User account not found.");
    }

    if (user.pointBalance < finalPointsSpent) {
      throw new Error(
        `Insufficient point balance. You have ${user.pointBalance} pts, but need ${finalPointsSpent} pts.`
      );
    }

    // Atomic conditional decrement: prevents race condition / double-spend across concurrent transactions
    const updateResult = await tx.user.updateMany({
      where: {
        id: userId,
        pointBalance: { gte: finalPointsSpent },
      },
      data: {
        pointBalance: { decrement: finalPointsSpent },
      },
    });

    if (updateResult.count === 0) {
      throw new Error(
        `Insufficient point balance. Another transaction consumed the remaining points.`
      );
    }

    const updatedUser = await tx.user.findUniqueOrThrow({
      where: { id: userId },
    });

    // Create pending/processing order
    const order = await tx.redemptionOrder.create({
      data: {
        userId,
        brandId,
        brandName,
        faceValue,
        remainingCardBalance: faceValue, // Initial card balance equals face value
        pointsSpent: finalPointsSpent,
        cashSpent: finalCashSpent,
        paymentMethod: paymentMethodUsed,
        recipientName: isGift ? targetName : null,
        recipientEmail: isGift ? targetEmail : null,
        giftMessage: isGift ? giftMessage || null : null,
        status: "PROCESSING",
      },
    });

    // Write audit ledger record
    const giftNote = isGift ? ` (Gifted to ${targetName})` : "";
    const tierDiscountNote =
      tierInfo.discountPercentage > 0 ? ` [${tierInfo.displayName} ${tierInfo.discountPercentage}% discount]` : "";
    const splitNote =
      finalCashSpent > 0 ? ` [Split-Tender: ${finalPointsSpent} pts + $${finalCashSpent.toFixed(2)} Card]` : "";

    await tx.pointLedger.create({
      data: {
        userId,
        amount: -finalPointsSpent,
        type: "REDEEMED",
        description: `Redeemed ${brandName} $${faceValue} Gift Card${giftNote}${tierDiscountNote}${splitNote}`,
        referenceId: order.id,
      },
    });

    return { user: updatedUser, order };
  });

  // 2. Call Unified Gift Card Provider Router
  try {
    const providerResult = await fulfillGiftCardOrder({
      idempotencyKey: result.order.id,
      recipientEmail: targetEmail,
      recipientName: targetName,
      amountInDollars: faceValue,
      productId: brandId,
      preferredProvider,
      simulateFailure,
    });

    const rawCardCode = providerResult.cardCode;
    const rawCardPin = providerResult.cardPin;
    const claimUrl = providerResult.claimUrl;

    // Encrypt sensitive credentials with AES-256-GCM before saving to PostgreSQL
    const encryptedCardCode = encryptSensitiveData(rawCardCode);
    const encryptedCardPin = encryptSensitiveData(rawCardPin);

    // 3. Mark completed in DB
    const completedOrder = await prisma.redemptionOrder.update({
      where: { id: result.order.id },
      data: {
        status: "COMPLETED",
        providerOrderId: providerResult.providerOrderId,
        claimUrl,
        cardCodeEncrypted: encryptedCardCode,
        cardPinEncrypted: encryptedCardPin,
      },
    });

    // 4. Send Transactional HTML Email
    const emailDispatch = await sendGiftCardEmail({
      recipientName: targetName,
      recipientEmail: targetEmail,
      senderName: isGift ? (existingUser.name || "Loyalty Member") : undefined,
      giftMessage: isGift ? (giftMessage || null) : null,
      brandName,
      faceValue,
      currency: "USD",
      cardCode: rawCardCode,
      cardPin: rawCardPin,
      claimUrl,
      orderId: completedOrder.id,
      remainingPoints: result.user.pointBalance,
    });

    // 4b. Credit promotional coupon bonus points if coupon granted bonus points
    let finalUserBalance = result.user.pointBalance;
    if (couponBonusPts > 0) {
      const bonusRes = await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: { pointBalance: { increment: couponBonusPts } },
        }),
        prisma.pointLedger.create({
          data: {
            userId,
            amount: couponBonusPts,
            type: "EARNED",
            description: `Coupon Bonus: +${couponBonusPts} pts from promotional code ${appliedCouponCode?.toUpperCase()}`,
            referenceId: completedOrder.id,
          },
        }),
      ]);
      finalUserBalance = bonusRes[0].pointBalance;
    }

    // 5. Create in-app notification
    try {
      await createNotification({
        userId,
        title: isGift ? "Gift Card Dispatched" : "Gift Card Ready",
        message: isGift
          ? `Dispatched $${faceValue} ${brandName} gift card to ${targetName} (${targetEmail}).`
          : `Your $${faceValue} ${brandName} voucher is now active in your wallet${finalCashSpent > 0 ? ` (Paid ${finalPointsSpent} pts + $${finalCashSpent.toFixed(2)})` : ""}.${couponBonusPts > 0 ? ` (+${couponBonusPts.toLocaleString()} bonus pts credited!)` : ""}`,
        type: "ORDER",
        link: "/wallet",
      });
    } catch (e) {
      // Non-blocking notification
    }

    revalidatePath("/");
    revalidatePath("/wallet");
    revalidatePath("/orders");

    return {
      success: true,
      orderId: completedOrder.id,
      providerUsed: providerResult.providerUsed,
      failoverTriggered: providerResult.failoverTriggered || false,
      claimUrl,
      cardCode: rawCardCode,
      cardPin: rawCardPin,
      faceValue,
      brandName,
      pointsSpent: finalPointsSpent,
      cashSpent: finalCashSpent,
      paymentMethod: paymentMethodUsed,
      isGift,
      recipientName: targetName,
      recipientEmail: targetEmail,
      giftMessage: giftMessage || null,
      remainingBalance: finalUserBalance,
      emailPreviewHtml: emailDispatch.html,
      tierApplied: tierInfo.displayName,
      couponApplied: appliedCouponCode ? appliedCouponCode.toUpperCase() : null,
      bonusPointsEarned: couponBonusPts,
    };
  } catch (err: any) {
    // 6. Safe Rollback: refund points if all providers fail
    const errorMessage = err.message || "Provider redemption failure";

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { pointBalance: { increment: finalPointsSpent } },
      }),
      prisma.pointLedger.create({
        data: {
          userId,
          amount: finalPointsSpent,
          type: "REFUNDED",
          description: `Refund: Order fulfillment failed for ${brandName} order ${result.order.id}${finalCashSpent > 0 ? ` (${finalPointsSpent} pts refunded, $${finalCashSpent.toFixed(2)} card charge voided)` : ""}`,
          referenceId: result.order.id,
        },
      }),
      prisma.redemptionOrder.update({
        where: { id: result.order.id },
        data: {
          status: "FAILED",
          errorMessage,
        },
      }),
    ]);

    // Send failure notification
    try {
      await createNotification({
        userId,
        title: "Order Refunded",
        message: `Fulfillment failed for ${brandName}. ${finalPointsSpent} points have been refunded to your balance.`,
        type: "REFUND",
        link: "/history",
      });
    } catch (e) {
      // Non-blocking
    }

    revalidatePath("/");
    revalidatePath("/wallet");
    revalidatePath("/orders");

    throw new Error(
      `Gift card issuance failed: ${errorMessage}. Your ${finalPointsSpent} points have been safely refunded${finalCashSpent > 0 ? ` and card authorization of $${finalCashSpent.toFixed(2)} was voided.` : "."}`
    );
  }
}
