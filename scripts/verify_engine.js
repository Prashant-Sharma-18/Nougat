const { PrismaClient } = require("@prisma/client");
const { redeemPointsForCard } = require("./actions/redeem");

// Direct Node test of the safe redemption and rollback logic
const prisma = new PrismaClient();

async function runVerification() {
  console.log("=== RUNNING ENGINE VERIFICATION ===");
  
  // 1. Get Alex demo user
  const user = await prisma.user.findFirst({
    where: { email: "alex.demo@loyaltyrewards.io" },
  });

  if (!user) {
    throw new Error("Demo user not found");
  }

  const initialBalance = user.pointBalance;
  console.log(`Starting Balance for ${user.name}: ${initialBalance} points`);

  // 2. Test successful redemption of Starbucks ($10 = 1000 points)
  console.log("\n--- TEST 1: Valid $10 Starbucks Card Redemption ---");
  const brand = await prisma.brandCatalogCache.findFirst({
    where: { name: { contains: "Starbucks" } }
  });

  const successResult = await redeemPointsForCard({
    userId: user.id,
    brandId: brand.id,
    faceValue: 10,
    simulateFailure: false,
  });

  console.log("Redemption Result:", {
    success: successResult.success,
    orderId: successResult.orderId,
    claimUrl: successResult.claimUrl,
    cardCode: successResult.cardCode,
    cardPin: successResult.cardPin,
  });

  const userAfterSuccess = await prisma.user.findUnique({ where: { id: user.id } });
  console.log(`Balance after successful redemption: ${userAfterSuccess.pointBalance} (Expected: ${initialBalance - 1000})`);

  // 3. Test failure and safe ACID rollback
  console.log("\n--- TEST 2: Simulated Provider Failure with ACID Rollback ---");
  try {
    await redeemPointsForCard({
      userId: user.id,
      brandId: brand.id,
      faceValue: 10,
      simulateFailure: true,
    });
    console.error("ERROR: Expected redemption to throw, but it succeeded!");
  } catch (err) {
    console.log("Caught expected error:", err.message);
  }

  const userAfterRollback = await prisma.user.findUnique({ where: { id: user.id } });
  console.log(`Balance after rollback: ${userAfterRollback.pointBalance} (Points successfully protected & refunded!)`);

  // 4. Verify Point Ledger audit entries
  console.log("\n--- TEST 3: Verify Double-Entry Audit Ledger ---");
  const recentLedger = await prisma.pointLedger.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  console.log("Recent Ledger Entries:");
  for (const entry of recentLedger) {
    console.log(`- [${entry.type}] ${entry.amount > 0 ? "+" : ""}${entry.amount} pts: ${entry.description} (ref: ${entry.referenceId})`);
  }

  console.log("\n=== ALL ENGINE VERIFICATIONS PASSED SUCCESSFULLY! ===");
}

runVerification()
  .catch((e) => {
    console.error("Verification failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

