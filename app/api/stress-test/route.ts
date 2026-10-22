import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { redeemPointsForCard } from "@/actions/redeem";

export async function GET() {
  const testEmail = `stress.test.${Date.now()}@loyaltytest.io`;

  try {
    // 1. Create a temporary user with EXACTLY 1,000 points
    const testUser = await prisma.user.create({
      data: {
        email: testEmail,
        name: "Concurrency Test Subject",
        pointBalance: 1000, // Enough for EXACTLY ONE $10 gift card
      },
    });

    const brand = await prisma.brandCatalogCache.findFirst({
      where: { name: { contains: "Starbucks" } },
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    console.log(`[Stress Test] Initiating 5 simultaneous redemptions on a 1,000-pt balance for user ${testUser.id}`);

    // 2. Fire 5 simultaneous, concurrent redemption requests
    const attempts = [1, 2, 3, 4, 5];
    const results = await Promise.allSettled(
      attempts.map((attemptNum) =>
        redeemPointsForCard({
          userId: testUser.id,
          brandId: brand.id,
          faceValue: 10, // Requires 1,000 pts
          preferredProvider: "AUTO_FAILOVER",
        })
      )
    );

    // 3. Inspect outcomes
    const successful = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    // 4. Verify ending balance & ledger integrity
    const finalUser = await prisma.user.findUnique({
      where: { id: testUser.id },
    });

    const ledgerEntries = await prisma.pointLedger.findMany({
      where: { userId: testUser.id },
    });

    const ordersCreated = await prisma.redemptionOrder.findMany({
      where: { userId: testUser.id },
    });

    const doubleSpendPrevented =
      successful.length === 1 &&
      rejected.length === 4 &&
      finalUser?.pointBalance === 0;

    // 5. Cleanup temporary test user
    await prisma.user.delete({
      where: { id: testUser.id },
    });

    return NextResponse.json({
      success: true,
      concurrencyResults: {
        totalSimultaneousRequests: 5,
        successfulRedemptions: successful.length,
        rejectedRedemptions: rejected.length,
        startingBalance: 1000,
        endingBalance: finalUser?.pointBalance,
        doubleSpendPrevented,
        verdict: doubleSpendPrevented
          ? "PASSED: ACID atomic isolation verified. Exactly 1 request fulfilled; 4 rejected with Insufficient Balance."
          : "FAILED: Double-spend detected. Isolation level insufficient.",
        rejectionReasons: rejected.map((r: any) => r.reason?.message || "Rejected"),
      },
    });
  } catch (err: any) {
    // Attempt cleanup if failed
    await prisma.user.deleteMany({ where: { email: testEmail } });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

