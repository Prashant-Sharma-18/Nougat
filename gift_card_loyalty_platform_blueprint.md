# Gift Card Loyalty & Rewards Platform: Project Specification & Implementation Guide

This document acts as the master architecture blueprint and prompt specification to build a production-ready **Gift Card Loyalty Platform** using autonomous coding agents (**Claude Code** or **Antigravity**).

---

## 1. Executive Summary & Core Mechanics

The platform enables users to earn points through purchases/engagement and redeem those points for **real, digital gift cards** (Amazon, Apple, Starbucks, Target, etc.) issued via enterprise gift card APIs (such as Reloadly, Tremendous, or Tango Card / Runa).

### Key Workflows:
1. **User Loyalty Loop**:
   - Users create an account and earn loyalty points (e.g., $1 spent = 10 points; daily check-ins; milestone bonuses).
   - Point balance ledger ensures atomic, double-entry accuracy.
2. **Gift Card Catalog & Ordering**:
   - Fetch real-time gift card catalogs, exchange rates, and available denominations via provider API.
   - User initiates a redemption request using loyalty points.
3. **Fulfillment & Security**:
   - Point balance lock / deduction with rollback on failure.
   - Idempotent order placement via Gift Card Partner API.
   - Secure digital delivery (instant claim link or encrypted card number + PIN delivered via email/in-app wallet).

---

## 2. Recommended Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| **Framework** | Next.js 14+ (App Router, TypeScript) | Unified full-stack, Server Actions, edge-ready |
| **Database** | PostgreSQL + Prisma ORM | ACID compliance, ledger integrity, relational constraints |
| **Auth** | NextAuth.js / Supabase Auth / Clerk | Multi-provider OAuth & JWT session handling |
| **Gift Card Provider** | **Tremendous API** or **Reloadly API** | Sandbox test environments, instant code delivery, global coverage |
| **State & UI** | Tailwind CSS + Shadcn UI | Accessible, clean UI components |
| **Queues / Workers** | BullMQ / Inngest | Async order fulfillment, retry policies, webhook ingestion |

---

## 3. Data Architecture (Prisma Schema)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  USER
  ADMIN
}

enum TransactionType {
  EARNED
  REDEEMED
  REFUNDED
  ADJUSTED
}

enum OrderStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  REFUNDED
}

model User {
  id            String         @id @default(uuid())
  email         String         @unique
  name          String?
  role          Role           @default(USER)
  pointBalance  Int            @default(0)
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  
  transactions  PointLedger[]
  orders        RedemptionOrder[]

  @@index([email])
}

model PointLedger {
  id          String          @id @default(uuid())
  userId      String
  user        User            @relation(fields: [userId], references: [id])
  amount      Int             // Positive for earnings, negative for redemptions
  type        TransactionType
  description String
  referenceId String?         // Links to orderId or activityId
  createdAt   DateTime        @default(now())

  @@index([userId])
}

model BrandCatalogCache {
  id             String   @id // Provider brand/product ID
  name           String
  currencyCode   String   @default("USD")
  minRecipientVal Float
  maxRecipientVal Float
  logoUrl        String
  denominations  Float[]  // e.g. [10, 25, 50, 100]
  pointsPerUnit  Float    @default(100.0) // 100 points = $1.00
  isActive       Boolean  @default(true)
  updatedAt      DateTime @updatedAt
}

model RedemptionOrder {
  id               String       @id @default(uuid())
  userId           String
  user             User         @relation(fields: [userId], references: [id])
  brandId          String
  brandName        String
  faceValue        Float
  currency         String       @default("USD")
  pointsSpent      Int
  status           OrderStatus  @default(PENDING)
  providerOrderId  String?      @unique
  claimUrl         String?      // Provider link if delivered as URL
  cardCodeEncrypted String?     // If delivered as raw voucher code
  cardPinEncrypted  String?
  errorMessage     String?
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt

  @@index([userId])
  @@index([status])
}
```

---

## 4. Gift Card Provider Integration Architecture (Tremendous Example)

### Provider Adapter Pattern: `lib/giftcards/tremendous.ts`

```typescript
import axios from "axios";

const TREMENDOUS_API_URL = process.env.TREMENDOUS_API_URL || "https://testflight.tremendous.com/api/v2";
const TREMENDOUS_API_KEY = process.env.TREMENDOUS_API_KEY;

export interface IssueGiftCardParams {
  idempotencyKey: string;
  recipientEmail: string;
  recipientName: string;
  amountInDollars: number;
  campaignId?: string;
  productId?: string;
}

export async function orderGiftCard(params: IssueGiftCardParams) {
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
    }
  );

  return response.data.order;
}
```

---

## 5. Safe Redemption Logic (ACID Transaction)

### Server Action: `actions/redeem.ts`

```typescript
import { prisma } from "@/lib/prisma";
import { orderGiftCard } from "@/lib/giftcards/tremendous";
import { v4 as uuidv4 } from "uuid";

export async function redeemPointsForCard({
  userId,
  brandId,
  faceValue,
}: {
  userId: string;
  brandId: string;
  faceValue: number;
}) {
  const POINTS_PER_DOLLAR = 100;
  const pointsRequired = Math.round(faceValue * POINTS_PER_DOLLAR);

  // 1. Transactional check and balance deduction
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.pointBalance < pointsRequired) {
      throw new Error("Insufficient point balance.");
    }

    // Deduct points
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: { pointBalance: { decrement: pointsRequired } },
    });

    // Create pending order
    const order = await tx.redemptionOrder.create({
      data: {
        userId,
        brandId,
        brandName: "Brand", // replace with dynamic name
        faceValue,
        pointsSpent: pointsRequired,
        status: "PROCESSING",
      },
    });

    // Write audit ledger record
    await tx.pointLedger.create({
      data: {
        userId,
        amount: -pointsRequired,
        type: "REDEEMED",
        description: `Redeemed $${faceValue} Gift Card`,
        referenceId: order.id,
      },
    });

    return { user: updatedUser, order };
  });

  // 2. Call Gift Card API outside the DB lock
  try {
    const providerResponse = await orderGiftCard({
      idempotencyKey: result.order.id,
      recipientEmail: result.user.email,
      recipientName: result.user.name || "Loyalty Member",
      amountInDollars: faceValue,
      productId: brandId,
    });

    const reward = providerResponse.rewards?.[0];

    // 3. Mark completed
    await prisma.redemptionOrder.update({
      where: { id: result.order.id },
      data: {
        status: "COMPLETED",
        providerOrderId: providerResponse.id,
        claimUrl: reward?.delivery?.link || null,
      },
    });

    return { success: true, orderId: result.order.id, claimUrl: reward?.delivery?.link };
  } catch (err: any) {
    // 4. Safe Rollback: refund points if API call fails
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { pointBalance: { increment: pointsRequired } },
      }),
      prisma.pointLedger.create({
        data: {
          userId,
          amount: pointsRequired,
          type: "REFUNDED",
          description: `Refund: Order fulfillment failed for order ${result.order.id}`,
          referenceId: result.order.id,
        },
      }),
      prisma.redemptionOrder.update({
        where: { id: result.order.id },
        data: {
          status: "FAILED",
          errorMessage: err.message || "Provider redemption failure",
        },
      }),
    ]);

    throw new Error("Gift card issuance failed. Points have been credited back.");
  }
}
```

---

## 6. Execution Instructions for Claude Code or Antigravity

When running your agent (Claude Code / Antigravity), initiate the project by pasting the command below:

```bash
claude "Read PROJECT_BLUEPRINT.md and initialize a Next.js 14 project using App Router, TypeScript, Tailwind CSS, Prisma, and Tremendous API integration. Implement the database schema, provider API adapter, and point redemption workflow with transactional rollback safety."
```

### Milestone Checklist:
- [ ] **Milestone 1**: Setup Next.js + Prisma schema + PostgreSQL connection.
- [ ] **Milestone 2**: Authentication (User sessions and protected dashboard).
- [ ] **Milestone 3**: Points ledger and simulate earning rules (e.g., test trigger button).
- [ ] **Milestone 4**: Gift card provider sandbox integration (`Tremendous` / `Reloadly`).
- [ ] **Milestone 5**: Catalog UI with brand filtering, balance preview, and modal redemption.
- [ ] **Milestone 6**: Delivery UI (Instant claim button + User Order History).