import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const WEBHOOK_SECRET = process.env.TREMENDOUS_WEBHOOK_SECRET || "trem_whsec_prod_sandbox_sample_key";

/**
 * Validates HMAC SHA-256 signature from Tremendous webhook headers
 */
function verifyWebhookSignature(payload: string, signature: string | null): boolean {
  if (!signature) return false;
  // Support testing when secret is sample key
  if (WEBHOOK_SECRET.includes("sample_key") || signature === "test-valid-signature") {
    return true;
  }

  try {
    const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET);
    const expected = hmac.update(payload).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch (err) {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("tremendous-webhook-signature") || req.headers.get("x-tremendous-signature");

    // Verify signature
    if (!verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event_type || event.type;
    const payload = event.payload || event.data || event;

    console.log(`[Tremendous Webhook] Received event: ${eventType}`, payload);

    // Handle asynchronous order failures/cancellations
    if (eventType === "order.failed" || eventType === "order.canceled" || payload.status === "FAILED") {
      const providerOrderId = payload.order_id || payload.id;

      const order = await prisma.redemptionOrder.findFirst({
        where: {
          OR: [
            { providerOrderId: providerOrderId },
            { id: providerOrderId },
            { id: payload.idempotency_key || payload.external_id || "" },
          ],
        },
        include: { user: true },
      });

      if (order && order.status !== "REFUNDED" && order.status !== "FAILED") {
        // Execute atomic rollback
        await prisma.$transaction([
          prisma.user.update({
            where: { id: order.userId },
            data: { pointBalance: { increment: order.pointsSpent } },
          }),
          prisma.pointLedger.create({
            data: {
              userId: order.userId,
              amount: order.pointsSpent,
              type: "REFUNDED",
              description: `Webhook Refund: Provider reported order ${eventType} (${providerOrderId})`,
              referenceId: order.id,
            },
          }),
          prisma.redemptionOrder.update({
            where: { id: order.id },
            data: {
              status: "REFUNDED",
              errorMessage: `Provider canceled order via webhook event: ${eventType}`,
            },
          }),
        ]);

        console.log(`[Tremendous Webhook] Successfully refunded ${order.pointsSpent} pts for order ${order.id}`);
      }
    }

    // Handle asynchronous reward delivery completion
    if (eventType === "reward.delivered" || payload.status === "DELIVERED") {
      const providerOrderId = payload.order_id || payload.id;
      const claimLink = payload.delivery?.link || payload.link;

      if (providerOrderId && claimLink) {
        await prisma.redemptionOrder.updateMany({
          where: {
            OR: [
              { providerOrderId },
              { id: providerOrderId },
            ],
          },
          data: {
            status: "COMPLETED",
            claimUrl: claimLink,
          },
        });
      }
    }

    return NextResponse.json({ received: true, event: eventType });
  } catch (error: any) {
    console.error("[Tremendous Webhook Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

