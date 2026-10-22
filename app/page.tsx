import { prisma } from "@/lib/prisma";
import CatalogSection from "@/components/CatalogSection";
import HomeHeroBanner from "@/components/HomeHeroBanner";
import { getOrCreateDefaultUser } from "@/actions/users";
import { Wallet, ArrowRight } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Ensure default demo user exists
  await getOrCreateDefaultUser();

  // Fetch active brands for catalog
  const brands = await prisma.brandCatalogCache.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-8">
      {/* Dynamic Personal vs Enterprise Editorial Header */}
      <HomeHeroBanner />

      {/* Catalog Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2">
        <div>
          <h2 className="text-xl font-bold text-zinc-950 tracking-tight">
            Gift Card Catalog
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Select a brand, choose denomination, and redeem using your loyalty balance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/wallet"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-zinc-200 hover:border-zinc-300 bg-white text-xs font-semibold text-zinc-800 shadow-xs transition-colors"
          >
            <Wallet className="h-4 w-4 text-zinc-700" />
            <span>Digital Wallet</span>
            <ArrowRight className="h-3.5 w-3.5 text-zinc-400" />
          </Link>
        </div>
      </div>

      {/* Catalog Grid */}
      <CatalogSection initialBrands={brands as any} />
    </div>
  );
}
