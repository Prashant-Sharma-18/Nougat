"use server";

import { prisma } from "@/lib/prisma";
import { decryptSensitiveData } from "@/lib/security/crypto";
import {
  sendGiftCardEmail,
  generateGiftCardEmailHtml,
} from "@/lib/email/giftcardDelivery";
import { getEmailAuditLogs } from "@/lib/email/service";
import { createNotification } from "@/actions/notifications";

export async function resendVoucherEmail({
  orderId,
  recipientEmail,
}: {
  orderId: string;
  recipientEmail: string;
}) {
  if (!recipientEmail || !recipientEmail.includes("@")) {
    throw new Error("A valid recipient email address is required.");
  }

  const order = await prisma.redemptionOrder.findUnique({
    where: { id: orderId },
    include: {
      user: true,
    },
  });

  if (!order) {
    throw new Error(`Order ${orderId} was not found.`);
  }

  // Decrypt security credentials
  const decryptedCode = order.cardCodeEncrypted
    ? decryptSensitiveData(order.cardCodeEncrypted)
    : null;
  const decryptedPin = order.cardPinEncrypted
    ? decryptSensitiveData(order.cardPinEncrypted)
    : null;

  const dispatch = await sendGiftCardEmail({
    recipientName: order.recipientName || order.user.name || "Loyalty Member",
    recipientEmail: recipientEmail.trim(),
    brandName: order.brandName,
    faceValue: order.faceValue,
    currency: "USD",
    cardCode: decryptedCode,
    cardPin: decryptedPin,
    claimUrl: order.claimUrl,
    orderId: order.id,
    remainingPoints: order.user.pointBalance,
    giftMessage: order.giftMessage,
  });

  try {
    await createNotification({
      userId: order.userId,
      title: "Voucher Email Dispatched",
      message: `Re-sent $${order.faceValue} ${order.brandName} voucher to ${recipientEmail.trim()}.`,
      type: "ORDER",
      link: "/wallet",
    });
  } catch (e) {
    // Non-blocking notification
  }

  return {
    success: true,
    recipientEmail: recipientEmail.trim(),
    dispatchId: dispatch.dispatchResult?.id || `msg_${Date.now()}`,
    isSimulated: dispatch.dispatchResult?.isSimulated ?? true,
    html: dispatch.html,
  };
}

export async function previewVoucherEmail({ orderId }: { orderId: string }) {
  const order = await prisma.redemptionOrder.findUnique({
    where: { id: orderId },
    include: {
      user: true,
    },
  });

  if (!order) {
    throw new Error(`Order ${orderId} was not found.`);
  }

  const decryptedCode = order.cardCodeEncrypted
    ? decryptSensitiveData(order.cardCodeEncrypted)
    : null;
  const decryptedPin = order.cardPinEncrypted
    ? decryptSensitiveData(order.cardPinEncrypted)
    : null;

  const html = generateGiftCardEmailHtml({
    recipientName: order.recipientName || order.user.name || "Loyalty Member",
    recipientEmail: order.recipientEmail || order.user.email,
    brandName: order.brandName,
    faceValue: order.faceValue,
    currency: "USD",
    cardCode: decryptedCode,
    cardPin: decryptedPin,
    claimUrl: order.claimUrl,
    orderId: order.id,
    remainingPoints: order.user.pointBalance,
    giftMessage: order.giftMessage,
  });

  return {
    success: true,
    orderId: order.id,
    brandName: order.brandName,
    faceValue: order.faceValue,
    recipientName: order.recipientName || order.user.name || "Loyalty Member",
    recipientEmail: order.recipientEmail || order.user.email,
    html,
  };
}

export async function fetchEmailAuditLogs() {
  return getEmailAuditLogs();
}
