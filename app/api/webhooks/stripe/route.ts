import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyStripeWebhook } from "@/lib/payments/stripe";
import { createNotification } from "@/actions/notifications";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("stripe-signature");

    let event: any;
    try {
      event = verifyStripeWebhook(rawBody, signature);
    } catch (err: any) {
      console.error("[Stripe Webhook] Signature verification failed:", err.message);
      return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
    }

    const eventType = event.type;
    const paymentIntent = event.data?.object;

    console.log(`[Stripe Webhook] Received event: ${eventType}`);

    if (eventType === "payment_intent.succeeded" && paymentIntent) {
      const metadata = paymentIntent.metadata || {};
      const userId = metadata.userId;
      const orderType = metadata.orderType;
      const paymentIntentId = paymentIntent.id;

      if (orderType === "POINT_BUNDLE" && userId) {
        const pointsAwarded = parseInt(metadata.pointsAwarded || "0", 10);
        const packId = metadata.packId || "custom";

        // Idempotency check: don't double credit if already credited
        const existing = await prisma.pointLedger.findFirst({
          where: { referenceId: paymentIntentId },
        });

        if (!existing && pointsAwarded > 0) {
          const amountFormatted = `$${(paymentIntent.amount / 100).toFixed(2)}`;

          await prisma.$transaction([
            prisma.user.update({
              where: { id: userId },
              data: { pointBalance: { increment: pointsAwarded } },
            }),
            prisma.pointLedger.create({
              data: {
                userId,
                amount: pointsAwarded,
                type: "EARNED",
                description: `Stripe Webhook: Point Bundle (${packId}) +${pointsAwarded.toLocaleString()} pts (${amountFormatted})`,
                referenceId: paymentIntentId,
              },
            }),
          ]);

          try {
            await createNotification({
              userId,
              title: "Payment Confirmed",
              message: `Your payment of ${amountFormatted} was confirmed by Stripe. +${pointsAwarded.toLocaleString()} points added.`,
              type: "EARN",
              link: "/wallet",
            });
          } catch (e) {
            // Non-blocking notification
          }

          console.log(`[Stripe Webhook] Successfully credited ${pointsAwarded} pts to user ${userId}`);
        }
      }
    }

    if (eventType === "payment_intent.payment_failed" && paymentIntent) {
      const userId = paymentIntent.metadata?.userId;
      if (userId) {
        try {
          await createNotification({
            userId,
            title: "Card Payment Failed",
            message: `Your payment of $${(paymentIntent.amount / 100).toFixed(2)} could not be processed. Please check your card details.`,
            type: "SYSTEM",
            link: "/wallet",
          });
        } catch (e) {
          // Non-blocking notification
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("[Stripe Webhook Error]:", err);
    return NextResponse.json({ error: err.message || "Internal Webhook Error" }, { status: 500 });
  }
}
