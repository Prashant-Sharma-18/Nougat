"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@/components/UserContext";
import { getUserOrders } from "@/actions/orders";
import { exportOrdersCsv } from "@/actions/export";
import { formatPoints } from "@/lib/utils";
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ExternalLink,
  Gift,
  FileText,
  Download
} from "lucide-react";
import Link from "next/link";

export default function OrdersPage() {
  const { currentUser } = useUser();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const res = await getUserOrders(currentUser.id);
      setOrders(res);
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [currentUser?.id]);

  const completedCount = orders.filter((o) => o.status === "COMPLETED").length;
  const failedCount = orders.filter((o) => o.status === "FAILED").length;
  const [exporting, setExporting] = useState(false);

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const csv = await exportOrdersCsv(currentUser?.id);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `redemption_orders_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Export orders failed:", e);
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
            <ShieldCheck className="h-6 w-6 text-zinc-800" />
            Redemption Orders Audit
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Idempotent order execution logs, provider responses, and failure rollback diagnostics.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            onClick={handleExportCsv}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 font-medium transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-zinc-500" />
            <span>{exporting ? "Exporting..." : "Export Orders CSV"}</span>
          </button>
          <span className="px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-800 border border-zinc-200">
            {completedCount} Completed
          </span>
          <span className="px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-700 border border-zinc-200">
            {failedCount} Rollbacks
          </span>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-zinc-500 font-mono animate-pulse">
            Loading order fulfillment audit logs...
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileText className="h-10 w-10 text-zinc-300 mx-auto" />
            <h3 className="text-sm font-semibold text-zinc-800">No orders placed yet</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Redeem a gift card from the catalog to see its lifecycle and provider logs here.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-950 text-white text-xs font-medium hover:bg-zinc-800 transition-colors"
            >
              Go to Catalog
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {orders.map((order) => {
              const formattedDate = new Date(order.createdAt).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              });

              let statusBadge = (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-zinc-100 text-zinc-800 border border-zinc-200 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-zinc-700" />
                  COMPLETED
                </span>
              );

              if (order.status === "FAILED") {
                statusBadge = (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-zinc-100 text-zinc-900 border border-zinc-300 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 text-zinc-800" />
                    FAILED & REFUNDED
                  </span>
                );
              } else if (order.status === "PROCESSING" || order.status === "PENDING") {
                statusBadge = (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-zinc-100 text-zinc-700 border border-zinc-200 flex items-center gap-1">
                    <Clock className="h-3 w-3 text-zinc-500" />
                    PROCESSING
                  </span>
                );
              }

              return (
                <div
                  key={order.id}
                  className="p-4 hover:bg-zinc-50/60 transition-colors space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700 font-medium text-xs">
                        <Gift className="h-4 w-4 text-zinc-800" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm text-zinc-950">
                            {order.brandName} - ${order.faceValue} {order.currency}
                          </h4>
                          {statusBadge}
                        </div>
                        <span className="text-[11px] text-zinc-500 font-mono">
                          Order #{order.id.slice(0, 8)} • {formattedDate}
                        </span>
                      </div>
                    </div>

                    <div className="text-right sm:text-right">
                      <span className="text-xs font-semibold text-zinc-900 block font-mono">
                        {order.cashSpent && order.cashSpent > 0 ? (
                          <span>
                            {formatPoints(order.pointsSpent)} pts + ${order.cashSpent.toFixed(2)} Card
                          </span>
                        ) : (
                          `${formatPoints(order.pointsSpent)} points spent`
                        )}
                      </span>
                      {order.paymentMethod && (
                        <span className="text-[10px] text-zinc-600 font-mono block">
                          Method: {order.paymentMethod}
                        </span>
                      )}
                      {order.providerOrderId && (
                        <span className="font-mono text-[10px] text-zinc-400 block">
                          Provider Ref: {order.providerOrderId}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Diagnostic / Error message if failed */}
                  {order.errorMessage && (
                    <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 text-xs text-zinc-800 space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold font-mono">
                        <AlertCircle className="h-3.5 w-3.5 text-zinc-700" />
                        <span>Execution Rollback Diagnostic:</span>
                      </div>
                      <p className="font-mono text-[11px] text-zinc-700">{order.errorMessage}</p>
                      <p className="text-[11px] text-zinc-600 font-mono">
                        Safety rollback verified: {order.pointsSpent} points credited back to ledger.
                      </p>
                    </div>
                  )}

                  {/* Claim link if completed */}
                  {order.claimUrl && (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-zinc-500 font-mono">
                        Digital voucher generated successfully.
                      </span>
                      <a
                        href={order.claimUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-zinc-950 hover:underline"
                      >
                        <span>Open Reward Link</span>
                        <ExternalLink className="h-3 w-3 text-zinc-400" />
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
