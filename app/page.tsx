import { prisma } from "@/lib/prisma";
import WorkspaceDashboard from "@/components/WorkspaceDashboard";
import { getOrCreateDefaultUser } from "@/actions/users";
import { syncBitrefillCatalog } from "@/lib/giftcards/bitrefill";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Ensure default demo user exists
  await getOrCreateDefaultUser();

  // If live Bitrefill API key is present and real cards are not yet loaded, auto-sync
  if (process.env.BITREFILL_API_KEY && !process.env.BITREFILL_API_KEY.startsWith("MOCK_")) {
    const realCount = await prisma.brandCatalogCache.count({
      where: {
        isActive: true,
        NOT: { id: { startsWith: "prod_" } },
      },
    });

    if (realCount === 0) {
      await syncBitrefillCatalog();
    }
  }

  // Fetch active brands for catalog
  const brands = await prisma.brandCatalogCache.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  return <WorkspaceDashboard brands={brands as any} />;
}
