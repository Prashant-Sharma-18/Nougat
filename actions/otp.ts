"use server";

import { prisma } from "@/lib/prisma";
import {
  createOtpChallenge,
  verifyOtpCode,
  HIGH_VALUE_REDEMPTION_THRESHOLD,
  HIGH_VALUE_BULK_THRESHOLD,
} from "@/lib/security/otp";

export async function checkRequires2Fa({
  faceValue,
  isBulk = false,
  totalAmount = 0,
}: {
  faceValue?: number;
  isBulk?: boolean;
  totalAmount?: number;
}) {
  if (isBulk) {
    return (totalAmount || 0) >= HIGH_VALUE_BULK_THRESHOLD;
  }
  return (faceValue || 0) >= HIGH_VALUE_REDEMPTION_THRESHOLD;
}

export async function requestRedemptionOtp({
  userId,
  faceValue,
  brandName,
}: {
  userId: string;
  faceValue: number;
  brandName: string;
}) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User account not found.");
  }

  const challenge = await createOtpChallenge({
    userId,
    email: user.email,
    purpose: "HIGH_VALUE_REDEMPTION",
    context: {
      faceValue,
      brandName,
    },
  });

  return {
    success: true,
    challengeId: challenge.challengeId,
    expiresAt: challenge.expiresAt,
    maskedEmail: challenge.maskedEmail,
    previewCode: challenge.previewCode, // For demo & sandbox testing
  };
}

export async function requestBulkBatchOtp({
  userId,
  totalAmount,
  recipientCount,
}: {
  userId: string;
  totalAmount: number;
  recipientCount: number;
}) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User account not found.");
  }

  const challenge = await createOtpChallenge({
    userId,
    email: user.email,
    purpose: "BULK_REWARDS_BATCH",
    context: {
      totalAmount,
      recipientCount,
    },
  });

  return {
    success: true,
    challengeId: challenge.challengeId,
    expiresAt: challenge.expiresAt,
    maskedEmail: challenge.maskedEmail,
    previewCode: challenge.previewCode,
  };
}

export async function verifyOtpChallenge({
  challengeId,
  code,
}: {
  challengeId: string;
  code: string;
}) {
  if (!challengeId || !code) {
    return { success: false, error: "Challenge ID and code are required." };
  }

  const result = verifyOtpCode({ challengeId, code });
  return result;
}

