import { orderGiftCard as orderTremendous, IssueGiftCardParams } from "./tremendous";
import { orderReloadlyGiftCard, IssueReloadlyParams } from "./reloadly";

export type SupportedProvider = "TREMENDOUS" | "RELOADLY" | "AUTO_FAILOVER";

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
  providerUsed: "TREMENDOUS" | "RELOADLY";
  claimUrl: string | null;
  cardCode: string | null;
  cardPin: string | null;
  status: string;
  failoverTriggered?: boolean;
}

/**
 * Smart Provider Router with Automatic Failover.
 * Tries the primary provider first; if unavailable or rejected, falls back seamlessly to the secondary provider.
 */
export async function fulfillGiftCardOrder(
  params: UnifiedFulfillmentParams
): Promise<UnifiedOrderResult> {
  const mode = params.preferredProvider || "AUTO_FAILOVER";

  // If forced failure requested for testing ACID rollback
  if (params.simulateFailure) {
    throw new Error("Simulated Provider Outage: Both Tremendous and Reloadly rejected the order.");
  }

  // Route: Tremendous Preferred or Auto-Failover Primary
  if (mode === "TREMENDOUS" || mode === "AUTO_FAILOVER") {
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
        throw new Error(
          `All providers failed fulfillment. Tremendous error: ${tremError.message} | Reloadly error: ${reloadlyError.message}`
        );
      }
    }
  }

  // Explicit Reloadly route
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

