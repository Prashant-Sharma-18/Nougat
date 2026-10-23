"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useUser } from "@/components/UserContext";
import { getWalletGiftCards } from "@/actions/orders";
import { exportWalletCardsCsv } from "@/actions/export";
import { 
  Wallet, 
  ExternalLink, 
  Copy, 
  Check, 
  Gift, 
  ArrowLeft, 
  Printer, 
  Smartphone,
  Search,
  Download,
  Filter,
  Building2,
  CreditCard
} from "lucide-react";
import Link from "next/link";
import { formatPoints } from "@/lib/utils";
import MobilePassModal from "@/components/MobilePassModal";
import { BuyPointsModal } from "@/components/BuyPointsModal";

type FilterTab = "ALL" | "ACTIVE" | "PARTIAL" | "PERSONAL" | "GIFT";

export default function WalletPage() {
  const { currentUser, isEnterprise } = useUser();
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedPassCard, setSelectedPassCard] = useState<any | null>(null);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");
  const [exporting, setExporting] = useState(false);

  const fetchCards = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const res = await getWalletGiftCards(currentUser.id);
      setCards(res);
    } catch (err) {
      console.error("Failed to load cards:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, [currentUser?.id]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportCsv = async () => {
    if (!currentUser) return;
    try {
      setExporting(true);
      const csv = await exportWalletCardsCsv(currentUser.id);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `wallet_vouchers_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Failed to export wallet CSV:", e);
    } finally {
      setExporting(false);
    }
  };

  // Filtered and searched cards
  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      const remaining = card.remainingCardBalance !== null && card.remainingCardBalance !== undefined
        ? card.remainingCardBalance
        : card.faceValue;

      // Tab filter
      if (activeTab === "ACTIVE" && remaining <= 0) return false;
      if (activeTab === "PARTIAL" && (remaining >= card.faceValue || remaining <= 0)) return false;
      if (activeTab === "PERSONAL" && (card.recipientName || card.recipientEmail)) return false;
      if (activeTab === "GIFT" && !card.recipientName && !card.recipientEmail) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const brandMatch = card.brandName.toLowerCase().includes(query);
        const recipientMatch = card.recipientName?.toLowerCase().includes(query) || false;
        const codeMatch = card.cardCodeEncrypted?.toLowerCase().includes(query) || false;
        return brandMatch || recipientMatch || codeMatch;
      }

      return true;
    });
  }, [cards, activeTab, searchQuery]);

  // Aggregate metrics
  const totalValue = cards.reduce((sum, c) => sum + (c.faceValue || 0), 0);
  const totalRemaining = cards.reduce((sum, c) => {
    const rem = c.remainingCardBalance !== null && c.remainingCardBalance !== undefined
      ? c.remainingCardBalance
      : c.faceValue;
    return sum + rem;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/"
              className="text-xs font-medium text-zinc-500 hover:text-zinc-950 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Rewards Catalog</span>
            </Link>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-950 tracking-tight flex items-center gap-2">
            {isEnterprise ? (
              <>
                <Building2 className="h-5 w-5 text-zinc-900" />
                <span>Corporate Reward Inventory</span>
              </>
            ) : (
              <>
                <Wallet className="h-5 w-5 text-zinc-900" />
                <span>My Digital Wallet</span>
              </>
            )}
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {isEnterprise
              ? "Organization-wide voucher allocations, team spot rewards, and merchant POS transactions."
              : "Active personal digital vouchers, checkout barcodes, and mobile wallet passes."}
          </p>
        </div>

        {/* Action Controls & Total Value Metric */}
        <div className="flex items-center gap-3 shrink-0 font-mono">
          <button
            onClick={() => setIsBuyModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-950 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-medium transition-colors shadow-xs"
          >
            <CreditCard className="h-3.5 w-3.5 text-zinc-300" />
            <span>{isEnterprise ? "Buy Corporate Allocation" : "Top Up Points"}</span>
          </button>

          <button
            onClick={handleExportCsv}
            disabled={exporting || cards.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-medium transition-colors disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5 text-zinc-500" />
            <span>{exporting ? "Exporting..." : isEnterprise ? "Export Audit CSV" : "Export CSV"}</span>
          </button>

          <div className="flex items-center gap-4 bg-zinc-50 px-3.5 py-1.5 rounded-lg border border-zinc-200">
            <div>
              <span className="text-[10px] uppercase text-zinc-400 block">
                {isEnterprise ? "Pool Available / Total" : "My Balance / Total"}
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-bold text-zinc-950">
                  ${totalRemaining.toFixed(2)}
                </span>
                <span className="text-[11px] text-zinc-400">
                  / ${totalValue.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters Strip */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-zinc-200 shadow-xs">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by brand, recipient, or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:border-zinc-400 focus:bg-white focus:outline-none transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-0.5 scrollbar-none font-mono">
          {[
            { id: "ALL", label: "All Vouchers" },
            { id: "ACTIVE", label: "Available" },
            { id: "PARTIAL", label: "Partially Used" },
            { id: "PERSONAL", label: "Personal" },
            { id: "GIFT", label: "Gifts" },
          ].map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as FilterTab)}
                className={`px-2.5 py-1 rounded-md text-xs whitespace-nowrap transition-colors ${
                  isSelected
                    ? "bg-zinc-950 text-white font-semibold"
                    : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center text-xs text-zinc-400 font-mono animate-pulse">
          Loading digital wallet cards...
        </div>
      ) : filteredCards.length === 0 ? (
        <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center space-y-3">
          <div className="h-10 w-10 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-400 mx-auto">
            <Gift className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">
              {cards.length === 0 ? "Your wallet is currently empty" : "No vouchers match your filter"}
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-0.5">
              {cards.length === 0
                ? "Redeem gift cards from the catalog to view your voucher codes and claim links here."
                : "Try clearing your search query or selecting a different status filter."}
            </p>
          </div>
          {cards.length === 0 ? (
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-medium transition-colors"
            >
              Explore Catalog
            </Link>
          ) : (
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveTab("ALL");
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-medium transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCards.map((card) => {
            const cardDate = new Date(card.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            const currentBalance = card.remainingCardBalance !== null && card.remainingCardBalance !== undefined
              ? card.remainingCardBalance
              : card.faceValue;

            const isDepleted = currentBalance <= 0;
            const isPartial = currentBalance < card.faceValue && currentBalance > 0;
            const balancePercentage = Math.round((currentBalance / card.faceValue) * 100);

            return (
              <div
                key={card.id}
                className="bg-white rounded-xl border border-zinc-200 hover:border-zinc-300 transition-all flex flex-col justify-between shadow-xs overflow-hidden"
              >
                {/* Visual card header */}
                <div className="p-4 bg-zinc-50 border-b border-zinc-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
                        Digital Reward
                      </span>
                      <h3 className="font-semibold text-sm text-zinc-950 mt-0.5">
                        {card.brandName}
                      </h3>
                      {card.recipientName && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-zinc-100 text-zinc-700 rounded text-[10px] font-mono border border-zinc-200">
                          Recipient: {card.recipientName}
                        </span>
                      )}
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-base font-bold text-zinc-950">
                        ${currentBalance.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-zinc-400 block">
                        Face: ${card.faceValue}.00
                      </span>
                    </div>
                  </div>

                  {/* Visual remaining balance bar */}
                  <div className="mt-3 space-y-1">
                    <div className="w-full bg-zinc-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-zinc-950 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(0, Math.min(100, balancePercentage))}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-zinc-200/60 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                    <span>
                      Issued: {cardDate}
                    </span>
                    {isDepleted ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                        Depleted
                      </span>
                    ) : isPartial ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-zinc-800 bg-zinc-200/60 px-2 py-0.5 rounded border border-zinc-300">
                        {balancePercentage}% Remaining
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-zinc-800 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                        Active
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Body with credentials */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    {/* Card Number */}
                    {card.cardCodeEncrypted && (
                      <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 flex items-center justify-between">
                        <div className="truncate mr-2">
                          <span className="text-[9px] uppercase font-mono tracking-wider text-zinc-400 block">
                            Voucher Code
                          </span>
                          <span className="font-mono text-xs font-semibold text-zinc-900 tracking-wider">
                            {card.cardCodeEncrypted}
                          </span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(card.cardCodeEncrypted, `code-${card.id}`)}
                          className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 transition-colors shrink-0"
                          title="Copy Code"
                        >
                          {copiedId === `code-${card.id}` ? (
                            <Check className="h-3.5 w-3.5 text-zinc-900" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    )}

                    {/* PIN */}
                    {card.cardPinEncrypted && (
                      <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 flex items-center justify-between">
                        <div>
                          <span className="text-[9px] uppercase font-mono tracking-wider text-zinc-400 block">
                            PIN
                          </span>
                          <span className="font-mono text-xs font-semibold text-zinc-900 tracking-widest">
                            {card.cardPinEncrypted}
                          </span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(card.cardPinEncrypted, `pin-${card.id}`)}
                          className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 transition-colors shrink-0"
                          title="Copy PIN"
                        >
                          {copiedId === `pin-${card.id}` ? (
                            <Check className="h-3.5 w-3.5 text-zinc-900" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    )}

                    {/* Spent points */}
                    <div className="text-[11px] text-zinc-500 font-mono">
                      Points Cost: {formatPoints(card.pointsSpent)} pts
                    </div>
                  </div>

                  {/* Actions: Claim Link & Print Voucher */}
                  <div className="space-y-1.5 mt-2">
                    {card.claimUrl && (
                      <a
                        href={card.claimUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2 px-3 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span>Open Claim Link</span>
                        <ExternalLink className="h-3.5 w-3.5 text-zinc-400" />
                      </a>
                    )}

                    <div className="grid grid-cols-2 gap-2 font-mono">
                      <Link
                        href={`/wallet/print/${card.id}`}
                        className="py-1.5 px-2.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Printer className="h-3.5 w-3.5 text-zinc-400" />
                        <span>Print / PDF</span>
                      </Link>

                      <button
                        onClick={() => setSelectedPassCard(card)}
                        className="py-1.5 px-2.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Smartphone className="h-3.5 w-3.5 text-zinc-400" />
                        <span>Mobile Pass</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Apple Wallet & Google Pay Mobile Pass Modal */}
      {selectedPassCard && (
        <MobilePassModal
          card={selectedPassCard}
          userName={currentUser?.name || "Loyalty Member"}
          isOpen={!!selectedPassCard}
          onClose={() => setSelectedPassCard(null)}
        />
      )}

      {/* Buy Points & Corporate Top-Up Modal */}
      <BuyPointsModal
        isOpen={isBuyModalOpen}
        onClose={() => setIsBuyModalOpen(false)}
        onSuccess={() => fetchCards()}
      />
    </div>
  );
}
