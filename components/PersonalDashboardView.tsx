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
  Tag,
  Copy,
  Check,
  CheckCircle2,
  Sliders,
  Barcode,
  Wifi,
  Zap,
  ArrowUpRight
} from "lucide-react";
import EarnSimulatorModal from "./EarnSimulatorModal";
import { BuyPointsModal } from "./BuyPointsModal";
import RedemptionModal from "./RedemptionModal";
import ClaimSuccessModal from "./ClaimSuccessModal";
import { fetchPromotionsData } from "@/actions/promotions";

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
  const [activeBanner, setActiveBanner] = useState<any | null>(null);
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);

  const balance = currentUser?.pointBalance ?? 0;
  const dollarEquivalent = pointsToDollars(balance);
  const userTier = getUserTier(balance);

  useEffect(() => {
    async function loadBanner() {
      try {
        const promos = await fetchPromotionsData();
        const banner = promos.banners.find((b) => b.isActive && (b.targetAudience === "PERSONAL" || b.targetAudience === "ALL"));
        if (banner) setActiveBanner(banner);
      } catch (e) {
        // Non-blocking banner fetch
      }
    }
    loadBanner();
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    setTimeout(() => setCopiedCoupon(null), 2500);
  };

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
      {/* 2026 Modern Hero Section: Account Telemetry & Tier Summary */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 sm:p-8 shadow-xs card-hover-subtle">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          {/* Member Overview */}
          <div className="space-y-3 max-w-xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-zinc-950 text-white font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                Personal Rewards Portal
              </span>
              <span className="text-[11px] font-mono text-zinc-500">
                Member ID: {currentUser?.id?.slice(0, 8) || "MEMBER"}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950 leading-tight">
              Instant Gift Cards & Point Redemptions.
            </h1>

            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
              Convert your rewards balance into verified merchant gift cards. Experience instant digital barcode generation, VIP tier multipliers, and double-entry vault security.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] font-mono text-zinc-500">
              <span className="flex items-center gap-1.5 text-zinc-800">
                <CheckCircle2 className="h-3.5 w-3.5 text-zinc-950" />
                <span>Zero Transaction Fees</span>
              </span>
              <span className="flex items-center gap-1.5 text-zinc-800">
                <CheckCircle2 className="h-3.5 w-3.5 text-zinc-950" />
                <span>Instant In-App Barcode</span>
              </span>
              <span className="flex items-center gap-1.5 text-zinc-800">
                <CheckCircle2 className="h-3.5 w-3.5 text-zinc-950" />
                <span>Apple Wallet Pass Compatible</span>
              </span>
            </div>
          </div>

          {/* Points & VIP Tier Cockpit Card */}
          <div className="lg:w-96 shrink-0 bg-zinc-50 rounded-2xl border border-zinc-200 p-5 space-y-4 shadow-xs">
            <div className="flex items-start justify-between border-b border-zinc-200/80 pb-3">
              <div>
                <span className="text-[10px] uppercase font-mono text-zinc-500 tracking-wider block">
                  Available Rewards Balance
                </span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-3xl font-bold font-mono text-zinc-950 tabular-nums tracking-tight">
                    {formatPoints(balance)}
                  </span>
                  <span className="text-xs font-mono font-medium text-zinc-500">pts</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-mono text-zinc-500 tracking-wider block">
                  Cash Value
                </span>
                <span className="text-base font-semibold font-mono text-zinc-900 tabular-nums block mt-0.5">
                  {formatWithFx(dollarEquivalent, currentCurrency)}
                </span>
              </div>
            </div>

            {/* VIP Tier Progress Strip */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-semibold text-zinc-900 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-zinc-800" />
                  <span>{userTier.displayName} Tier</span>
                </span>
                <span className="text-zinc-600 text-[11px] font-medium">
                  {userTier.discountPercentage > 0 ? `${userTier.discountPercentage}% Discount Active` : "Base Rate"}
                </span>
              </div>

              <div className="h-2 w-full bg-zinc-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-zinc-950 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, Math.max(12, (balance / 50000) * 100))}%` }} 
                />
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                <span>{userTier.earnMultiplier}x Multiplier on spend</span>
                <span>{userTier.nextTierName ? `Next: ${userTier.nextTierName}` : "Top Tier VIP"}</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-2 border-t border-zinc-200/80 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setEarnModalOpen(true)}
                className="py-2 px-3 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-900 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Plus className="h-3.5 w-3.5 text-zinc-700" />
                <span>Earn Simulator</span>
              </button>

              <button
                type="button"
                onClick={() => setBuyPointsModalOpen(true)}
                className="py-2 px-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Coins className="h-3.5 w-3.5 text-zinc-300" />
                <span>Top Up Card</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Merchandising Hero Banner (Admin Managed) */}
      {activeBanner && (
        <div className="bg-zinc-950 rounded-2xl p-6 sm:p-7 text-white border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xs relative overflow-hidden">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-zinc-800 text-zinc-200 border border-zinc-700">
                {activeBanner.badge}
              </span>
              <span className="text-[11px] font-mono text-zinc-400">Exclusive Loyalty Offer</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {activeBanner.title}
            </h2>

            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              {activeBanner.subtitle}
            </p>

            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] font-mono text-zinc-400">Checkout Promo Code:</span>
              <button
                type="button"
                onClick={() => handleCopyCode("SAVE10")}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-mono text-zinc-200 transition-colors"
                title="Click to copy coupon code"
              >
                <Tag className="h-3 w-3 text-zinc-400" />
                <span className="font-bold">SAVE10</span>
                {copiedCoupon === "SAVE10" ? (
                  <Check className="h-3 w-3 text-white" />
                ) : (
                  <Copy className="h-3 w-3 text-zinc-400" />
                )}
              </button>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <Link
              href={activeBanner.ctaLink}
              className="py-3 px-5 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-xs"
            >
              <span>{activeBanner.ctaText}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Modern 2026 Quick Navigation Hub */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/wallet"
          className="p-5 rounded-2xl border border-zinc-200 bg-white hover:border-zinc-300 transition-all shadow-xs flex items-center justify-between group card-hover-subtle"
        >
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-900 flex items-center justify-center shrink-0">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-zinc-950 block">My Digital Wallet</span>
              <span className="text-xs text-zinc-500">View voucher codes & Apple Pass</span>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:text-zinc-950 transition-colors" />
        </Link>

        <Link
          href="/orders"
          className="p-5 rounded-2xl border border-zinc-200 bg-white hover:border-zinc-300 transition-all shadow-xs flex items-center justify-between group card-hover-subtle"
        >
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-900 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-zinc-950 block">Order Delivery Status</span>
              <span className="text-xs text-zinc-500">Real-time fulfillment & tracking</span>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:text-zinc-950 transition-colors" />
        </Link>

        <Link
          href="/profile"
          className="p-5 rounded-2xl border border-zinc-200 bg-white hover:border-zinc-300 transition-all shadow-xs flex items-center justify-between group card-hover-subtle"
        >
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-900 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-zinc-950 block">VIP Tier Perks</span>
              <span className="text-xs text-zinc-500">{userTier.displayName} • {userTier.earnMultiplier}x Multiplier</span>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:text-zinc-950 transition-colors" />
        </Link>
      </div>

      {/* Gift Card Catalog Header, Search & Filter Bar */}
      <div className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-zinc-100 text-zinc-700 border border-zinc-200">
                Catalog v2.6
              </span>
              <span className="text-[11px] font-mono text-zinc-500">
                {filteredBrands.length} Verified Brands Available
              </span>
            </div>
            <h2 className="text-2xl font-bold text-zinc-950 tracking-tight mt-1 flex items-center gap-2">
              <ShoppingBag className="h-6 w-6 text-zinc-900" />
              <span>Digital Gift Card Showcase</span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
              Select any merchant card below to customize denominations and instantly redeem with points.
            </p>
          </div>

          {/* Search Box with Modern 2026 Keyboard Badge */}
          <div className="relative w-full md:w-80">
            <Search className="h-4 w-4 absolute left-3.5 top-3 text-zinc-400" />
            <input
              type="text"
              placeholder="Filter by brand or merchant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-12 py-2.5 rounded-xl border border-zinc-200 bg-white text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 shadow-xs"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-xs text-zinc-400 hover:text-zinc-700"
              >
                Clear
              </button>
            ) : (
              <span className="absolute right-3 top-2.5 px-1.5 py-0.5 rounded border border-zinc-200 bg-zinc-50 text-[10px] font-mono text-zinc-400">
                /
              </span>
            )}
          </div>
        </div>

        {/* Category Pills Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {categories.map((c) => {
            const count = c.id === "ALL" 
              ? initialBrands.length 
              : initialBrands.filter((b) => getBrandCategory(b) === c.id).length;
            const isSelected = selectedCategory === c.id;

            return (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                  isSelected
                    ? "bg-zinc-950 text-white shadow-xs"
                    : "border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
                }`}
              >
                <span>{c.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isSelected ? "bg-zinc-800 text-zinc-200" : "bg-zinc-100 text-zinc-500"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* 2026 Realistic Gift Card Mockup Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredBrands.map((brand) => {
            const initials = brand.name.slice(0, 2).toUpperCase();
            const minPoints = brand.minAmount * 100;

            return (
              <div
                key={brand.id}
                className="group bg-white rounded-2xl border border-zinc-200 p-4 shadow-xs hover:border-zinc-400 transition-all flex flex-col justify-between space-y-4 card-hover-subtle"
              >
                <div className="space-y-3.5">
                  {/* Card Mockup Visual with 1.586 Card Ratio */}
                  <div className="w-full aspect-[1.586/1] bg-zinc-950 rounded-xl p-3.5 text-white flex flex-col justify-between border border-zinc-800 shadow-xs relative overflow-hidden group-hover:border-zinc-700 transition-colors">
                    {/* Top Row: Brand Monogram & Contactless Icon */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded bg-white text-zinc-950 font-bold text-[10px] font-mono flex items-center justify-center shrink-0">
                          {initials}
                        </div>
                        <span className="font-bold text-xs tracking-tight text-white truncate max-w-[120px]">
                          {brand.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-zinc-400">
                        <Wifi className="h-3 w-3 rotate-90" />
                        <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-400">
                          PASS
                        </span>
                      </div>
                    </div>

                    {/* Middle: Brand Display & Denomination Preview */}
                    <div className="py-1">
                      <span className="text-[10px] font-mono uppercase text-zinc-400 block tracking-wider">
                        Stored Value
                      </span>
                      <div className="text-base font-bold font-mono text-white tracking-tight">
                        ${brand.minAmount} – ${brand.maxAmount} {brand.currency}
                      </div>
                    </div>

                    {/* Bottom Row: Masked Card Identifier & Instant Badge */}
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 border-t border-zinc-800/80 pt-1.5">
                      <div className="flex items-center gap-1.5">
                        <Barcode className="h-3 w-3 text-zinc-400" />
                        <span>•••• 2026</span>
                      </div>
                      <span className="text-[9px] text-zinc-300 font-semibold uppercase">
                        Instant Delivery
                      </span>
                    </div>
                  </div>

                  {/* Brand Metadata & VIP Discount */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="text-sm font-bold text-zinc-950 leading-tight">
                        {brand.name}
                      </h3>
                      {userTier.discountPercentage > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase font-semibold bg-zinc-950 text-white">
                          -{userTier.discountPercentage}% VIP
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-zinc-500 line-clamp-2 leading-snug">
                      {brand.description || "Digital gift card with barcode reveal for in-store or online checkout."}
                    </p>

                    <div className="flex items-center justify-between text-[11px] font-mono text-zinc-600 pt-1">
                      <span>Starting from:</span>
                      <span className="font-semibold text-zinc-900">
                        {minPoints.toLocaleString()} pts (${brand.minAmount})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Redeem Action Button */}
                <button
                  type="button"
                  onClick={() => setSelectedBrand(brand)}
                  className="w-full py-2.5 px-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Gift className="h-3.5 w-3.5 text-zinc-300" />
                  <span>Redeem Gift Card</span>
                  <ArrowRight className="h-3 w-3 text-zinc-400 ml-0.5" />
                </button>
              </div>
            );
          })}
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

