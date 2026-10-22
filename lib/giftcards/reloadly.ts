import axios from "axios";

const RELOADLY_AUTH_URL = process.env.RELOADLY_AUTH_URL || "https://auth.reloadly.com/oauth/token";
const RELOADLY_API_URL = process.env.RELOADLY_API_URL || "https://giftcards-sandbox.reloadly.com";
const RELOADLY_CLIENT_ID = process.env.RELOADLY_CLIENT_ID || "";
const RELOADLY_CLIENT_SECRET = process.env.RELOADLY_CLIENT_SECRET || "";

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

export interface IssueReloadlyParams {
  idempotencyKey: string;
  recipientEmail: string;
  recipientName: string;
  amountInDollars: number;
  productId?: string;
  simulateFailure?: boolean;
}

export interface ReloadlyOrderResult {
  id: string;
  status: string;
  provider: "RELOADLY";
  created_at: string;
  amount: number;
  currencyCode: string;
  card?: {
    number?: string;
    pin?: string;
    claimUrl?: string;
    expirationDate?: string;
  };
}

async function getReloadlyAccessToken(): Promise<string> {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 60000) {
    return cachedAccessToken.token;
  }

  if (!RELOADLY_CLIENT_ID || !RELOADLY_CLIENT_SECRET) {
    return "mock_reloadly_token";
  }

  const response = await axios.post(
    RELOADLY_AUTH_URL,
    {
      client_id: RELOADLY_CLIENT_ID,
      client_secret: RELOADLY_CLIENT_SECRET,
      grant_type: "client_credentials",
      audience: RELOADLY_API_URL,
    },
    { timeout: 10000 }
  );

  const token = response.data.access_token;
  const expiresIn = response.data.expires_in || 3600;
  cachedAccessToken = {
    token,
    expiresAt: Date.now() + expiresIn * 1000,
  };

  return token;
}

export async function orderReloadlyGiftCard(params: IssueReloadlyParams): Promise<ReloadlyOrderResult> {
  if (params.simulateFailure) {
    throw new Error("Reloadly API simulated error: Out of inventory in selected region.");
  }

  // Real Reloadly API integration if credentials provided
  if (RELOADLY_CLIENT_ID && RELOADLY_CLIENT_SECRET && !RELOADLY_CLIENT_ID.startsWith("MOCK_")) {
    try {
      const token = await getReloadlyAccessToken();
      const response = await axios.post(
        `${RELOADLY_API_URL}/orders`,
        {
          productId: params.productId || "120",
          countryCode: "US",
          quantity: 1,
          unitPrice: params.amountInDollars,
          customIdentifier: params.idempotencyKey,
          recipientEmail: params.recipientEmail,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/com.reloadly.giftcards-v1+json",
            "Content-Type": "application/json",
          },
          timeout: 15000,
        }
      );

      const data = response.data;
      return {
        id: `RLD-${data.transactionId || data.id}`,
        status: data.status || "SUCCESSFUL",
        provider: "RELOADLY",
        created_at: new Date().toISOString(),
        amount: params.amountInDollars,
        currencyCode: "USD",
        card: {
          number: data.cardNumber || data.pinCode,
          pin: data.pin || "0000",
          claimUrl: data.redemptionInstructions?.url || null,
          expirationDate: "12/2029",
        },
      };
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || "Reloadly API Error";
      throw new Error(`Reloadly API Error: ${errMsg}`);
    }
  }

  // Sandbox fallback simulator
  await new Promise((resolve) => setTimeout(resolve, 600));

  const orderId = `RLD-ORD-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
  const cardNumber = `RLD-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
  const cardPin = `${Math.floor(1000 + Math.random() * 9000)}`;
  const claimUrl = `https://giftcards.reloadly.com/redeem/${Math.random().toString(36).substring(2, 10)}`;

  return {
    id: orderId,
    status: "SUCCESSFUL",
    provider: "RELOADLY",
    created_at: new Date().toISOString(),
    amount: params.amountInDollars,
    currencyCode: "USD",
    card: {
      number: cardNumber,
      pin: cardPin,
      claimUrl,
      expirationDate: "12/2029",
    },
  };
}

