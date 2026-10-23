import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

export const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20" as any,
      typescript: true,
    })
  : null;

export interface PointPack {
  id: string;
  name: string;
  points: number;
  bonusPoints: number;
  totalPoints: number;
  priceInCents: number;
  priceFormatted: string;
  effectiveRate: string;
  targetAudience: "ALL" | "PERSONAL" | "ENTERPRISE";
  badge?: string;
  description: string;
}

export const POINT_PACKS: PointPack[] = [
  {
    id: "pack_starter",
    name: "Starter Bundle",
    points: 2500,
    bonusPoints: 0,
    totalPoints: 2500,
    priceInCents: 2500,
    priceFormatted: "$25.00",
    effectiveRate: "$0.010 / pt",
    targetAudience: "PERSONAL",
    description: "Ideal for individual gift card redemptions and personal milestones.",
  },
  {
    id: "pack_value",
    name: "Value Growth Pack",
    points: 5000,
    bonusPoints: 500,
    totalPoints: 5500,
    priceInCents: 5000,
    priceFormatted: "$50.00",
    effectiveRate: "$0.009 / pt",
    targetAudience: "ALL",
    badge: "Most Popular",
    description: "Includes 10% complimentary bonus loyalty credits for regular shoppers.",
  },
  {
    id: "pack_pro",
    name: "Executive Tier Reserve",
    points: 10000,
    bonusPoints: 2000,
    totalPoints: 12000,
    priceInCents: 10000,
    priceFormatted: "$100.00",
    effectiveRate: "$0.0083 / pt",
    targetAudience: "ALL",
    badge: "20% Bonus",
    description: "Maximum consumer value with 2,000 bonus loyalty credits.",
  },
  {
    id: "pack_enterprise_pool",
    name: "Corporate Workforce Pool",
    points: 50000,
    bonusPoints: 15000,
    totalPoints: 65000,
    priceInCents: 50000,
    priceFormatted: "$500.00",
    effectiveRate: "$0.0076 / pt",
    targetAudience: "ENTERPRISE",
    badge: "Enterprise Standard",
    description: "Designed for corporate spot bonuses, quarterly employee incentives, and bulk vouchers.",
  },
];

export interface CreatePaymentIntentParams {
  amountInCents: number;
  currency?: string;
  userId: string;
  description: string;
  orderType: "POINT_BUNDLE" | "SPLIT_TENDER_COPAY";
  packId?: string;
  brandId?: string;
  pointsAwarded?: number;
  idempotencyKey?: string;
}

export interface PaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
  amountInCents: number;
  currency: string;
  status: string;
  isSimulated: boolean;
}

export async function createPaymentIntent(
  params: CreatePaymentIntentParams
): Promise<PaymentIntentResult> {
  const currency = params.currency || "usd";

  // Production Stripe API route
  if (stripe && STRIPE_SECRET_KEY && !STRIPE_SECRET_KEY.startsWith("mock_")) {
    try {
      const intent = await stripe.paymentIntents.create(
        {
          amount: params.amountInCents,
          currency: currency.toLowerCase(),
          description: params.description,
          metadata: {
            userId: params.userId,
            orderType: params.orderType,
            packId: params.packId || "",
            brandId: params.brandId || "",
            pointsAwarded: params.pointsAwarded ? params.pointsAwarded.toString() : "0",
          },
          automatic_payment_methods: {
            enabled: true,
          },
        },
        params.idempotencyKey ? { idempotencyKey: params.idempotencyKey } : undefined
      );

      return {
        clientSecret: intent.client_secret || "",
        paymentIntentId: intent.id,
        amountInCents: intent.amount,
        currency: intent.currency,
        status: intent.status,
        isSimulated: false,
      };
    } catch (err: any) {
      console.error("[Stripe] Failed to create payment intent:", err);
      throw new Error(`Stripe Payment Error: ${err.message}`);
    }
  }

  // High-fidelity Simulator fallback when running locally or without live production keys
  const fakeId = `pi_sim_${Math.random().toString(36).substring(2, 12)}`;
  const fakeSecret = `${fakeId}_secret_${Math.random().toString(36).substring(2, 10)}`;

  return {
    clientSecret: fakeSecret,
    paymentIntentId: fakeId,
    amountInCents: params.amountInCents,
    currency: currency.toLowerCase(),
    status: "requires_payment_method",
    isSimulated: true,
  };
}

export function verifyStripeWebhook(
  rawBody: string,
  signatureHeader: string | null
): Stripe.Event {
  if (!stripe || !STRIPE_WEBHOOK_SECRET || STRIPE_WEBHOOK_SECRET.startsWith("whsec_placeholder")) {
    // Return parsed payload in test/dev simulation
    return JSON.parse(rawBody) as Stripe.Event;
  }

  if (!signatureHeader) {
    throw new Error("Missing stripe-signature header");
  }

  return stripe.webhooks.constructEvent(rawBody, signatureHeader, STRIPE_WEBHOOK_SECRET);
}
