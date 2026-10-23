"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "./UserContext";
import { formatPoints, pointsToDollars } from "@/lib/utils";
import { getUserTier } from "@/lib/loyalty/tiers";
import { 
  Gift, 
  Wallet, 
  Coins, 
  History, 
  ShieldCheck, 
  ChevronDown, 
  User as UserIcon,
  Plus,
  Check,
  CreditCard,
  Users,
  Sliders,
  FileSpreadsheet,
  Building2,
  Briefcase,
  Globe2,
  LogIn
} from "lucide-react";
import EarnSimulatorModal from "./EarnSimulatorModal";
import NotificationCenter from "./NotificationCenter";
import CurrencySelector from "./CurrencySelector";
import { formatWithFx } from "@/lib/currency/fx";
import { BuyPointsModal } from "./BuyPointsModal";

export default function Navbar() {
  const pathname = usePathname();
  const { 
    currentUser, 
    users, 
    switchUser, 
    currentCurrency, 
    portalMode, 
    setPortalMode, 
    isEnterprise 
  } = useUser();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);
  const [earnModalOpen, setEarnModalOpen] = useState(false);
  const [buyPointsModalOpen, setBuyPointsModalOpen] = useState(false);

  const userDropdownRef = useRef<HTMLDivElement>(null);
  const toolsDropdownRef = useRef<HTMLDivElement>(null);

  const balance = currentUser?.pointBalance ?? 0;
  const dollarEquivalent = pointsToDollars(balance);
  const userTier = getUserTier(balance);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (toolsDropdownRef.current && !toolsDropdownRef.current.contains(event.target as Node)) {
        setToolsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Primary navigation links dynamically tailored by Portal Mode
  const primaryLinks = isEnterprise
    ? [
        { href: "/", label: "Catalog" },
        { href: "/wallet", label: "Corporate Wallet" },
        { href: "/bulk-rewards", label: "Bulk Rewards" },
        { href: "/history", label: "Settlement Ledger" },
      ]
    : [
        { href: "/", label: "Gift Cards" },
        { href: "/wallet", label: "My Wallet" },
        { href: "/history", label: "Point Activity" },
      ];

  // Secondary operator / merchant tools
  const toolsLinks = isEnterprise
    ? [
        { href: "/orders", label: "Order Audit Logs", icon: ShieldCheck, desc: "Double-entry fulfillment logs" },
        { href: "/scanner", label: "Merchant POS Terminal", icon: CreditCard, desc: "Scan and debit card balances" },
        { href: "/admin", label: "Admin Console", icon: Sliders, desc: "Catalog & circulating supply" },
        { href: "/marketing", label: "Platform Overview", icon: Globe2, desc: "Architecture & feature specs" },
      ]
    : [
        { href: "/orders", label: "Order Receipts", icon: ShieldCheck, desc: "View past redemption receipts" },
        { href: "/bulk-rewards", label: "Bulk Employee Rewards", icon: Building2, desc: "Switch to corporate disbursements" },
        { href: "/scanner", label: "POS Terminal Simulator", icon: CreditCard, desc: "Test in-store barcode redemption" },
        { href: "/marketing", label: "Platform Overview", icon: Globe2, desc: "Features, plans & technical specs" },
      ];

  const isToolsActive = toolsLinks.some((l) => pathname === l.href);

  // Split users into Consumer and Enterprise groups
  const consumerUsers = users.filter((u) => u.role !== "ADMIN" && !u.email.includes("corp") && !u.email.includes("admin"));
  const enterpriseUsers = users.filter((u) => u.role === "ADMIN" || u.email.includes("corp") || u.email.includes("admin"));

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Left: Brand Logo, Mode Toggle & Navigation */}
            <div className="flex items-center gap-5 shrink-0">
              {/* Clean Horizontal Logo with Mode Badge */}
              <Link href="/" className="flex items-center gap-2.5 group whitespace-nowrap">
                <div className="h-8 w-8 rounded-lg bg-zinc-950 flex items-center justify-center text-white shrink-0 shadow-xs">
                  {isEnterprise ? <Building2 className="h-4 w-4" /> : <Gift className="h-4 w-4" />}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm tracking-tight text-zinc-950 font-sans">
                    Nougat
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                      isEnterprise
                        ? "bg-zinc-950 text-white border border-zinc-800"
                        : "bg-zinc-100 text-zinc-700 border border-zinc-200"
                    }`}
                  >
                    {isEnterprise ? "Enterprise" : "Personal"}
                  </span>
                </div>
              </Link>

              {/* Mode Switcher: Personal vs Enterprise */}
              <div className="hidden sm:flex items-center p-0.5 bg-zinc-100 rounded-lg border border-zinc-200 text-xs">
                <button
                  onClick={() => setPortalMode("GENERAL")}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 text-xs whitespace-nowrap ${
                    !isEnterprise
                      ? "bg-white text-zinc-950 font-semibold shadow-xs"
                      : "text-zinc-500 hover:text-zinc-900 font-medium"
                  }`}
                  title="Switch to Personal Consumer Experience"
                >
                  <UserIcon className="h-3 w-3" />
                  <span>Personal</span>
                </button>
                <button
                  onClick={() => setPortalMode("ENTERPRISE")}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 text-xs whitespace-nowrap ${
                    isEnterprise
                      ? "bg-zinc-950 text-white font-semibold shadow-xs"
                      : "text-zinc-500 hover:text-zinc-900 font-medium"
                  }`}
                  title="Switch to Corporate Enterprise Workspace"
                >
                  <Building2 className="h-3 w-3" />
                  <span>Enterprise</span>
                </button>
              </div>

              {/* Primary Navigation Links */}
              <nav className="hidden md:flex items-center gap-1">
                {primaryLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                        isActive
                          ? "bg-zinc-100 text-zinc-950 font-semibold"
                          : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50"
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}

                {/* Operations & Tools Dropdown */}
                <div className="relative" ref={toolsDropdownRef}>
                  <button
                    onClick={() => setToolsDropdownOpen(!toolsDropdownOpen)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                      isToolsActive
                        ? "bg-zinc-100 text-zinc-950 font-semibold"
                        : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50"
                    }`}
                  >
                    <span>{isEnterprise ? "Corporate Tools" : "More"}</span>
                    <ChevronDown className="h-3 w-3 text-zinc-400" />
                  </button>

                  {toolsDropdownOpen && (
                    <div className="absolute left-0 mt-1.5 w-64 bg-white rounded-xl shadow-lg border border-zinc-200 py-1.5 z-50 animate-in fade-in duration-100">
                      <div className="px-3 py-1.5 text-[10px] font-mono uppercase text-zinc-400 border-b border-zinc-100 flex items-center justify-between">
                        <span>{isEnterprise ? "Enterprise Workspace" : "Member Services"}</span>
                        <span className="text-[9px] text-zinc-500">{isEnterprise ? "ORG-8821" : "CONSUMER"}</span>
                      </div>
                      <div className="p-1 space-y-0.5">
                        {toolsLinks.map((tool) => {
                          const Icon = tool.icon;
                          const isToolActive = pathname === tool.href;
                          return (
                            <Link
                              key={tool.href}
                              href={tool.href}
                              onClick={() => setToolsDropdownOpen(false)}
                              className={`flex items-start gap-2.5 p-2 rounded-lg text-left transition-colors ${
                                isToolActive ? "bg-zinc-100 text-zinc-950" : "hover:bg-zinc-50 text-zinc-700"
                              }`}
                            >
                              <Icon className="h-4 w-4 text-zinc-500 shrink-0 mt-0.5" />
                              <div>
                                <span className="block text-xs font-medium text-zinc-900 leading-tight">
                                  {tool.label}
                                </span>
                                <span className="text-[10px] text-zinc-400 font-mono block">
                                  {tool.desc}
                                </span>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </nav>
            </div>

            {/* Right: Actions, Currency, Balance, and User Account */}
            <div className="flex items-center gap-2.5 shrink-0">
              {/* Earn Points Action Button */}
              <button
                onClick={() => setEarnModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-medium whitespace-nowrap transition-colors shadow-xs"
                title="Simulate purchases and point earning events"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Earn Points</span>
              </button>

              {/* Currency Selector (FX) */}
              <CurrencySelector />

              {/* Notification Center */}
              <NotificationCenter />

              {/* Point Balance Pill with Direct Top-Up Trigger */}
              <div className="flex items-center gap-2 px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg whitespace-nowrap">
                <Coins className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
                <span className="font-mono text-xs font-semibold text-zinc-950 tabular-nums">
                  {formatPoints(balance)} <span className="text-[10px] text-zinc-400 font-normal">pts</span>
                </span>
                <span className="text-zinc-300">•</span>
                <span className="font-mono text-xs text-zinc-500 tabular-nums">
                  {formatWithFx(dollarEquivalent, currentCurrency)}
                </span>
                <button
                  type="button"
                  onClick={() => setBuyPointsModalOpen(true)}
                  title={isEnterprise ? "Buy Corporate Allocation" : "Top Up Points via Card"}
                  className="ml-0.5 p-1 rounded bg-zinc-900 hover:bg-zinc-800 text-white transition-colors"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>

              {/* User Switcher Dropdown */}
              <div className="relative" ref={userDropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 transition-colors text-left whitespace-nowrap"
                >
                  <div className="h-6 w-6 rounded-full bg-zinc-950 text-white flex items-center justify-center font-medium text-xs shrink-0">
                    {currentUser?.name ? currentUser.name.charAt(0) : "U"}
                  </div>
                  <div className="hidden lg:flex items-center gap-1.5">
                    <span className="text-xs font-medium text-zinc-900 truncate max-w-[80px]">
                      {currentUser?.name?.split(" ")[0] || "User"}
                    </span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono uppercase ${userTier.badgeColor}`}>
                      {userTier.tier}
                    </span>
                  </div>
                  <ChevronDown className="h-3 w-3 text-zinc-400" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-80 bg-white rounded-xl shadow-lg border border-zinc-200 py-2 z-50 animate-in fade-in duration-100">
                    {/* User Profile & Tier Overview */}
                    <div className="px-3.5 pb-3 border-b border-zinc-100 space-y-2.5">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-semibold text-zinc-950">{currentUser?.name}</p>
                          <p className="text-[11px] text-zinc-500 font-mono truncate">{currentUser?.email}</p>
                          <span className="inline-block mt-0.5 text-[10px] font-mono uppercase text-zinc-500">
                            {isEnterprise ? "Corporate Workspace Account" : "Personal Loyalty Member"}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${userTier.badgeColor}`}>
                          {userTier.displayName}
                        </span>
                      </div>

                      {/* Tier Progress Bar */}
                      <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 space-y-1.5 font-mono text-[11px]">
                        <div className="flex justify-between items-center text-zinc-600">
                          <span className="text-[10px] uppercase font-semibold text-zinc-500">
                            {userTier.nextTierName ? `Progress to ${userTier.nextTierName}` : "Maximum VIP Tier"}
                          </span>
                          <span className="text-[10px] text-zinc-950 font-bold">
                            {userTier.progressPercentage}%
                          </span>
                        </div>

                        <div className="w-full bg-zinc-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-zinc-950 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${userTier.progressPercentage}%` }}
                          />
                        </div>

                        <div className="text-[10px] text-zinc-400 flex justify-between">
                          <span>{formatPoints(balance)} pts</span>
                          {userTier.nextTierName ? (
                            <span>{formatPoints(userTier.pointsToNextTier)} pts needed</span>
                          ) : (
                            <span className="text-zinc-600 font-medium">Top Tier Active</span>
                          )}
                        </div>
                      </div>

                      {/* Tier Active Perks */}
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-400 block">
                          Active Benefits
                        </span>
                        <div className="flex flex-wrap gap-1">
                          <span className="px-1.5 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-800 text-[10px] font-mono">
                            {userTier.earnMultiplier}x Multiplier
                          </span>
                          {userTier.discountPercentage > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-800 text-[10px] font-mono">
                              {userTier.discountPercentage}% Discount
                            </span>
                          )}
                          <span className="px-1.5 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-800 text-[10px] font-mono">
                            {isEnterprise ? "Split Corporate Billing" : "Priority Delivery"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Personal vs Enterprise Mode Switcher in Dropdown */}
                    <div className="px-3.5 py-2 border-b border-zinc-100 bg-zinc-50/50">
                      <span className="text-[10px] font-mono uppercase text-zinc-400 block mb-1.5">
                        Portal Experience Mode
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => {
                            setPortalMode("GENERAL");
                            setUserDropdownOpen(false);
                          }}
                          className={`py-1.5 px-2 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition-colors ${
                            !isEnterprise
                              ? "bg-zinc-950 text-white border-zinc-950 font-semibold"
                              : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                          }`}
                        >
                          <UserIcon className="h-3 w-3" />
                          <span>Personal</span>
                        </button>

                        <button
                          onClick={() => {
                            setPortalMode("ENTERPRISE");
                            setUserDropdownOpen(false);
                          }}
                          className={`py-1.5 px-2 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition-colors ${
                            isEnterprise
                              ? "bg-zinc-950 text-white border-zinc-950 font-semibold"
                              : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                          }`}
                        >
                          <Building2 className="h-3 w-3" />
                          <span>Enterprise</span>
                        </button>
                      </div>
                    </div>

                    {/* Persona Section: Personal Consumers */}
                    <div className="px-3.5 pt-2 pb-1 text-[10px] font-mono uppercase text-zinc-400">
                      Personal Consumers
                    </div>

                    <div className="px-1 space-y-0.5">
                      {consumerUsers.map((u) => {
                        const isCurrent = u.id === currentUser?.id;
                        return (
                          <button
                            key={u.id}
                            onClick={() => {
                              switchUser(u.id);
                              setUserDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors ${
                              isCurrent
                                ? "bg-zinc-100 text-zinc-950 font-semibold"
                                : "text-zinc-700 hover:bg-zinc-50"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-zinc-200 text-zinc-700 flex items-center justify-center font-medium text-[11px]">
                                {(u.name || "U").charAt(0)}
                              </div>
                              <div>
                                <span className="block leading-tight">{u.name || "User"}</span>
                                <span className="text-[10px] text-zinc-400 font-mono">
                                  Personal • {formatPoints(u.pointBalance)} pts
                                </span>
                              </div>
                            </div>
                            {isCurrent && <Check className="h-3.5 w-3.5 text-zinc-950" />}
                          </button>
                        );
                      })}
                    </div>

                    {/* Persona Section: Enterprise Accounts */}
                    <div className="px-3.5 pt-2 pb-1 text-[10px] font-mono uppercase text-zinc-400 border-t border-zinc-100 mt-1">
                      Enterprise Workspaces
                    </div>

                    <div className="px-1 space-y-0.5">
                      {enterpriseUsers.map((u) => {
                        const isCurrent = u.id === currentUser?.id;
                        return (
                          <button
                            key={u.id}
                            onClick={() => {
                              switchUser(u.id);
                              setUserDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors ${
                              isCurrent
                                ? "bg-zinc-100 text-zinc-950 font-semibold"
                                : "text-zinc-700 hover:bg-zinc-50"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-zinc-950 text-white flex items-center justify-center font-medium text-[11px]">
                                {(u.name || "E").charAt(0)}
                              </div>
                              <div>
                                <span className="block leading-tight">{u.name || "Admin"}</span>
                                <span className="text-[10px] text-zinc-400 font-mono">
                                  Enterprise • {formatPoints(u.pointBalance)} pts
                                </span>
                              </div>
                            </div>
                            {isCurrent && <Check className="h-3.5 w-3.5 text-zinc-950" />}
                          </button>
                        );
                      })}
                    </div>

                    {/* Auth & Marketing Navigation */}
                    <div className="p-2 border-t border-zinc-100 bg-zinc-50/50 space-y-1">
                      <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
                        <Link
                          href="/login"
                          onClick={() => setUserDropdownOpen(false)}
                          className="py-1.5 px-2 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-800 text-[11px] font-medium transition-colors flex items-center justify-center gap-1"
                        >
                          <LogIn className="h-3 w-3 text-zinc-500" />
                          <span>Sign In</span>
                        </Link>
                        <Link
                          href="/signup"
                          onClick={() => setUserDropdownOpen(false)}
                          className="py-1.5 px-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-[11px] font-medium transition-colors flex items-center justify-center gap-1 shadow-xs"
                        >
                          <span>Sign Up</span>
                        </Link>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          setBuyPointsModalOpen(true);
                        }}
                        className="w-full py-1.5 px-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-[11px] font-medium transition-colors flex items-center justify-center gap-1.5"
                      >
                        <CreditCard className="h-3 w-3 text-zinc-300" />
                        <span>{isEnterprise ? "Buy Corporate Allocation" : "Top Up Points via Card"}</span>
                      </button>

                      <Link
                        href="/marketing"
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full py-1.5 px-2 rounded-lg hover:bg-zinc-100 text-zinc-600 hover:text-zinc-950 text-[11px] font-mono transition-colors flex items-center justify-center gap-1"
                      >
                        <Globe2 className="h-3 w-3 text-zinc-400" />
                        <span>Marketing Landing Page</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Earn Simulator Modal */}
      <EarnSimulatorModal
        isOpen={earnModalOpen}
        onClose={() => setEarnModalOpen(false)}
      />

      {/* Buy Points & Card Top-Up Modal */}
      <BuyPointsModal
        isOpen={buyPointsModalOpen}
        onClose={() => setBuyPointsModalOpen(false)}
      />
    </>
  );
}
