"use client";

import React, { useState, useMemo } from "react";
import { BrandItem } from "./RedemptionModal";
import RedemptionModal from "./RedemptionModal";
import ClaimSuccessModal from "./ClaimSuccessModal";
import { useUser } from "./UserContext";
import { formatPoints, dollarsToPoints } from "@/lib/utils";
import { formatWithFx } from "@/lib/currency/fx";
import { 
  Search, 
  Gift, 
  ChevronRight, 
  ArrowUpDown, 
  Check, 
  SlidersHorizontal, 
  X,
  CreditCard 
} from "lucide-react";

interface CatalogSectionProps {
  initialBrands: BrandItem[];
}

const CATEGORIES = ["All", "Retail", "Food & Drink", "Tech", "Entertainment", "Travel"];

type SortOption = "featured" | "points-asc" | "points-desc" | "name-asc";

export default function CatalogSection({ initialBrands }: CatalogSectionProps) {
  const { currentUser, currentCurrency } = useUser();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyAffordable, setOnlyAffordable] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("featured");
  const [activeBrandForRedemption, setActiveBrandForRedemption] = useState<BrandItem | null>(null);
  const [successOrderData, setSuccessOrderData] = useState<any | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const userBalance = currentUser?.pointBalance ?? 0;

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: initialBrands.length };
    CATEGORIES.forEach((cat) => {
      if (cat !== "All") {
        counts[cat] = initialBrands.filter(
          (b) => b.category.toLowerCase() === cat.toLowerCase()
        ).length;
      }
    });
    return counts;
  }, [initialBrands]);

  // Affordable count
  const affordableCount = useMemo(() => {
    return initialBrands.filter((b) => {
      const minPoints = dollarsToPoints(b.denominations[0] || 10);
      return minPoints <= userBalance;
    }).length;
  }, [initialBrands, userBalance]);

  // Filtering
  const filteredBrands = useMemo(() => {
    let result = initialBrands.filter((brand) => {
      const matchesCategory =
        selectedCategory === "All" ||
        brand.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch =
        brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        brand.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const minPoints = dollarsToPoints(brand.denominations[0] || 10);
      const matchesAffordability = !onlyAffordable || minPoints <= userBalance;

      return matchesCategory && matchesSearch && matchesAffordability;
    });

    // Sorting
    switch (sortBy) {
      case "points-asc":
        result.sort((a, b) => {
          const aMin = dollarsToPoints(a.denominations[0] || 10);
          const bMin = dollarsToPoints(b.denominations[0] || 10);
          return aMin - bMin;
        });
        break;
      case "points-desc":
        result.sort((a, b) => {
          const aMin = dollarsToPoints(a.denominations[0] || 10);
          const bMin = dollarsToPoints(b.denominations[0] || 10);
          return bMin - aMin;
        });
        break;
      case "name-asc":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "featured":
      default:
        // Keep initial order
        break;
    }

    return result;
  }, [initialBrands, selectedCategory, searchQuery, onlyAffordable, sortBy, userBalance]);

  const handleImageError = (brandId: string) => {
    setFailedImages((prev) => ({ ...prev, [brandId]: true }));
  };

  const getBrandInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <section className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs space-y-3.5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search brands or categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs sm:text-sm focus:border-zinc-400 focus:bg-white focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Affordability Toggle & Sort Controls */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap justify-between md:justify-end">
            {/* Affordability Toggle */}
            <button
              onClick={() => setOnlyAffordable(!onlyAffordable)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-2 whitespace-nowrap ${
                onlyAffordable
                  ? "bg-zinc-950 text-white border-zinc-950 shadow-xs"
                  : "bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100"
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                  onlyAffordable
                    ? "bg-white border-white text-zinc-950"
                    : "border-zinc-400 bg-white"
                }`}
              >
                {onlyAffordable && <Check className="h-2.5 w-2.5 stroke-[3]" />}
              </div>
              <span>Affordable with my balance ({affordableCount})</span>
            </button>

            {/* Sort Dropdown */}
            <div className="relative flex items-center">
              <label htmlFor="catalog-sort" className="sr-only">Sort catalog</label>
              <ArrowUpDown className="absolute left-2.5 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
              <select
                id="catalog-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="pl-8 pr-7 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-700 font-medium focus:border-zinc-400 focus:outline-none cursor-pointer appearance-none"
              >
                <option value="featured">Featured Order</option>
                <option value="points-asc">Points: Low to High</option>
                <option value="points-desc">Points: High to Low</option>
                <option value="name-asc">Brand: A to Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              const count = categoryCounts[cat] ?? 0;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-zinc-950 text-white font-semibold shadow-xs"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900"
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`text-[10px] font-mono px-1 rounded ${
                      isSelected
                        ? "bg-zinc-800 text-zinc-300"
                        : "bg-zinc-200 text-zinc-600"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="hidden sm:block text-[11px] font-mono text-zinc-400 shrink-0">
            Showing {filteredBrands.length} of {initialBrands.length}
          </div>
        </div>
      </div>

      {/* Brands Grid */}
      {filteredBrands.length === 0 ? (
        <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center shadow-xs">
          <Gift className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-zinc-900">No matching gift cards</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            {onlyAffordable
              ? "You do not currently have enough points for cards in this filter. Try earning points or turning off the affordability toggle."
              : "Try adjusting your search query or selecting another category."}
          </p>
          {(searchQuery || onlyAffordable || selectedCategory !== "All") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setOnlyAffordable(false);
                setSelectedCategory("All");
              }}
              className="mt-4 px-3.5 py-1.5 rounded-lg bg-zinc-950 text-white text-xs font-medium hover:bg-zinc-800 transition-colors"
            >
              Reset all filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBrands.map((brand) => {
            const minPoints = dollarsToPoints(brand.denominations[0] || 10);
            const canAfford = userBalance >= minPoints;
            const pointsNeeded = minPoints - userBalance;
            const hasImageError = failedImages[brand.id];

            return (
              <div
                key={brand.id}
                className="group bg-white rounded-xl border border-zinc-200 hover:border-zinc-400 hover:shadow-xs transition-all duration-200 overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Card Image Banner */}
                  <div className="h-36 w-full relative overflow-hidden bg-zinc-900 border-b border-zinc-100 flex items-center justify-center">
                    {!hasImageError ? (
                      <img
                        src={brand.logoUrl}
                        alt={brand.name}
                        onError={() => handleImageError(brand.id)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      /* Monogram Fallback Banner */
                      <div className="w-full h-full bg-zinc-900 flex flex-col items-center justify-center text-zinc-100">
                        <span className="text-2xl font-mono font-bold tracking-widest text-zinc-300">
                          {getBrandInitials(brand.name)}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500 uppercase mt-1">
                          Official Merchant Partner
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/35 pointer-events-none" />
                    
                    {/* Category badge */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-zinc-950/85 backdrop-blur text-zinc-200 border border-zinc-700">
                        {brand.category}
                      </span>
                    </div>

                    {/* Brand title on image */}
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <h4 className="font-semibold text-base tracking-tight truncate">
                        {brand.name}
                      </h4>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-3">
                    <p className="text-xs text-zinc-600 line-clamp-2 leading-relaxed">
                      {brand.description}
                    </p>

                    {/* Denominations */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
                          Denominations
                        </span>
                        {canAfford ? (
                          <span className="text-[10px] font-mono font-medium text-zinc-700 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">
                            In Budget
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-zinc-400">
                            +{formatPoints(pointsNeeded)} pts needed
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {brand.denominations.map((d) => (
                          <span
                            key={d}
                            className="px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-mono"
                          >
                            {currentCurrency === "USD" ? `$${d}` : formatWithFx(d, currentCurrency)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-4 py-3 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-zinc-400 block font-mono">From</span>
                    <span className="text-xs font-bold font-mono text-zinc-950">
                      {formatPoints(minPoints)} pts
                    </span>
                  </div>

                  <button
                    onClick={() => setActiveBrandForRedemption(brand)}
                    className="px-3 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-medium transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <span>Redeem</span>
                    <ChevronRight className="h-3 w-3 text-zinc-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal 1: Redemption Selection */}
      {activeBrandForRedemption && (
        <RedemptionModal
          brand={activeBrandForRedemption}
          isOpen={!!activeBrandForRedemption}
          onClose={() => setActiveBrandForRedemption(null)}
          onSuccess={(orderData) => {
            setActiveBrandForRedemption(null);
            setSuccessOrderData(orderData);
          }}
        />
      )}

      {/* Modal 2: Success & Instant Digital Delivery */}
      {successOrderData && (
        <ClaimSuccessModal
          orderData={successOrderData}
          onClose={() => setSuccessOrderData(null)}
        />
      )}
    </section>
  );
}
