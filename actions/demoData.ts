"use server";

import { prisma } from "@/lib/prisma";
import { encryptSensitiveData } from "@/lib/security/crypto";
import { revalidatePath } from "next/cache";

export async function populateSampleData() {
  const user = await prisma.user.findFirst({
    where: { email: "alex.demo@loyaltyrewards.io" },
  });

  if (!user) {
    throw new Error("Demo user account not found.");
  }

  // 1. Add realistic purchase earnings
  const sampleEarnings = [
    { spend: 120, store: "Apple Flagship Store", pts: 1200, daysAgo: 10 },
    { spend: 85, store: "Whole Foods Market", pts: 850, daysAgo: 8 },
    { spend: 210, store: "Nordstrom Fashion", pts: 2100, daysAgo: 5 },
    { spend: 45, store: "Starbucks Roastery", pts: 450, daysAgo: 2 },
  ];

  for (const earn of sampleEarnings) {
    await prisma.pointLedger.create({
      data: {
        userId: user.id,
        amount: earn.pts,
        type: "EARNED",
        description: `Purchase at ${earn.store} ($${earn.spend.toFixed(2)})`,
        referenceId: `PURCHASE-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        createdAt: new Date(Date.now() - earn.daysAgo * 86400000),
      },
    });
  }

  // 2. Add realistic completed gift card orders
  const sampleCards = [
    {
      brandId: "prod_amazon_us",
      brandName: "Amazon.com Gift Card",
      faceValue: 25,
      pointsSpent: 2500,
      code: "AMZN-8832-1923-4012",
      pin: "4421",
      daysAgo: 7,
      claimUrl: "https://testflight.tremendous.com/rewards/p/amzsample",
      remaining: 25,
    },
    {
      brandId: "prod_starbucks_us",
      brandName: "Starbucks Card",
      faceValue: 15,
      pointsSpent: 1500,
      code: "SBUX-9012-3841-8841",
      pin: "9912",
      recipientName: "Sophia Clark",
      recipientEmail: "sophia@example.com",
      giftMessage: "Happy Birthday Sophia! Enjoy your morning coffee on me.",
      daysAgo: 4,
      claimUrl: "https://testflight.tremendous.com/rewards/p/sbuxsample",
      remaining: 7.5, // Partially spent at POS
    },
    {
      brandId: "prod_apple_us",
      brandName: "Apple Gift Card",
      faceValue: 50,
      pointsSpent: 5000,
      code: "APPL-4412-8821-9014",
      pin: "1234",
      daysAgo: 2,
      claimUrl: "https://testflight.tremendous.com/rewards/p/applsample",
      remaining: 50,
    },
    {
      brandId: "prod_target_us",
      brandName: "Target eGiftCard",
      faceValue: 25,
      pointsSpent: 2500,
      code: "TGT-1249-8832-0012",
      pin: "8821",
      daysAgo: 1,
      claimUrl: "https://testflight.tremendous.com/rewards/p/tgtsample",
      remaining: 25,
    },
  ];

  for (const card of sampleCards) {
    const orderId = `ORD-DEMO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    await prisma.redemptionOrder.create({
      data: {
        userId: user.id,
        brandId: card.brandId,
        brandName: card.brandName,
        faceValue: card.faceValue,
        remainingCardBalance: card.remaining,
        pointsSpent: card.pointsSpent,
        status: "COMPLETED",
        providerOrderId: `TRM-${orderId}`,
        claimUrl: card.claimUrl,
        cardCodeEncrypted: encryptSensitiveData(card.code),
        cardPinEncrypted: encryptSensitiveData(card.pin),
        recipientName: card.recipientName || null,
        recipientEmail: card.recipientEmail || null,
        giftMessage: card.giftMessage || null,
        createdAt: new Date(Date.now() - card.daysAgo * 86400000),
      },
    });

    await prisma.pointLedger.create({
      data: {
        userId: user.id,
        amount: -card.pointsSpent,
        type: "REDEEMED",
        description: `Redeemed ${card.brandName} $${card.faceValue} Gift Card${
          card.recipientName ? ` (Gifted to ${card.recipientName})` : ""
        }`,
        referenceId: orderId,
        createdAt: new Date(Date.now() - card.daysAgo * 86400000),
      },
    });
  }

  // Calculate new net balance
  const allLedgers = await prisma.pointLedger.findMany({
    where: { userId: user.id },
  });
  const netBalance = allLedgers.reduce((sum, l) => sum + l.amount, 0);

  await prisma.user.update({
    where: { id: user.id },
    data: { pointBalance: Math.max(0, netBalance) },
  });

  revalidatePath("/");
  revalidatePath("/wallet");
  revalidatePath("/history");
  revalidatePath("/orders");
  revalidatePath("/admin");
  revalidatePath("/scanner");

  return { success: true, count: sampleCards.length };
}

export async function resetDemoData() {
  const user = await prisma.user.findFirst({
    where: { email: "alex.demo@loyaltyrewards.io" },
  });

  if (!user) {
    throw new Error("Demo user not found");
  }

  // Delete all orders & point ledgers for demo user
  await prisma.redemptionOrder.deleteMany({
    where: { userId: user.id },
  });

  await prisma.pointLedger.deleteMany({
    where: { userId: user.id },
  });

  await prisma.notification.deleteMany({
    where: { userId: user.id },
  });

  // Reset to initial 7,500 points
  await prisma.user.update({
    where: { id: user.id },
    data: { pointBalance: 7500 },
  });

  await prisma.pointLedger.create({
    data: {
      userId: user.id,
      amount: 7500,
      type: "EARNED",
      description: "Welcome Loyalty Sign-up Bonus & Milestone",
      referenceId: "WELCOME-RESET",
    },
  });

  await prisma.notification.create({
    data: {
      userId: user.id,
      title: "Welcome to NougatRewards",
      message: "You've been credited 7,500 points. Try redeeming rewards or testing Split-Tender checkout!",
      type: "REWARD",
      link: "/",
    },
  });

  revalidatePath("/");
  revalidatePath("/wallet");
  revalidatePath("/history");
  revalidatePath("/orders");
  revalidatePath("/admin");
  revalidatePath("/scanner");

  return { success: true };
}

