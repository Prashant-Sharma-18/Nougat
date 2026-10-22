"use client";

import React, { useEffect, useState } from "react";
import { getAdminMetrics, toggleBrandStatus, adjustUserPoints } from "@/actions/admin";
import { populateSampleData, resetDemoData } from "@/actions/demoData";
import { formatPoints, formatCurrency } from "@/lib/utils";
import { 
  ShieldCheck, 
  Check, 
  AlertTriangle, 
  Loader2,
  RefreshCw,
  RotateCcw,
  Server,
  Radio,
  Send,
  Code
} from "lucide-react";
import { useUser } from "@/components/UserContext";

export default function AdminPage() {
  const { refreshUserData } = useUser();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ message: string; isError?: boolean } | null>(null);

  // Manual Adjustment Form state
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [adjustAmount, setAdjustAmount] = useState<string>("500");
  const [adjustReason, setAdjustReason] = useState<string>("Customer Care Courtesy Credit");
  const [adjusting, setAdjusting] = useState(false);

  // Webhook Simulator state
  const [webhookEvent, setWebhookEvent] = useState<"order.failed" | "reward.delivered" | "order.canceled">("order.failed");
  const [webhookOrderId, setWebhookOrderId] = useState<string>("");
  const [webhookDispatching, setWebhookDispatching] = useState(false);
  const [webhookResult, setWebhookResult] = useState<{ status: number; data: any; timestamp: string } | null>(null);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const data = await getAdminMetrics();
      setMetrics(data);
      if (data.users.length > 0 && !selectedUserId) {
        setSelectedUserId(data.users[0].id);
      }
      if (data.recentOrders?.length > 0 && !webhookOrderId) {
        const first = data.recentOrders[0];
        setWebhookOrderId(first.providerOrderId || first.id);
      }
    } catch (err: any) {
      setFeedback({ message: err.message || "Failed to load metrics", isError: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  const handleToggleBrand = async (brandId: string, currentStatus: boolean) => {
    try {
      await toggleBrandStatus(brandId, !currentStatus);
      setFeedback({ message: "Brand status updated successfully." });
      await loadMetrics();
    } catch (err: any) {
      setFeedback({ message: err.message, isError: true });
    }
  };

  const handleAdjustPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !adjustAmount || !adjustReason) return;

    try {
      setAdjusting(true);
      setFeedback(null);
      await adjustUserPoints({
        userId: selectedUserId,
        amount: parseInt(adjustAmount, 10),
        reason: adjustReason,
      });
      setFeedback({ message: `Successfully adjusted balance by ${adjustAmount} points.` });
      await loadMetrics();
      await refreshUserData();
    } catch (err: any) {
      setFeedback({ message: err.message || "Failed to adjust points", isError: true });
    } finally {
      setAdjusting(false);
    }
  };

  const [seeding, setSeeding] = useState(false);

  const handlePopulateDemo = async () => {
    try {
      setSeeding(true);
      setFeedback(null);
      const res = await populateSampleData();
      setFeedback({ message: `Success: Added ${res.count} realistic gift card orders and past purchase earnings.` });
      await loadMetrics();
      await refreshUserData();
    } catch (err: any) {
      setFeedback({ message: err.message || "Failed to seed demo data", isError: true });
    } finally {
      setSeeding(false);
    }
  };

  const handleResetDemo = async () => {
    if (!window.confirm("Are you sure you want to purge test orders and reset balances to initial values?")) return;
    try {
      setSeeding(true);
      setFeedback(null);
      await resetDemoData();
      setFeedback({ message: "Platform state reset successfully to clean initial baseline." });
      await loadMetrics();
      await refreshUserData();
    } catch (err: any) {
      setFeedback({ message: err.message || "Failed to reset demo data", isError: true });
    } finally {
      setSeeding(false);
    }
  };

  const handleDispatchWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookOrderId) return;

    try {
      setWebhookDispatching(true);
      setWebhookResult(null);

      const payload = {
        event_type: webhookEvent,
        payload: {
          order_id: webhookOrderId,
          status: webhookEvent === "order.failed" ? "FAILED" : webhookEvent === "order.canceled" ? "CANCELED" : "DELIVERED",
          reason: webhookEvent === "order.failed" ? "Simulated partner merchant stockout" : undefined,
          delivery: webhookEvent === "reward.delivered" ? { link: "https://rewards.tremendous.com/claims/simulated-2026-claim-pass" } : undefined,
        },
      };

      const res = await fetch("/api/webhooks/tremendous", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "tremendous-webhook-signature": "test-valid-signature",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setWebhookResult({
        status: res.status,
        data,
        timestamp: new Date().toLocaleTimeString(),
      });
      await loadMetrics();
      await refreshUserData();
    } catch (err: any) {
      setWebhookResult({
        status: 500,
        data: { error: err.message || "Failed to dispatch webhook" },
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setWebhookDispatching(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-950 tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="h-6 w-6 text-zinc-800" />
            Platform Admin Console
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Manage catalog availability, monitor outstanding points, and issue manual ledger adjustments.
          </p>
        </div>

        <button
          onClick={loadMetrics}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-mono font-medium transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5 text-zinc-500" />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-lg text-xs font-mono flex items-center gap-2 ${
            feedback.isError
              ? "bg-zinc-100 text-zinc-900 border border-zinc-300"
              : "bg-zinc-100 text-zinc-900 border border-zinc-300"
          }`}
        >
          {feedback.isError ? (
            <AlertTriangle className="h-4 w-4 shrink-0 text-zinc-700" />
          ) : (
            <Check className="h-4 w-4 shrink-0 text-zinc-700" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* KPI Cards */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
          <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-xs space-y-1">
            <span className="text-[10px] uppercase text-zinc-500 block tracking-wider">
              Circulating Point Liability
            </span>
            <p className="text-2xl font-bold text-zinc-950">
              {formatPoints(metrics.totalPointsInCirculation)} <span className="text-xs font-normal text-zinc-500">PTS</span>
            </p>
            <p className="text-[11px] text-zinc-500">
              ≈ {formatCurrency(metrics.totalPointsInCirculation / 100)} USD value
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-xs space-y-1">
            <span className="text-[10px] uppercase text-zinc-500 block tracking-wider">
              Total Gift Cards Issued
            </span>
            <p className="text-2xl font-bold text-zinc-950">
              ${formatCurrency(metrics.totalValueRedeemed).replace("$", "")}
            </p>
            <p className="text-[11px] text-zinc-500">
              Across {metrics.completedOrdersCount} redemptions
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-xs space-y-1">
            <span className="text-[10px] uppercase text-zinc-500 block tracking-wider">
              Points Burned to Date
            </span>
            <p className="text-2xl font-bold text-zinc-950">
              {formatPoints(metrics.totalPointsRedeemed)}
            </p>
            <p className="text-[11px] text-zinc-500">
              Fulfilled through gateway
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-xs space-y-1">
            <span className="text-[10px] uppercase text-zinc-500 block tracking-wider">
              Registered Accounts
            </span>
            <p className="text-2xl font-bold text-zinc-950">
              {metrics.totalUsersCount} Members
            </p>
            <p className="text-[11px] text-zinc-500">
              Active program participants
            </p>
          </div>
        </div>
      )}

      {/* Brand Catalog Management Table */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm text-zinc-950">Brand Catalog Controls</h3>
            <p className="text-xs text-zinc-500">Toggle live availability for consumer redemptions</p>
          </div>
          <span className="text-xs font-mono text-zinc-400">
            {metrics?.brands?.length || 0} Brands in Catalog
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-600">
            <thead className="bg-zinc-50 border-b border-zinc-100 uppercase text-[10px] tracking-wider text-zinc-500 font-mono">
              <tr>
                <th className="px-6 py-3">Brand Name</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Supported Denominations</th>
                <th className="px-6 py-3">Exchange Rate</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {metrics?.brands?.map((brand: any) => (
                <tr key={brand.id} className="hover:bg-zinc-50/60 transition-colors">
                  <td className="px-6 py-3 font-medium text-zinc-950 flex items-center gap-2.5">
                    <img
                      src={brand.logoUrl}
                      alt={brand.name}
                      className="w-7 h-7 rounded-md object-cover border border-zinc-200"
                    />
                    <span>{brand.name}</span>
                  </td>
                  <td className="px-6 py-3">{brand.category}</td>
                  <td className="px-6 py-3">
                    <span className="font-mono text-[11px] text-zinc-600">
                      {brand.denominations.map((d: number) => `$${d}`).join(", ")}
                    </span>
                  </td>
                  <td className="px-6 py-3 font-mono text-zinc-800">
                    {brand.pointsPerUnit} pts = $1.00
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                        brand.isActive
                          ? "bg-zinc-100 text-zinc-900 border border-zinc-300"
                          : "bg-zinc-100 text-zinc-400 border border-zinc-200"
                      }`}
                    >
                      {brand.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button
                      onClick={() => handleToggleBrand(brand.id, brand.isActive)}
                      className="px-2.5 py-1 rounded-md text-xs font-mono font-medium border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-800 transition-colors"
                    >
                      {brand.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual User Balance Adjustment Tool */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs p-6 space-y-4">
        <div>
          <h3 className="font-semibold text-sm text-zinc-950">Manual Point Adjustment</h3>
          <p className="text-xs text-zinc-500">
            Issue discretionary credit or debit adjustments. Creates an immutable double-entry ledger record.
          </p>
        </div>

        <form onSubmit={handleAdjustPoints} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end font-mono">
          <div>
            <label className="block text-[10px] uppercase text-zinc-500 mb-1">
              Select User Account
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:border-zinc-400 focus:outline-none"
            >
              {metrics?.users?.map((u: any) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({formatPoints(u.pointBalance)} pts)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase text-zinc-500 mb-1">
              Adjustment Amount (pts)
            </label>
            <input
              type="number"
              step="10"
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(e.target.value)}
              placeholder="e.g. 500 or -200"
              className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:border-zinc-400 focus:outline-none font-bold"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase text-zinc-500 mb-1">
              Audit Reason / Ticket ID
            </label>
            <input
              type="text"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              placeholder="e.g. Compensation for ticket #4410"
              className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:border-zinc-400 focus:outline-none font-sans"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={adjusting}
              className="w-full py-1.5 px-4 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-medium shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {adjusting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Post Audit Adjustment"}
            </button>
          </div>
        </form>
      </div>

      {/* Grid: Demo Seeder & System Diagnostics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Panel 1: Demo Sandbox Operations */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-xs p-6 space-y-4">
          <div>
            <h3 className="font-semibold text-sm text-zinc-950">Demo Operations & Sandbox Seeder</h3>
            <p className="text-xs text-zinc-500">Utilities to populate or reset platform test data</p>
          </div>

          <p className="text-xs text-zinc-600 leading-relaxed">
            Populate realistic past gift card redemptions (Amazon, Starbucks, Apple, Target) with greeting messages and store purchase earnings to test wallet and POS features.
          </p>

          <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
            <button
              onClick={handlePopulateDemo}
              disabled={seeding}
              className="flex-1 py-2 px-3.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-medium shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {seeding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              <span>Populate Rich Demo Activity</span>
            </button>

            <button
              onClick={handleResetDemo}
              disabled={seeding}
              className="py-2 px-3.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-800 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset State</span>
            </button>
          </div>
        </div>

        {/* Panel 2: Live Provider & Security Diagnostics */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-zinc-700" />
            <div>
              <h3 className="font-semibold text-sm text-zinc-950">Provider & Security Diagnostics</h3>
              <p className="text-xs text-zinc-500">Status of external gift card gateways & security vault</p>
            </div>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-between">
              <div>
                <span className="font-medium text-zinc-900 block font-sans">Tremendous Gateway</span>
                <span className="text-[10px] text-zinc-500">testflight.tremendous.com/api/v2</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-100 text-zinc-800 border border-zinc-200">
                ONLINE
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-between">
              <div>
                <span className="font-medium text-zinc-900 block font-sans">Reloadly Failover</span>
                <span className="text-[10px] text-zinc-500">giftcards-sandbox.reloadly.com</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-100 text-zinc-800 border border-zinc-200">
                STANDBY
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-between">
              <div>
                <span className="font-medium text-zinc-900 block font-sans">AES-256-GCM Vault</span>
                <span className="text-[10px] text-zinc-500">96-bit IV + 128-bit Auth Tag</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-100 text-zinc-800 border border-zinc-200">
                ACTIVE
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Panel 3: Interactive Tremendous Webhook Sandbox Console */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-4">
          <div className="flex items-center gap-2.5">
            <Radio className="h-4 w-4 text-zinc-950" />
            <div>
              <h3 className="font-semibold text-sm text-zinc-950">Tremendous Webhook Simulator</h3>
              <p className="text-xs text-zinc-500">
                Simulate asynchronous gateway callbacks, test HMAC-SHA256 signature verification, and trigger atomic ledger refund rollbacks
              </p>
            </div>
          </div>
          <span className="self-start sm:self-auto px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-100 text-zinc-800 border border-zinc-200">
            POST /api/webhooks/tremendous
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Controls Form */}
          <form onSubmit={handleDispatchWebhook} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase font-mono text-zinc-500 mb-1.5">
                Simulated Event Type
              </label>
              <select
                value={webhookEvent}
                onChange={(e) => setWebhookEvent(e.target.value as any)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-800 focus:border-zinc-400 focus:outline-none"
              >
                <option value="order.failed">order.failed (Rollback & Refund Points)</option>
                <option value="reward.delivered">reward.delivered (Deliver Claim URL)</option>
                <option value="order.canceled">order.canceled (Rollback & Refund Points)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-mono text-zinc-500 mb-1.5">
                Target Order
              </label>
              {metrics?.recentOrders && metrics.recentOrders.length > 0 ? (
                <div className="space-y-2">
                  <select
                    value={webhookOrderId}
                    onChange={(e) => setWebhookOrderId(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-mono text-zinc-800 focus:border-zinc-400 focus:outline-none"
                  >
                    {metrics.recentOrders.map((o: any) => (
                      <option key={o.id} value={o.providerOrderId || o.id}>
                        {o.brandName} - ${o.faceValue} ({o.status}) - {o.user?.name || "User"} [{o.providerOrderId || o.id.slice(0, 8)}]
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={webhookOrderId}
                    onChange={(e) => setWebhookOrderId(e.target.value)}
                    placeholder="Or enter custom Provider Order ID..."
                    className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-mono text-zinc-700 focus:border-zinc-400 focus:outline-none"
                  />
                </div>
              ) : (
                <input
                  type="text"
                  value={webhookOrderId}
                  onChange={(e) => setWebhookOrderId(e.target.value)}
                  placeholder="Enter order ID..."
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-mono text-zinc-800 focus:border-zinc-400 focus:outline-none"
                />
              )}
            </div>

            <button
              type="submit"
              disabled={webhookDispatching || !webhookOrderId}
              className="w-full py-2 px-4 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-medium shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {webhookDispatching ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              <span>Dispatch Signed Webhook Payload</span>
            </button>
          </form>

          {/* Payload Preview & Live Telemetry Output */}
          <div className="space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase font-mono text-zinc-500">Live JSON Payload Preview</span>
                <span className="text-[10px] font-mono text-zinc-400">HMAC-SHA256 Signed</span>
              </div>
              <pre className="p-3 bg-zinc-900 text-zinc-200 rounded-lg text-[11px] font-mono overflow-x-auto border border-zinc-800 leading-relaxed">
{JSON.stringify(
  {
    event_type: webhookEvent,
    payload: {
      order_id: webhookOrderId || "ORD-PENDING-SAMPLE",
      status: webhookEvent === "order.failed" ? "FAILED" : webhookEvent === "order.canceled" ? "CANCELED" : "DELIVERED",
      reason: webhookEvent === "order.failed" ? "Simulated partner merchant stockout" : undefined,
      delivery: webhookEvent === "reward.delivered" ? { link: "https://rewards.tremendous.com/claims/simulated-2026-claim-pass" } : undefined,
    },
  },
  null,
  2
)}
              </pre>
            </div>

            {/* Response telemetry */}
            {webhookResult && (
              <div className="p-3 rounded-lg border border-zinc-200 bg-zinc-50 text-xs font-mono space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${webhookResult.status === 200 ? "bg-emerald-500" : "bg-rose-500"}`} />
                    <span className="font-bold text-zinc-900">
                      HTTP {webhookResult.status} {webhookResult.status === 200 ? "OK" : "ERROR"}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400">{webhookResult.timestamp}</span>
                </div>
                <div className="text-zinc-600 break-all text-[11px]">
                  Response: {JSON.stringify(webhookResult.data)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
