import { prisma } from "@/lib/prisma";
import WorkspaceDashboard from "@/components/WorkspaceDashboard";
import { getOrCreateDefaultUser } from "@/actions/users";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Ensure default demo user exists
  await getOrCreateDefaultUser();

  // Fetch active brands for catalog
  const brands = await prisma.brandCatalogCache.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  return <WorkspaceDashboard brands={brands as any} />;
}
