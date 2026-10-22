"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@/components/UserContext";
import { getPointLedger } from "@/actions/points";
import { exportLedgerCsv } from "@/actions/export";
import { formatPoints } from "@/lib/utils";
import { 
  History, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RotateCcw, 
  Coins,
  Calendar,
  Download
} from "lucide-react";

export default function HistoryPage() {
  const { currentUser, isEnterprise } = useUser();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("ALL");

  const fetchLedger = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const res = await getPointLedger(currentUser.id, 100);
      setTransactions(res);
    } catch (err) {
      console.error("Failed to load point ledger:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [currentUser?.id]);

  const filteredTransactions = transactions.filter((t) => {
    if (filterType === "ALL") return true;
    return t.type === filterType;
  });

  const totalEarned = transactions
    .filter((t) => t.type === "EARNED" || (t.type === "REFUNDED" && t.amount > 0))
    .reduce((sum, t) => sum + t.amount, 0);

  const totalRedeemed = transactions
    .filter((t) => t.type === "REDEEMED")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const [exporting, setExporting] = useState(false);

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const csv = await exportLedgerCsv(currentUser?.id);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `loyalty_ledger_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Export failed:", e);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-950 tracking-tight flex items-center gap-2.5">
            <History className="h-6 w-6 text-zinc-800" />
            {isEnterprise ? "Enterprise Settlement Ledger" : "Points Ledger & Activity"}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            {isEnterprise
              ? "Immutable double-entry ledger tracking corporate bulk disbursements, HR incentive batches, and gateway refunds."
              : "Personal transaction history tracking retail purchase earnings, voucher redemptions, and refunds."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-medium transition-colors font-mono"
          >
            <Download className="h-3.5 w-3.5 text-zinc-500" />
            <span>{exporting ? "Exporting..." : isEnterprise ? "Export Settlement CSV" : "Export CSV"}</span>
          </button>

          {/* Balance Card */}
          <div className="flex items-center gap-3 bg-white p-2 px-3 rounded-lg border border-zinc-200">
            <div className="text-right">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                {isEnterprise ? "Corporate Pool" : "Available Balance"}
              </span>
              <span className="text-xs font-bold font-mono text-zinc-950">
                {formatPoints(currentUser?.pointBalance || 0)} pts
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-zinc-100 text-zinc-800 flex items-center justify-center font-bold">
            <ArrowUpRight className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider block">
              Total Points Earned
            </span>
            <span className="text-sm font-bold font-mono text-zinc-950">
              +{formatPoints(totalEarned)} pts
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-zinc-100 text-zinc-800 flex items-center justify-center font-bold">
            <ArrowDownLeft className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider block">
              Total Points Redeemed
            </span>
            <span className="text-sm font-bold font-mono text-zinc-950">
              -{formatPoints(totalRedeemed)} pts
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-xs flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-zinc-100 text-zinc-800 flex items-center justify-center font-bold">
            <Coins className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider block">
              Ledger Transactions
            </span>
            <span className="text-sm font-bold font-mono text-zinc-950">
              {transactions.length} Entries
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 bg-white p-1.5 rounded-xl border border-zinc-200">
        {["ALL", "EARNED", "REDEEMED", "REFUNDED"].map((tab) => {
          const isSelected = filterType === tab;
          return (
            <button
              key={tab}
              onClick={() => setFilterType(tab)}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-medium whitespace-nowrap transition-colors ${
                isSelected
                  ? "bg-zinc-950 text-white font-semibold"
                  : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100"
              }`}
            >
              {tab === "ALL" ? "All Entries" : tab}
            </button>
          );
        })}
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-zinc-500 font-mono animate-pulse">
            Loading point ledger transactions...
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <p className="text-sm font-semibold text-zinc-700">No transactions recorded</p>
            <p className="text-xs text-zinc-500 font-mono">
              There are no ledger entries matching the selected filter.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {filteredTransactions.map((tx) => {
              const isPositive = tx.amount > 0;
              const formattedDate = new Date(tx.createdAt).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              });

              let Icon = ArrowUpRight;
              if (tx.type === "REDEEMED") {
                Icon = ArrowDownLeft;
              } else if (tx.type === "REFUNDED") {
                Icon = RotateCcw;
              }

              return (
                <div
                  key={tx.id}
                  className="p-3.5 hover:bg-zinc-50/60 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg border border-zinc-200 bg-zinc-100 flex items-center justify-center shrink-0 text-zinc-800">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-zinc-950">
                          {tx.description}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono border border-zinc-200 bg-zinc-100 text-zinc-800 uppercase">
                          {tx.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-0.5 font-mono">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formattedDate}
                        </span>
                        {tx.referenceId && (
                          <span className="text-[10px] text-zinc-500 bg-zinc-100 px-1 py-0.2 rounded border border-zinc-200">
                            ref: {tx.referenceId.slice(0, 8)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-bold font-mono text-xs sm:text-sm text-zinc-950">
                      {isPositive ? `+${formatPoints(tx.amount)}` : formatPoints(tx.amount)} pts
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
