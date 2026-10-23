"use server";

import { prisma } from "@/lib/prisma";
import {
  POINT_PACKS,
  createPaymentIntent,
  stripe,
} from "@/lib/payments/stripe";
import { createNotification } from "@/actions/notifications";
import { sendPointPurchaseReceiptEmail } from "@/lib/email/giftcardDelivery";
import { revalidatePath } from "next/cache";

export async function getPointPacks() {
  return POINT_PACKS;
}

export async function initiatePointPackPurchase({
  userId,
  packId,
}: {
  userId: string;
  packId: string;
}) {
  const pack = POINT_PACKS.find((p) => p.id === packId);
  if (!pack) {
    throw new Error(`Point bundle pack '${packId}' not found.`);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User account not found.");
  }

  const idempotencyKey = `topup-${userId}-${packId}-${Date.now()}`;

  const intent = await createPaymentIntent({
    amountInCents: pack.priceInCents,
    currency: "usd",
    userId,
    description: `Purchase ${pack.name} (${pack.totalPoints.toLocaleString()} loyalty points)`,
    orderType: "POINT_BUNDLE",
    packId: pack.id,
    pointsAwarded: pack.totalPoints,
    idempotencyKey,
  });

  return {
    success: true,
    pack,
    clientSecret: intent.clientSecret,
    paymentIntentId: intent.paymentIntentId,
    amountInCents: intent.amountInCents,
    isSimulated: intent.isSimulated,
  };
}

export async function confirmPointPackPayment({
  userId,
  paymentIntentId,
  packId,
}: {
  userId: string;
  paymentIntentId: string;
  packId: string;
}) {
  const pack = POINT_PACKS.find((p) => p.id === packId);
  if (!pack) {
    throw new Error(`Point pack '${packId}' was not recognized.`);
  }

  // If live Stripe is configured and intent is not simulated, retrieve intent status from Stripe
  if (stripe && !paymentIntentId.startsWith("pi_sim_")) {
    const liveIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (liveIntent.status !== "succeeded") {
      throw new Error(
        `Payment has not been completed yet (Current status: ${liveIntent.status}).`
      );
    }
  }

  // Prevent duplicate credit for the same payment intent
  const existingLedger = await prisma.pointLedger.findFirst({
    where: { referenceId: paymentIntentId },
  });

  if (existingLedger) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    return {
      success: true,
      alreadyProcessed: true,
      newBalance: user?.pointBalance || 0,
    };
  }

  // Atomically credit points and create ledger record
  const result = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        pointBalance: { increment: pack.totalPoints },
      },
    });

    const ledger = await tx.pointLedger.create({
      data: {
        userId,
        amount: pack.totalPoints,
        type: "EARNED",
        description: `Purchased ${pack.name}: ${pack.points.toLocaleString()} base + ${pack.bonusPoints.toLocaleString()} bonus pts (${pack.priceFormatted})`,
        referenceId: paymentIntentId,
      },
    });

    return { updatedUser, ledger };
  });

  // Notify user & dispatch receipt email
  try {
    await createNotification({
      userId,
      title: "Point Pack Activated",
      message: `Successfully credited ${pack.totalPoints.toLocaleString()} points via card payment (${pack.priceFormatted}).`,
      type: "EARN",
      link: "/wallet",
    });

    await sendPointPurchaseReceiptEmail({
      customerName: result.updatedUser.name || "Loyalty Member",
      customerEmail: result.updatedUser.email,
      packName: pack.name,
      pointsAdded: pack.totalPoints,
      amountFormatted: pack.priceFormatted,
      paymentIntentId,
      newBalance: result.updatedUser.pointBalance,
    });
  } catch (err) {
    // Non-blocking notification or email failure
  }

  revalidatePath("/");
  revalidatePath("/wallet");
  revalidatePath("/history");

  return {
    success: true,
    newBalance: result.updatedUser.pointBalance,
    pointsAdded: pack.totalPoints,
    ledgerId: result.ledger.id,
  };
}

export async function initiateSplitTenderPayment({
  userId,
  brandId,
  cashAmountInDollars,
  pointsSpent,
}: {
  userId: string;
  brandId: string;
  cashAmountInDollars: number;
  pointsSpent: number;
}) {
  if (cashAmountInDollars <= 0) {
    throw new Error("Cash co-pay amount must be greater than zero.");
  }

  const amountInCents = Math.round(cashAmountInDollars * 100);
  const idempotencyKey = `copay-${userId}-${brandId}-${Date.now()}`;

  const intent = await createPaymentIntent({
    amountInCents,
    currency: "usd",
    userId,
    description: `Split-Tender Co-Pay ($${cashAmountInDollars.toFixed(2)}) for gift card redemption`,
    orderType: "SPLIT_TENDER_COPAY",
    brandId,
    idempotencyKey,
  });

  return {
    success: true,
    clientSecret: intent.clientSecret,
    paymentIntentId: intent.paymentIntentId,
    amountInCents,
    isSimulated: intent.isSimulated,
  };
}

