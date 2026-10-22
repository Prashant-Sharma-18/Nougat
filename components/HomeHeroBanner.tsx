"use client";

import React from "react";
import Link from "next/link";
import { useUser } from "./UserContext";
import { formatPoints, pointsToDollars } from "@/lib/utils";
import { getUserTier } from "@/lib/loyalty/tiers";
import { 
  ShieldCheck, 
  Wallet, 
  ArrowRight,
  Zap, 
  Lock, 
  Globe2,
  Building2,
  Users,
  CreditCard,
  User as UserIcon,
  Sparkles
} from "lucide-react";

export default function HomeHeroBanner() {
  const { currentUser, isEnterprise, setPortalMode } = useUser();
  const balance = currentUser?.pointBalance ?? 0;
  const userTier = getUserTier(balance);

  if (isEnterprise) {
    return (
      <div className="bg-white rounded-2xl border border-zinc-200 p-8 sm:p-10 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          {/* Left Column: Enterprise Value Prop */}
          <div className="max-w-2xl space-y-3.5">
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-950 text-white text-xs font-mono">
                <Building2 className="h-3.5 w-3.5" />
                <span>Enterprise Rewards & Workforce Incentives</span>
              </div>
              <button
                onClick={() => setPortalMode("GENERAL")}
                className="text-[11px] font-mono text-zinc-500 hover:text-zinc-900 underline"
              >
                Switch to Personal View
              </button>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950 leading-tight">
              Automated Corporate Rewards & Team Spot Bonuses.
            </h1>

            <p className="text-sm text-zinc-600 leading-relaxed">
              Disburse employee spot recognitions, milestone bonuses, and customer gift incentives in batch. Built with double-entry ledger auditing, corporate credit card co-pay, and Tremendous API multi-provider failover.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-mono text-zinc-500">
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-zinc-400" />
                <span>CSV Spreadsheet Team Import</span>
              </div>
              <span className="text-zinc-300">•</span>
              <div className="flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5 text-zinc-400" />
                <span>Split Corporate Card Co-Pay</span>
              </div>
              <span className="text-zinc-300">•</span>
              <div className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-zinc-400" />
                <span>ACID Atomic Isolation</span>
              </div>
            </div>
          </div>

          {/* Right Column: Enterprise Telemetry Box */}
          <div className="lg:w-80 shrink-0 bg-zinc-50 rounded-xl border border-zinc-200 p-5 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-2.5">
              <div>
                <span className="text-[10px] uppercase text-zinc-500 tracking-wider block">Enterprise Workspace</span>
                <span className="font-bold text-zinc-900 text-xs">Acme Corp [ORG-8821]</span>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-950 text-white font-semibold">
                ACTIVE
              </span>
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-zinc-600">
                <span>Corporate Rewards Pool</span>
                <span className="font-semibold text-zinc-950">{formatPoints(balance)} pts</span>
              </div>
              <div className="flex justify-between items-center text-zinc-600">
                <span>Settlement Gateway</span>
                <span className="font-semibold text-zinc-950">Tremendous API</span>
              </div>
              <div className="flex justify-between items-center text-zinc-600">
                <span>Credit Co-Pay Line</span>
                <span className="font-semibold text-zinc-950">$25,000 Authorized</span>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-200 space-y-2">
              <Link
                href="/bulk-rewards"
                className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-sans font-medium transition-colors shadow-xs"
              >
                <Users className="h-3.5 w-3.5" />
                <span>Launch Bulk Rewards Batch</span>
                <ArrowRight className="h-3 w-3 text-zinc-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Personal (General Consumer) Mode
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-8 sm:p-10 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        {/* Left Column: Personal Consumer Value Prop */}
        <div className="max-w-2xl space-y-3.5">
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-800 text-xs font-mono">
              <UserIcon className="h-3.5 w-3.5 text-zinc-600" />
              <span>Personal Loyalty Rewards Club</span>
            </div>
            <button
              onClick={() => setPortalMode("ENTERPRISE")}
              className="text-[11px] font-mono text-zinc-500 hover:text-zinc-900 underline"
            >
              Switch to Enterprise Mode
            </button>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950 leading-tight">
            Earn Loyalty Points. <br />
            Redeem Real Digital Gift Cards.
          </h1>

          <p className="text-sm text-zinc-600 leading-relaxed">
            Convert your retail loyalty points into real digital vouchers for Amazon, Apple, Starbucks, and over 100 global merchants with instant barcode delivery.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-mono text-zinc-500">
            <div className="flex items-center gap-1.5">
              <Globe2 className="h-3.5 w-3.5 text-zinc-400" />
              <span>100 Points = $1.00 USD</span>
            </div>
            <span className="text-zinc-300">•</span>
            <div className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-zinc-400" />
              <span>Instant Barcode & Mobile Pass</span>
            </div>
            <span className="text-zinc-300">•</span>
            <div className="flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5 text-zinc-400" />
              <span>In-Store Merchant POS Checkout</span>
            </div>
          </div>
        </div>

        {/* Right Column: Personal Member Account Box */}
        <div className="lg:w-80 shrink-0 bg-zinc-50 rounded-xl border border-zinc-200 p-5 space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-2.5">
            <div>
              <span className="text-[10px] uppercase text-zinc-500 tracking-wider block">Member Account</span>
              <span className="font-bold text-zinc-900 text-xs truncate max-w-[160px] block">
                {currentUser?.name || "Personal Member"}
              </span>
            </div>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${userTier.badgeColor}`}>
              {userTier.displayName}
            </span>
          </div>

          <div className="space-y-2.5">
            <div className="flex justify-between items-center text-zinc-600">
              <span>Personal Point Balance</span>
              <span className="font-semibold text-zinc-950">{formatPoints(balance)} pts</span>
            </div>
            <div className="flex justify-between items-center text-zinc-600">
              <span>Redemption Value</span>
              <span className="font-semibold text-zinc-950">${pointsToDollars(balance).toFixed(2)} USD</span>
            </div>
            <div className="flex justify-between items-center text-zinc-600">
              <span>Active Multiplier</span>
              <span className="font-semibold text-zinc-950">{userTier.earnMultiplier}x Shopping Bonus</span>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-200">
            <Link
              href="/wallet"
              className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-sans font-medium transition-colors shadow-xs"
            >
              <Wallet className="h-3.5 w-3.5" />
              <span>Open My Digital Wallet</span>
              <ArrowRight className="h-3 w-3 text-zinc-400" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

