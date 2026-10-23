"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "./UserContext";
import { formatPoints, pointsToDollars } from "@/lib/utils";
import { getUserTier } from "@/lib/loyalty/tiers";
import { formatWithFx } from "@/lib/currency/fx";
import { 
  Wallet, 
  Plus, 
  ArrowRight, 
  Sparkles, 
  Gift, 
  ShoppingBag, 
  Coins, 
  History, 
  ChevronRight,
  ShieldCheck,
  CreditCard,
  Search,
  ExternalLink,
  Tag
} from "lucide-react";
import EarnSimulatorModal from "./EarnSimulatorModal";
import { BuyPointsModal } from "./BuyPointsModal";
import RedemptionModal from "./RedemptionModal";
import ClaimSuccessModal from "./ClaimSuccessModal";

interface BrandItem {
  id: string;
  name: string;
  description: string;
  logoUrl?: string;
  minAmount: number;
  maxAmount: number;
  currency: string;
  category?: string;
  customAllowed: boolean;
  fixedValues?: string;
}

export default function PersonalDashboardView({ initialBrands }: { initialBrands: BrandItem[] }) {
  const { currentUser, currentCurrency, refreshUserData } = useUser();
  const [earnModalOpen, setEarnModalOpen] = useState(false);
  const [buyPointsModalOpen, setBuyPointsModalOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<BrandItem | null>(null);
  const [successOrderData, setSuccessOrderData] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const balance = currentUser?.pointBalance ?? 0;
  const dollarEquivalent = pointsToDollars(balance);
  const userTier = getUserTier(balance);

  // Categories for personal consumer shopping
  const categories = [
    { id: "ALL", label: "All Brands" },
    { id: "RETAIL", label: "Retail & Shopping" },
    { id: "DINING", label: "Dining & Coffee" },
    { id: "ENTERTAINMENT", label: "Entertainment" },
    { id: "TRAVEL", label: "Travel & Rides" },
  ];

  // Helper to categorize brands
  const getBrandCategory = (brand: BrandItem): string => {
    const name = brand.name.toLowerCase();
    if (name.includes("starbucks") || name.includes("uber eats") || name.includes("doordash") || name.includes("chipotle")) {
      return "DINING";
    }
    if (name.includes("apple") || name.includes("netflix") || name.includes("spotify") || name.includes("playstation")) {
      return "ENTERTAINMENT";
    }
    if (name.includes("uber") || name.includes("airbnb") || name.includes("delta")) {
      return "TRAVEL";
    }
    return "RETAIL";
  };

  const filteredBrands = initialBrands.filter((b) => {
    const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.description?.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (selectedCategory === "ALL") return true;
    return getBrandCategory(b) === selectedCategory;
  });

  return (
    <div className="space-y-8">
      {/* Personal Member Welcome & VIP Tier Card */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Member Greeting */}
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-zinc-100 text-zinc-800 border border-zinc-200">
                Personal Consumer Account
              </span>
              <span className="text-[11px] font-mono text-zinc-500">
                Member ID: {currentUser?.id?.slice(0, 8) || "MEMBER"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">
              Welcome back, {currentUser?.name || "Member"}.
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
              Redeem your personal loyalty points for instant digital gift cards, track tier discounts, and store voucher pass codes in your private digital wallet.
            </p>
          </div>

          {/* Points & Quick Actions Card */}
          <div className="lg:w-96 shrink-0 bg-zinc-50 rounded-xl border border-zinc-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-2.5">
              <div>
                <span className="text-[10px] uppercase font-mono text-zinc-500 tracking-wider block">
                  Available Points
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-zinc-950">
                    {formatPoints(balance)}
                  </span>
                  <span className="text-xs font-mono text-zinc-500">pts</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-mono text-zinc-500 tracking-wider block">
                  Cash Value
                </span>
                <span className="text-sm font-semibold font-mono text-zinc-900">
                  {formatWithFx(dollarEquivalent, currentCurrency)}
                </span>
              </div>
            </div>

            {/* VIP Tier Progress Strip */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-semibold text-zinc-900 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-zinc-700" />
                  <span>{userTier.displayName} Tier</span>
                </span>
                <span className="text-zinc-500 text-[11px]">
                  {userTier.discountPercentage > 0 ? `${userTier.discountPercentage}% Discount` : "Standard Rate"}
                </span>
              </div>
              <div className="h-1.5 w-full bg-zinc-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-zinc-900 rounded-full transition-all" 
                  style={{ width: `${Math.min(100, Math.max(15, (balance / 50000) * 100))}%` }} 
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                <span>{userTier.earnMultiplier}x Point Multiplier</span>
                <span>Next Tier at 50,000 pts</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-2 border-t border-zinc-200 grid grid-cols-2 gap-2">
              <button
                onClick={() => setEarnModalOpen(true)}
                className="py-1.5 px-3 rounded-lg border border-zinc-200 hover:bg-zinc-100 text-zinc-800 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="h-3 w-3" />
                <span>Earn Points</span>
              </button>

              <button
                onClick={() => setBuyPointsModalOpen(true)}
                className="py-1.5 px-3 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Coins className="h-3 w-3" />
                <span>Buy Points</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Navigation Quick-Links Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/wallet"
          className="p-4 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors shadow-xs flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-zinc-100 text-zinc-900 flex items-center justify-center">
              <Wallet className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-zinc-950 block">My Digital Wallet</span>
              <span className="text-[11px] text-zinc-500">View active vouchers & pass codes</span>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
        </Link>

        <Link
          href="/history"
          className="p-4 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors shadow-xs flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-zinc-100 text-zinc-900 flex items-center justify-center">
              <History className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-zinc-950 block">Personal Point Activity</span>
              <span className="text-[11px] text-zinc-500">Track earnings, redemptions & bonuses</span>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
        </Link>

        <button
          onClick={() => setEarnModalOpen(true)}
          className="p-4 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors shadow-xs flex items-center justify-between group text-left"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-zinc-100 text-zinc-900 flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-zinc-950 block">Loyalty Multipliers</span>
              <span className="text-[11px] text-zinc-500">{userTier.earnMultiplier}x bonus on daily purchases</span>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
        </button>
      </div>

      {/* Personal Consumer Gift Card Catalog */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div>
            <h2 className="text-xl font-bold text-zinc-950 tracking-tight flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-zinc-800" />
              <span>Personal Gift Card Catalog</span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
              Choose your favorite brand, pick a denomination, and instantly receive your redemption code.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="h-3.5 w-3.5 absolute left-3 top-3 text-zinc-400" />
            <input
              type="text"
              placeholder="Search brands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-zinc-400"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === c.id
                  ? "bg-zinc-950 text-white shadow-xs"
                  : "border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Brand Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredBrands.map((brand) => (
            <div
              key={brand.id}
              className="bg-white rounded-xl border border-zinc-200 p-4 shadow-xs hover:border-zinc-300 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="h-10 w-10 rounded-lg bg-zinc-100 border border-zinc-200/80 flex items-center justify-center font-bold text-xs text-zinc-800">
                    {brand.name.slice(0, 2).toUpperCase()}
                  </div>
                  {userTier.discountPercentage > 0 && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-zinc-900 text-white font-medium">
                      -{userTier.discountPercentage}% VIP
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-zinc-950 leading-tight">{brand.name}</h3>
                  <p className="text-[11px] text-zinc-500 line-clamp-2 mt-1">
                    {brand.description || "Digital gift card with instant barcode reveal."}
                  </p>
                </div>

                <div className="text-[11px] font-mono text-zinc-600">
                  ${brand.minAmount} – ${brand.maxAmount} {brand.currency}
                </div>
              </div>

              <button
                onClick={() => setSelectedBrand(brand)}
                className="w-full py-2 px-3 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Gift className="h-3.5 w-3.5" />
                <span>Redeem Gift Card</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      <EarnSimulatorModal isOpen={earnModalOpen} onClose={() => setEarnModalOpen(false)} />
      <BuyPointsModal isOpen={buyPointsModalOpen} onClose={() => setBuyPointsModalOpen(false)} />
      {selectedBrand && (
        <RedemptionModal
          brand={selectedBrand as any}
          isOpen={Boolean(selectedBrand)}
          onClose={() => setSelectedBrand(null)}
          onSuccess={(orderData) => {
            setSelectedBrand(null);
            setSuccessOrderData(orderData);
            refreshUserData();
          }}
        />
      )}

      {successOrderData && (
        <ClaimSuccessModal
          orderData={successOrderData}
          onClose={() => setSuccessOrderData(null)}
        />
      )}
    </div>
  );
}

