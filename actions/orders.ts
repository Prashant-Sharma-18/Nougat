"use server";

import { prisma } from "@/lib/prisma";
import { decryptSensitiveData } from "@/lib/security/crypto";

export async function getUserOrders(userId: string) {
  return prisma.redemptionOrder.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getOrderById(orderId: string) {
  const order = await prisma.redemptionOrder.findUnique({
    where: { id: orderId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  if (!order) return null;

  return {
    ...order,
    cardCodeEncrypted: decryptSensitiveData(order.cardCodeEncrypted),
    cardPinEncrypted: decryptSensitiveData(order.cardPinEncrypted),
  };
}

export async function getWalletGiftCards(userId: string) {
  const cards = await prisma.redemptionOrder.findMany({
    where: {
      userId,
      status: "COMPLETED",
    },
    orderBy: { createdAt: "desc" },
  });

  return cards.map((card) => ({
    ...card,
    cardCodeEncrypted: decryptSensitiveData(card.cardCodeEncrypted),
    cardPinEncrypted: decryptSensitiveData(card.cardPinEncrypted),
  }));
}

export async function getUserStats(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { pointBalance: true },
  });

  const orders = await prisma.redemptionOrder.findMany({
    where: { userId },
  });

  const completedOrders = orders.filter((o) => o.status === "COMPLETED");
  const totalValueRedeemed = completedOrders.reduce((sum, o) => sum + o.faceValue, 0);
  const totalPointsRedeemed = completedOrders.reduce((sum, o) => sum + o.pointsSpent, 0);

  const earnings = await prisma.pointLedger.findMany({
    where: {
      userId,
      type: "EARNED",
    },
  });
  const totalPointsEarned = earnings.reduce((sum, e) => sum + e.amount, 0);

  return {
    pointBalance: user?.pointBalance || 0,
    totalOrdersCount: orders.length,
    completedCardsCount: completedOrders.length,
    totalValueRedeemed,
    totalPointsRedeemed,
    totalPointsEarned,
  };
}
