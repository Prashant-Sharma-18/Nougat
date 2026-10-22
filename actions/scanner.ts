"use server";

import { prisma } from "@/lib/prisma";
import { decryptSensitiveData } from "@/lib/security/crypto";
import { revalidatePath } from "next/cache";

export async function lookupVoucher(cardNumber: string, cardPin?: string) {
  if (!cardNumber || cardNumber.trim() === "") {
    throw new Error("Please enter a valid gift card number.");
  }

  const cleanInputNumber = cardNumber.trim();
  const cleanInputPin = cardPin?.trim();

  // Find all completed orders and match decrypted voucher number
  const orders = await prisma.redemptionOrder.findMany({
    where: { status: "COMPLETED" },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  const matchingOrder = orders.find((order) => {
    const decryptedCode = decryptSensitiveData(order.cardCodeEncrypted);
    const decryptedPin = decryptSensitiveData(order.cardPinEncrypted);

    const codeMatches = decryptedCode?.toLowerCase() === cleanInputNumber.toLowerCase();
    const pinMatches = !cleanInputPin || decryptedPin === cleanInputPin;

    return codeMatches && pinMatches;
  });

  if (!matchingOrder) {
    throw new Error("Gift card not found or invalid security PIN.");
  }

  const remaining =
    matchingOrder.remainingCardBalance !== null && matchingOrder.remainingCardBalance !== undefined
      ? matchingOrder.remainingCardBalance
      : matchingOrder.faceValue;

  return {
    orderId: matchingOrder.id,
    brandName: matchingOrder.brandName,
    faceValue: matchingOrder.faceValue,
    remainingBalance: remaining,
    currency: matchingOrder.currency,
    recipientName: matchingOrder.recipientName || matchingOrder.user?.name || "Loyalty Member",
    status: remaining > 0 ? "ACTIVE" : "DEPLETED",
    createdAt: matchingOrder.createdAt,
  };
}

export async function processPosCharge(orderId: string, chargeAmount: number) {
  if (chargeAmount <= 0) {
    throw new Error("Charge amount must be greater than zero.");
  }

  const order = await prisma.redemptionOrder.findUnique({
    where: { id: orderId },
  });

  if (!order || order.status !== "COMPLETED") {
    throw new Error("Gift card order is invalid or inactive.");
  }

  const currentBalance =
    order.remainingCardBalance !== null && order.remainingCardBalance !== undefined
      ? order.remainingCardBalance
      : order.faceValue;

  if (chargeAmount > currentBalance) {
    throw new Error(
      `Declined: Insufficient card balance. Card balance is $${currentBalance.toFixed(2)}, attempted charge is $${chargeAmount.toFixed(2)}.`
    );
  }

  const newBalance = Math.round((currentBalance - chargeAmount) * 100) / 100;
  const approvalCode = `AUTH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  await prisma.redemptionOrder.update({
    where: { id: orderId },
    data: {
      remainingCardBalance: newBalance,
    },
  });

  revalidatePath("/wallet");
  revalidatePath("/scanner");

  return {
    success: true,
    approvalCode,
    chargedAmount: chargeAmount,
    previousBalance: currentBalance,
    newBalance,
    timestamp: new Date().toISOString(),
    brandName: order.brandName,
    currency: order.currency,
  };
}

export async function getRecentActiveCardsForScanner() {
  const orders = await prisma.redemptionOrder.findMany({
    where: { status: "COMPLETED" },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  return orders.map((o) => ({
    id: o.id,
    brandName: o.brandName,
    faceValue: o.faceValue,
    remainingBalance: o.remainingCardBalance ?? o.faceValue,
    cardCode: decryptSensitiveData(o.cardCodeEncrypted),
    cardPin: decryptSensitiveData(o.cardPinEncrypted),
    recipientName: o.recipientName || "Member",
  }));
}

