"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@/components/UserContext";
import { getUserOrders } from "@/actions/orders";
import { formatPoints, pointsToDollars } from "@/lib/utils";
import { getUserTier } from "@/lib/loyalty/tiers";
import { formatWithFx } from "@/lib/currency/fx";
import { 
  User, 
  Wallet, 
  Coins, 
  Plus, 
  ShieldCheck, 
  Gift, 
  CheckCircle2, 
  Clock, 
  Printer, 
  ExternalLink,
  ChevronRight,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  History,
  Lock,
  Mail
} from "lucide-react";
import Link from "next/link";
import EarnSimulatorModal from "@/components/EarnSimulatorModal";
import { BuyPointsModal } from "@/components/BuyPointsModal";

export default function ProfilePage() {
  const { currentUser, currentCurrency, refreshUserData } = useUser();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [earnModalOpen, setEarnModalOpen] = useState(false);
  const [buyPointsModalOpen, setBuyPointsModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"ALL" | "DELIVERED" | "GIFTED">("ALL");

  const balance = currentUser?.pointBalance ?? 0;
  const dollarEquivalent = pointsToDollars(balance);
  const userTier = getUserTier(balance);

  useEffect(() => {
    async function loadOrders() {
      if (!currentUser) return;
      try {
        setLoading(true);
        const data = await getUserOrders(currentUser.id);
        setOrders(data);
      } catch (err) {
        console.error("Failed to load orders:", err);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, [currentUser?.id]);

  const filteredOrders = orders.filter((o) => {
    if (activeFilter === "ALL") return true;
    if (activeFilter === "DELIVERED") return o.status === "COMPLETED";
    if (activeFilter === "GIFTED") return Boolean(o.recipientEmail);
    return true;
  });

  const totalSpent = orders.reduce((sum, o) => sum + (o.faceValue || 0), 0);
  const totalPointsRedeemed = orders.reduce((sum, o) => sum + (o.pointsSpent || 0), 0);

  return (
    <div className="space-y-8">
      {/* Profile Header & VIP Tier */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-2xl bg-zinc-950 text-white flex items-center justify-center font-bold text-xl font-mono shadow-xs shrink-0">
              {(currentUser?.name || "U").charAt(0).toUpperCase()}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-zinc-100 text-zinc-800 border border-zinc-200">
                  Consumer Member
                </span>
                <span className="text-[11px] font-mono text-zinc-400">
                  ID: {currentUser?.id?.slice(0, 8)}
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
                {currentUser?.name || "Personal Member"}
              </h1>
              <p className="text-xs text-zinc-500 font-mono">
                {currentUser?.email || "member@loyaltyrewards.io"}
              </p>
            </div>
          </div>

          {/* Points & Cash Value */}
          <div className="flex items-center gap-6 bg-zinc-50 p-4 rounded-xl border border-zinc-200 font-mono text-xs">
            <div>
              <span className="text-zinc-400 text-[10px] uppercase block">Point Balance</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-zinc-950">{formatPoints(balance)}</span>
                <span className="text-xs text-zinc-500">pts</span>
              </div>
            </div>
            <div className="h-10 w-px bg-zinc-200" />
            <div>
              <span className="text-zinc-400 text-[10px] uppercase block">Cash Equivalent</span>
              <span className="text-sm font-semibold text-zinc-900 block mt-1">
                {formatWithFx(dollarEquivalent, currentCurrency)}
              </span>
            </div>
            <div className="h-10 w-px bg-zinc-200" />
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => setBuyPointsModalOpen(true)}
                className="px-2.5 py-1 rounded-md bg-zinc-950 hover:bg-zinc-800 text-white text-[10px] font-medium transition-colors"
              >
                Buy Points
              </button>
              <button
                onClick={() => setEarnModalOpen(true)}
                className="px-2.5 py-1 rounded-md border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-800 text-[10px] font-medium transition-colors"
              >
                Earn Points
              </button>
            </div>
          </div>
        </div>

        {/* Member Benefits Grid */}
        <div className="pt-6 border-t border-zinc-100 grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/50 space-y-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-500">Tier Status</span>
              <span className="font-semibold text-zinc-950">{userTier.displayName}</span>
            </div>
            <div className="text-[11px] text-zinc-600">
              {userTier.discountPercentage}% discount on all catalog cards
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/50 space-y-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-500">Point Multiplier</span>
              <span className="font-semibold text-zinc-950">{userTier.earnMultiplier}x Velocity</span>
            </div>
            <div className="text-[11px] text-zinc-600">
              Boosted earning on everyday merchant transactions
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/50 space-y-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-500">Security Guard</span>
              <span className="font-semibold text-zinc-950">2FA / OTP Active</span>
            </div>
            <div className="text-[11px] text-zinc-600">
              Automatic authorization on redemptions &gt; $100
            </div>
          </div>
        </div>
      </div>

      {/* Order Status & Purchase History Section */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-100 gap-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-950 flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              <span>Gift Card Purchases & Order Status ({orders.length})</span>
            </h2>
            <p className="text-[11px] text-zinc-500">
              Track delivery status, access digital codes, and view receipts for all gift cards bought on your account.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <button
              onClick={() => setActiveFilter("ALL")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeFilter === "ALL"
                  ? "bg-zinc-950 text-white font-medium"
                  : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
              }`}
            >
              All Orders
            </button>
            <button
              onClick={() => setActiveFilter("DELIVERED")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeFilter === "DELIVERED"
                  ? "bg-zinc-950 text-white font-medium"
                  : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
              }`}
            >
              Delivered
            </button>
            <button
              onClick={() => setActiveFilter("GIFTED")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeFilter === "GIFTED"
                  ? "bg-zinc-950 text-white font-medium"
                  : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
              }`}
            >
              Gifted to Others
            </button>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <Gift className="h-8 w-8 text-zinc-300 mx-auto" />
            <div className="text-xs text-zinc-500 font-mono">
              No orders found matching this filter.
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-950 text-white text-xs font-medium hover:bg-zinc-800 transition-colors"
            >
              <span>Explore Gift Card Catalog</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-zinc-100 text-[10px] uppercase text-zinc-400">
                  <th className="pb-2 font-medium">Order Reference</th>
                  <th className="pb-2 font-medium">Card Brand</th>
                  <th className="pb-2 font-medium">Face Value</th>
                  <th className="pb-2 font-medium">Recipient</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="py-3 font-medium text-zinc-900">
                      {order.id.slice(0, 12)}...
                    </td>
                    <td className="py-3 font-semibold text-zinc-900 font-sans">
                      {order.brandName}
                    </td>
                    <td className="py-3">
                      <span className="font-semibold text-zinc-950">${order.faceValue}.00</span>
                      <span className="text-[10px] text-zinc-400 block">{order.pointsSpent.toLocaleString()} pts</span>
                    </td>
                    <td className="py-3">
                      {order.recipientName ? (
                        <div>
                          <span className="font-medium text-zinc-800">{order.recipientName}</span>
                          <span className="text-[10px] text-zinc-400 block">{order.recipientEmail}</span>
                        </div>
                      ) : (
                        <span className="text-zinc-500">Personal (Self)</span>
                      )}
                    </td>
                    <td className="py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${
                        order.status === "COMPLETED"
                          ? "bg-zinc-950 text-white"
                          : "bg-zinc-100 text-zinc-600 border border-zinc-200"
                      }`}>
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                        <span>{order.status === "COMPLETED" ? "Delivered" : order.status}</span>
                      </span>
                    </td>
                    <td className="py-3 text-zinc-400 text-[11px]">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href="/wallet"
                          className="px-2 py-1 rounded border border-zinc-200 hover:bg-zinc-100 text-zinc-700 text-[11px] font-medium transition-colors inline-flex items-center gap-1"
                        >
                          <Wallet className="h-3 w-3" />
                          <span>Wallet</span>
                        </Link>
                        <Link
                          href={`/wallet/print/${order.id}`}
                          className="px-2 py-1 rounded bg-zinc-950 hover:bg-zinc-800 text-white text-[11px] font-medium transition-colors inline-flex items-center gap-1"
                        >
                          <Printer className="h-3 w-3" />
                          <span>Print</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <EarnSimulatorModal isOpen={earnModalOpen} onClose={() => setEarnModalOpen(false)} />
      <BuyPointsModal isOpen={buyPointsModalOpen} onClose={() => setBuyPointsModalOpen(false)} />
    </div>
  );
}

