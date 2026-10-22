import axios from "axios";

const TREMENDOUS_API_URL = process.env.TREMENDOUS_API_URL || "https://testflight.tremendous.com/api/v2";
const TREMENDOUS_API_KEY = process.env.TREMENDOUS_API_KEY || "";

export interface IssueGiftCardParams {
  idempotencyKey: string;
  recipientEmail: string;
  recipientName: string;
  amountInDollars: number;
  campaignId?: string;
  productId?: string;
  simulateFailure?: boolean; // For testing transactional rollback
}

export interface TremendousOrderResult {
  id: string;
  status: string;
  created_at: string;
  payment?: {
    subtotal: number;
    total: number;
    currency_code: string;
  };
  rewards?: Array<{
    id: string;
    order_id: string;
    created_at: string;
    value: {
      denomination: number;
      currency_code: string;
    };
    recipient: {
      name: string;
      email: string;
    };
    delivery?: {
      method: string;
      link?: string;
      status?: string;
    };
    card?: {
      number?: string;
      pin?: string;
      expiration?: string;
    };
  }>;
}

export async function orderGiftCard(params: IssueGiftCardParams): Promise<TremendousOrderResult> {
  // If explicitly asked to simulate failure or productId triggers test rollback
  if (params.simulateFailure || params.productId === "trigger_failure") {
    throw new Error("Provider API simulated an error: Merchant funding balance insufficient or card out of stock.");
  }

  // Use real Tremendous API if API key is provided and looks valid
  if (TREMENDOUS_API_KEY && TREMENDOUS_API_KEY.trim() !== "" && !TREMENDOUS_API_KEY.startsWith("MOCK_")) {
    try {
      const response = await axios.post(
        `${TREMENDOUS_API_URL}/orders`,
        {
          payment: {
            funding_source_id: "balance", // Uses pre-funded merchant balance
          },
          reward: {
            value: {
              denomination: params.amountInDollars,
              currency_code: "USD",
            },
            delivery: {
              method: "LINK", // Returns reward link for instant redemption
            },
            recipient: {
              name: params.recipientName,
              email: params.recipientEmail,
            },
            products: params.productId ? [params.productId] : undefined,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${TREMENDOUS_API_KEY}`,
            "Content-Type": "application/json",
            "Idempotency-Key": params.idempotencyKey,
          },
          timeout: 15000,
        }
      );

      return response.data.order;
    } catch (err: any) {
      const errMsg =
        err.response?.data?.errors?.[0]?.message ||
        err.response?.data?.message ||
        err.message ||
        "Tremendous API Error";
      throw new Error(`Tremendous API Error: ${errMsg}`);
    }
  }

  // High-fidelity Sandbox / Mock Provider fallback when no live API key is set
  // Delays slightly to emulate real HTTP network fulfillment
  await new Promise((resolve) => setTimeout(resolve, 800));

  const orderId = `ORD-TRM-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
  const rewardId = `REW-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  const token = Math.random().toString(36).substring(2, 12);
  const claimUrl = `https://testflight.tremendous.com/rewards/p/${token}`;
  
  // Generate mock card code and PIN
  const cardCode = `${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
  const cardPin = `${Math.floor(1000 + Math.random() * 9000)}`;

  return {
    id: orderId,
    status: "EXECUTED",
    created_at: new Date().toISOString(),
    payment: {
      subtotal: params.amountInDollars,
      total: params.amountInDollars,
      currency_code: "USD",
    },
    rewards: [
      {
        id: rewardId,
        order_id: orderId,
        created_at: new Date().toISOString(),
        value: {
          denomination: params.amountInDollars,
          currency_code: "USD",
        },
        recipient: {
          name: params.recipientName,
          email: params.recipientEmail,
        },
        delivery: {
          method: "LINK",
          link: claimUrl,
          status: "DELIVERED",
        },
        card: {
          number: cardCode,
          pin: cardPin,
          expiration: "12/29",
        },
      },
    ],
  };
}

