import { orderGiftCard as orderTremendous, IssueGiftCardParams } from "./tremendous";
import { orderReloadlyGiftCard, IssueReloadlyParams } from "./reloadly";
import { orderBitrefillGiftCard, IssueBitrefillParams } from "./bitrefill";

export type SupportedProvider = "BITREFILL" | "TREMENDOUS" | "RELOADLY" | "AUTO_FAILOVER";

export interface UnifiedFulfillmentParams {
  idempotencyKey: string;
  recipientEmail: string;
  recipientName: string;
  amountInDollars: number;
  productId?: string;
  preferredProvider?: SupportedProvider;
  simulateFailure?: boolean;
}

export interface UnifiedOrderResult {
  providerOrderId: string;
  providerUsed: "BITREFILL" | "TREMENDOUS" | "RELOADLY";
  claimUrl: string | null;
  cardCode: string | null;
  cardPin: string | null;
  status: string;
  failoverTriggered?: boolean;
}

/**
 * Smart Provider Router with Automatic Multi-Provider Failover.
 * Dynamically routes across Bitrefill, Tremendous, and Reloadly.
 */
export async function fulfillGiftCardOrder(
  params: UnifiedFulfillmentParams
): Promise<UnifiedOrderResult> {
  const mode = params.preferredProvider || "AUTO_FAILOVER";

  // If forced failure requested for testing ACID rollback
  if (params.simulateFailure) {
    throw new Error("Simulated Provider Outage: All gift card providers rejected the order.");
  }

  // 1. Explicit Bitrefill route
  if (mode === "BITREFILL") {
    const bitResult = await orderBitrefillGiftCard({
      idempotencyKey: params.idempotencyKey,
      recipientEmail: params.recipientEmail,
      recipientName: params.recipientName,
      amountInDollars: params.amountInDollars,
      productId: params.productId,
    });

    return {
      providerOrderId: bitResult.id,
      providerUsed: "BITREFILL",
      claimUrl: bitResult.card?.claimUrl || null,
      cardCode: bitResult.card?.number || null,
      cardPin: bitResult.card?.pin || null,
      status: bitResult.status,
    };
  }

  // 2. Explicit Reloadly route
  if (mode === "RELOADLY") {
    const reloadlyResult = await orderReloadlyGiftCard({
      idempotencyKey: params.idempotencyKey,
      recipientEmail: params.recipientEmail,
      recipientName: params.recipientName,
      amountInDollars: params.amountInDollars,
      productId: params.productId,
    });

    return {
      providerOrderId: reloadlyResult.id,
      providerUsed: "RELOADLY",
      claimUrl: reloadlyResult.card?.claimUrl || null,
      cardCode: reloadlyResult.card?.number || null,
      cardPin: reloadlyResult.card?.pin || null,
      status: reloadlyResult.status,
    };
  }

  // 3. Auto-failover: If Bitrefill has a live API key, use Bitrefill first!
  const hasLiveBitrefillKey =
    Boolean(process.env.BITREFILL_API_KEY) &&
    !process.env.BITREFILL_API_KEY?.startsWith("MOCK_");

  if (mode === "AUTO_FAILOVER" && hasLiveBitrefillKey) {
    try {
      const bitResult = await orderBitrefillGiftCard({
        idempotencyKey: params.idempotencyKey,
        recipientEmail: params.recipientEmail,
        recipientName: params.recipientName,
        amountInDollars: params.amountInDollars,
        productId: params.productId,
      });

      return {
        providerOrderId: bitResult.id,
        providerUsed: "BITREFILL",
        claimUrl: bitResult.card?.claimUrl || null,
        cardCode: bitResult.card?.number || null,
        cardPin: bitResult.card?.pin || null,
        status: bitResult.status,
      };
    } catch (bitErr: any) {
      console.warn(
        `[Provider Router] Live Bitrefill fulfillment failed: ${bitErr.message}. Cascading to secondary provider...`
      );
    }
  }

  // 4. Tremendous or Auto-Failover Primary
  try {
    const result = await orderTremendous({
      idempotencyKey: params.idempotencyKey,
      recipientEmail: params.recipientEmail,
      recipientName: params.recipientName,
      amountInDollars: params.amountInDollars,
      productId: params.productId,
    });

    const reward = result.rewards?.[0];
    return {
      providerOrderId: result.id,
      providerUsed: "TREMENDOUS",
      claimUrl: reward?.delivery?.link || null,
      cardCode: reward?.card?.number || null,
      cardPin: reward?.card?.pin || null,
      status: result.status,
    };
  } catch (tremError: any) {
    if (mode === "TREMENDOUS") {
      throw tremError; // Don't failover if user explicitly locked provider
    }

    console.warn(
      `[Provider Router] Primary provider (Tremendous) failed: ${tremError.message}. Triggering auto-failover to Reloadly...`
    );

    // Attempt Secondary Provider (Reloadly)
    try {
      const reloadlyResult = await orderReloadlyGiftCard({
        idempotencyKey: `${params.idempotencyKey}-failover`,
        recipientEmail: params.recipientEmail,
        recipientName: params.recipientName,
        amountInDollars: params.amountInDollars,
        productId: params.productId,
      });

      return {
        providerOrderId: reloadlyResult.id,
        providerUsed: "RELOADLY",
        claimUrl: reloadlyResult.card?.claimUrl || null,
        cardCode: reloadlyResult.card?.number || null,
        cardPin: reloadlyResult.card?.pin || null,
        status: reloadlyResult.status,
        failoverTriggered: true,
      };
    } catch (reloadlyError: any) {
      // Final attempt: Bitrefill fallback if not already tried
      try {
        const bitFallback = await orderBitrefillGiftCard({
          idempotencyKey: `${params.idempotencyKey}-bit-failover`,
          recipientEmail: params.recipientEmail,
          recipientName: params.recipientName,
          amountInDollars: params.amountInDollars,
          productId: params.productId,
        });

        return {
          providerOrderId: bitFallback.id,
          providerUsed: "BITREFILL",
          claimUrl: bitFallback.card?.claimUrl || null,
          cardCode: bitFallback.card?.number || null,
          cardPin: bitFallback.card?.pin || null,
          status: bitFallback.status,
          failoverTriggered: true,
        };
      } catch (bitFallbackErr: any) {
        throw new Error(
          `All providers failed fulfillment. Tremendous: ${tremError.message} | Reloadly: ${reloadlyError.message} | Bitrefill: ${bitFallbackErr.message}`
        );
      }
    }
  }
}
