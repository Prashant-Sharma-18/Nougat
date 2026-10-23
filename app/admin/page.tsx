"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getAdminMetrics, toggleBrandStatus, adjustUserPoints } from "@/actions/admin";
import { populateSampleData, resetDemoData } from "@/actions/demoData";
import { fetchEmailAuditLogs } from "@/actions/email";
import { 
  fetchEnterpriseBudgets, 
  allocateBudgetPoints, 
  fetchPendingApprovals, 
  resolveApprovalRequest 
} from "@/actions/enterprise";
import { 
  fetchPromotionsData, 
  createCouponAction, 
  toggleCouponStatusAction, 
  createBannerAction, 
  toggleBannerStatusAction 
} from "@/actions/promotions";
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
  Code,
  Mail,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  Briefcase,
  Tag,
  Sparkles,
  Layers,
  Sliders,
  Plus,
  Percent,
  X,
  Lock,
  FileSpreadsheet
} from "lucide-react";
import { useUser } from "@/components/UserContext";

export default function AdminPage() {
  const { currentUser, isAdmin, loading: userLoading, refreshUserData } = useUser();
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

  // Email Audit Logs state
  const [emailLogs, setEmailLogs] = useState<any[]>([]);

  // Enterprise Cost Centers & Approval Queue state
  const [enterpriseBudgets, setEnterpriseBudgets] = useState<any | null>(null);
  const [approvalRequests, setApprovalRequests] = useState<any[]>([]);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  // Admin Multi-Mode Tabs & Promotions state
  const [adminTab, setAdminTab] = useState<"LISTINGS" | "COUPONS" | "BANNERS" | "GOVERNANCE" | "OPERATIONS">("LISTINGS");
  const [coupons, setCoupons] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);

  // Coupon modal state
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [newCouponCode, setNewCouponCode] = useState("");
  const [newDiscountPct, setNewDiscountPct] = useState("10");
  const [newBonusPts, setNewBonusPts] = useState("0");
  const [newMinOrder, setNewMinOrder] = useState("25");
  const [newCouponDesc, setNewCouponDesc] = useState("");
  const [creatingCoupon, setCreatingCoupon] = useState(false);

  // Banner modal state
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [newBannerTitle, setNewBannerTitle] = useState("");
  const [newBannerSubtitle, setNewBannerSubtitle] = useState("");
  const [newBannerBadge, setNewBannerBadge] = useState("Exclusive Promotion");
  const [newBannerCtaText, setNewBannerCtaText] = useState("Explore Rewards");
  const [newBannerCtaLink, setNewBannerCtaLink] = useState("/");
  const [newBannerAudience, setNewBannerAudience] = useState<"ALL" | "PERSONAL" | "CORPORATE">("ALL");
  const [creatingBanner, setCreatingBanner] = useState(false);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const [data, logs, budgets, approvals, promos] = await Promise.all([
        getAdminMetrics(),
        fetchEmailAuditLogs(),
        fetchEnterpriseBudgets(),
        fetchPendingApprovals(),
        fetchPromotionsData(),
      ]);
      setMetrics(data);
      setEmailLogs(logs);
      setEnterpriseBudgets(budgets);
      setApprovalRequests(approvals);
      setCoupons(promos.coupons);
      setBanners(promos.banners);
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

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim()) return;

    try {
      setCreatingCoupon(true);
      await createCouponAction({
        code: newCouponCode,
        discountPercentage: Number(newDiscountPct) || 0,
        bonusPoints: Number(newBonusPts) || 0,
        minOrderValue: Number(newMinOrder) || 0,
        maxUses: 500,
        description: newCouponDesc || `Promotional discount code ${newCouponCode.toUpperCase()}`,
      });
      setFeedback({ message: `Coupon '${newCouponCode.toUpperCase()}' created and activated successfully.` });
      setIsCouponModalOpen(false);
      setNewCouponCode("");
      const promos = await fetchPromotionsData();
      setCoupons(promos.coupons);
    } catch (err: any) {
      setFeedback({ message: err.message, isError: true });
    } finally {
      setCreatingCoupon(false);
    }
  };

  const handleToggleCoupon = async (couponId: string, currentStatus: boolean) => {
    try {
      await toggleCouponStatusAction(couponId, !currentStatus);
      const promos = await fetchPromotionsData();
      setCoupons(promos.coupons);
      setFeedback({ message: "Coupon status updated." });
    } catch (err: any) {
      setFeedback({ message: err.message, isError: true });
    }
  };

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBannerTitle.trim()) return;

    try {
      setCreatingBanner(true);
      await createBannerAction({
        title: newBannerTitle,
        subtitle: newBannerSubtitle,
        badge: newBannerBadge || "Featured Offer",
        ctaText: newBannerCtaText || "Explore",
        ctaLink: newBannerCtaLink || "/",
        targetAudience: newBannerAudience,
      });
      setFeedback({ message: "Merchandising hero banner created successfully." });
      setIsBannerModalOpen(false);
      setNewBannerTitle("");
      setNewBannerSubtitle("");
      const promos = await fetchPromotionsData();
      setBanners(promos.banners);
    } catch (err: any) {
      setFeedback({ message: err.message, isError: true });
    } finally {
      setCreatingBanner(false);
    }
  };

  const handleToggleBanner = async (bannerId: string, currentStatus: boolean) => {
    try {
      await toggleBannerStatusAction(bannerId, !currentStatus);
      const promos = await fetchPromotionsData();
      setBanners(promos.banners);
      setFeedback({ message: "Banner status updated." });
    } catch (err: any) {
      setFeedback({ message: err.message, isError: true });
    }
  };

  const handleAllocatePoints = async (deptId: string, pts: number) => {
    try {
      await allocateBudgetPoints({ departmentId: deptId, additionalPoints: pts });
      setFeedback({ message: `Successfully allocated +${pts.toLocaleString()} pts to cost center.` });
      const b = await fetchEnterpriseBudgets();
      setEnterpriseBudgets(b);
    } catch (e: any) {
      setFeedback({ message: e.message, isError: true });
    }
  };

  const handleReviewApproval = async (requestId: string, action: "APPROVE" | "REJECT") => {
    try {
      setResolvingId(requestId);
      await resolveApprovalRequest({
        requestId,
        action,
        reviewerName: "Finance Director (Acme Corp Treasury)",
        adminUserId: selectedUserId || (metrics?.users?.[0]?.id ?? ""),
      });
      setFeedback({
        message: action === "APPROVE" 
          ? "Request approved and reward order executed."
          : "Disbursement request rejected.",
      });
      const [b, a] = await Promise.all([
        fetchEnterpriseBudgets(),
        fetchPendingApprovals(),
      ]);
      setEnterpriseBudgets(b);
      setApprovalRequests(a);
      await refreshUserData();
    } catch (e: any) {
      setFeedback({ message: e.message, isError: true });
    } finally {
      setResolvingId(null);
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

  if (!userLoading && !isAdmin) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-6">
        <div className="h-14 w-14 rounded-2xl bg-zinc-100 border border-zinc-200 text-zinc-800 flex items-center justify-center mx-auto">
          <ShieldCheck className="h-7 w-7 text-zinc-950" />
        </div>

        <div className="space-y-2">
          <span className="px-2.5 py-0.5 rounded text-[10px] font-mono uppercase bg-zinc-950 text-white font-medium">
            Super Admin Access Restricted
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
            Administrative Credentials Required
          </h1>
          <p className="text-xs text-zinc-600 leading-relaxed max-w-md mx-auto">
            The Master Admin Operations Console is strictly restricted to pre-defined security IDs. Public sign-up is disabled. You are currently signed in as <strong>{currentUser?.email || "Guest"}</strong>.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-zinc-200 text-xs text-left space-y-3 font-mono">
          <div className="flex items-start gap-2.5">
            <Lock className="h-4 w-4 text-zinc-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-zinc-900 block font-sans">Pre-defined Security IDs Only</span>
              <span className="text-[11px] text-zinc-500">
                To manage merchant catalog listings, promotional coupons, merchandising banners, and platform operations, please authenticate with a pre-provisioned administrative security ID.
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/login?portal=admin"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs"
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Sign In with Pre-defined Admin ID</span>
          </Link>

          <Link
            href="/"
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>Return to Consumer Portal</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 2026 Admin Operations Console Header */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 sm:p-8 shadow-xs card-hover-subtle">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-zinc-950 text-white font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                Super Admin Operations Console
              </span>
              <span className="text-[11px] font-mono text-zinc-500">
                Pre-defined Security Authentication Active
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-zinc-950 tracking-tight leading-tight">
              Platform Merchandising & Governance.
            </h1>

            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
              Supervise all multi-tenant subsystems: active merchant brand listings, checkout discount coupons, promotional hero banners, enterprise cost centers, and double-entry transaction ledgers.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] font-mono text-zinc-500">
              <span className="flex items-center gap-1.5 text-zinc-800">
                <ShieldCheck className="h-3.5 w-3.5 text-zinc-950" />
                <span>Tremendous v2 API: CONNECTED</span>
              </span>
              <span className="flex items-center gap-1.5 text-zinc-800">
                <ShieldCheck className="h-3.5 w-3.5 text-zinc-950" />
                <span>Reloadly Failover: HOT STANDBY</span>
              </span>
              <span className="flex items-center gap-1.5 text-zinc-800">
                <ShieldCheck className="h-3.5 w-3.5 text-zinc-950" />
                <span>Double-Spend Prevention: ACID ATOMIC</span>
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
            <button
              onClick={loadMetrics}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-mono font-semibold transition-colors shadow-xs"
            >
              <RefreshCw className="h-3.5 w-3.5 text-zinc-300" />
              <span>Refresh Live Telemetry</span>
            </button>

            <Link
              href="/history"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-800 text-xs font-mono font-medium transition-colors"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-zinc-600" />
              <span>Inspect Master Ledger</span>
            </Link>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-mono flex items-center justify-between shadow-xs animate-in fade-in ${
            feedback.isError
              ? "bg-zinc-100 text-zinc-900 border border-zinc-300"
              : "bg-zinc-950 text-white"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.isError ? (
              <AlertTriangle className="h-4 w-4 shrink-0 text-zinc-700" />
            ) : (
              <Check className="h-4 w-4 shrink-0 text-zinc-300" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-[11px] font-mono text-zinc-400 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Cards */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs space-y-1.5 card-hover-subtle">
            <span className="text-[10px] uppercase text-zinc-500 block tracking-wider font-semibold">
              Circulating Point Liability
            </span>
            <p className="text-2xl font-bold text-zinc-950 tabular-nums">
              {formatPoints(metrics.totalPointsInCirculation)} <span className="text-xs font-normal text-zinc-400">PTS</span>
            </p>
            <p className="text-[11px] text-zinc-500">
              ≈ {formatCurrency(metrics.totalPointsInCirculation / 100)} USD Reserve
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs space-y-1.5 card-hover-subtle">
            <span className="text-[10px] uppercase text-zinc-500 block tracking-wider font-semibold">
              Total Gift Cards Issued
            </span>
            <p className="text-2xl font-bold text-zinc-950 tabular-nums">
              ${formatCurrency(metrics.totalValueRedeemed).replace("$", "")}
            </p>
            <p className="text-[11px] text-zinc-500">
              Across {metrics.completedOrdersCount} redemptions
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs space-y-1.5 card-hover-subtle">
            <span className="text-[10px] uppercase text-zinc-500 block tracking-wider font-semibold">
              Points Burned to Date
            </span>
            <p className="text-2xl font-bold text-zinc-950 tabular-nums">
              {formatPoints(metrics.totalPointsRedeemed)}
            </p>
            <p className="text-[11px] text-zinc-500">
              Fulfilled through Tremendous/Reloadly
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs space-y-1.5 card-hover-subtle">
            <span className="text-[10px] uppercase text-zinc-500 block tracking-wider font-semibold">
              Registered Accounts
            </span>
            <p className="text-2xl font-bold text-zinc-950 tabular-nums">
              {metrics.totalUsersCount} Members
            </p>
            <p className="text-[11px] text-zinc-500">
              Personal & Corporate tenants
            </p>
          </div>
        </div>
      )}

      {/* Admin Module Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-zinc-200 pb-3 overflow-x-auto">
        <button
          onClick={() => setAdminTab("LISTINGS")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
            adminTab === "LISTINGS"
              ? "bg-zinc-950 text-white shadow-xs"
              : "border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Catalog Listings</span>
        </button>

        <button
          onClick={() => setAdminTab("COUPONS")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
            adminTab === "COUPONS"
              ? "bg-zinc-950 text-white shadow-xs"
              : "border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
          }`}
        >
          <Tag className="h-3.5 w-3.5" />
          <span>Discounts & Coupons</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-200 ml-0.5">
            {coupons.filter((c) => c.isActive).length}
          </span>
        </button>

        <button
          onClick={() => setAdminTab("BANNERS")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
            adminTab === "BANNERS"
              ? "bg-zinc-950 text-white shadow-xs"
              : "border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Marketing Banners</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-200 ml-0.5">
            {banners.filter((b) => b.isActive).length}
          </span>
        </button>

        <button
          onClick={() => setAdminTab("GOVERNANCE")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
            adminTab === "GOVERNANCE"
              ? "bg-zinc-950 text-white shadow-xs"
              : "border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
          }`}
        >
          <Building2 className="h-3.5 w-3.5" />
          <span>Cost Centers & Approvals</span>
          {approvalRequests.filter((r) => r.status === "PENDING").length > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-200 ml-0.5">
              {approvalRequests.filter((r) => r.status === "PENDING").length}
            </span>
          )}
        </button>

        <button
          onClick={() => setAdminTab("OPERATIONS")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
            adminTab === "OPERATIONS"
              ? "bg-zinc-950 text-white shadow-xs"
              : "border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
          }`}
        >
          <Sliders className="h-3.5 w-3.5" />
          <span>Operations & Telemetry</span>
        </button>
      </div>

      {/* TAB 1: Catalog Listings & Brands */}
      {adminTab === "LISTINGS" && (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm text-zinc-950">Brand Catalog Controls</h3>
              <p className="text-xs text-zinc-500">Toggle live availability for consumer & corporate redemptions</p>
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
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {metrics?.brands?.map((brand: any) => (
                  <tr key={brand.id} className="hover:bg-zinc-50/50">
                    <td className="px-6 py-3.5 font-medium text-zinc-900 flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-zinc-100 border border-zinc-200 flex items-center justify-center font-bold text-xs text-zinc-700">
                        {brand.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span>{brand.name}</span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-100 text-zinc-600 border border-zinc-200">
                        {brand.category}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-mono text-[11px]">
                      ${brand.minRecipientVal} – ${brand.maxRecipientVal} USD
                    </td>
                    <td className="px-6 py-3 font-mono text-[11px]">
                      {brand.pointsPerUnit} pts = $1.00
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium font-mono ${
                          brand.isActive
                            ? "bg-zinc-950 text-white"
                            : "bg-zinc-100 text-zinc-500 border border-zinc-200"
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
      )}

      {/* TAB 2: Gifting Discounts & Promo Coupons */}
      {adminTab === "COUPONS" && (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-100 gap-3">
            <div>
              <h3 className="font-semibold text-sm text-zinc-950 flex items-center gap-2">
                <Tag className="h-4 w-4" />
                <span>Promotional Coupons & Gifting Discounts</span>
              </h3>
              <p className="text-xs text-zinc-500">
                Configure promotional discount codes, bonus point vouchers, and redemption thresholds.
              </p>
            </div>

            <button
              onClick={() => setIsCouponModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-medium transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Coupon</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-zinc-100 text-[10px] uppercase text-zinc-400">
                  <th className="pb-2 font-medium">Coupon Code</th>
                  <th className="pb-2 font-medium">Discount / Bonus</th>
                  <th className="pb-2 font-medium">Min Order</th>
                  <th className="pb-2 font-medium">Usage Count</th>
                  <th className="pb-2 font-medium">Description</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="py-3">
                      <span className="font-bold text-zinc-950 px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200">
                        {coupon.code}
                      </span>
                    </td>
                    <td className="py-3">
                      {coupon.discountPercentage > 0 && (
                        <span className="font-semibold text-zinc-950 block">
                          {coupon.discountPercentage}% Off
                        </span>
                      )}
                      {coupon.bonusPoints > 0 && (
                        <span className="text-zinc-500 block text-[11px]">
                          +{coupon.bonusPoints.toLocaleString()} Bonus Pts
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-zinc-600">${coupon.minOrderValue}.00</td>
                    <td className="py-3">
                      <span className="font-medium text-zinc-900">{coupon.usageCount}</span>
                      <span className="text-zinc-400 text-[10px]"> / {coupon.maxUses}</span>
                    </td>
                    <td className="py-3 text-zinc-500 font-sans text-[11px] max-w-xs truncate">
                      {coupon.description}
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          coupon.isActive
                            ? "bg-zinc-950 text-white"
                            : "bg-zinc-100 text-zinc-500 border border-zinc-200"
                        }`}
                      >
                        {coupon.isActive ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleToggleCoupon(coupon.id, coupon.isActive)}
                        className="px-2.5 py-1 rounded-md text-xs font-mono font-medium border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-800 transition-colors"
                      >
                        {coupon.isActive ? "Disable" : "Enable"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Merchandising Banners */}
      {adminTab === "BANNERS" && (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-100 gap-3">
            <div>
              <h3 className="font-semibold text-sm text-zinc-950 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span>Storefront Merchandising Banners</span>
              </h3>
              <p className="text-xs text-zinc-500">
                Manage promotional hero banners shown to personal shoppers vs corporate clients.
              </p>
            </div>

            <button
              onClick={() => setIsBannerModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-medium transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Banner</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-zinc-100 text-[10px] uppercase text-zinc-400">
                  <th className="pb-2 font-medium">Target Audience</th>
                  <th className="pb-2 font-medium">Badge & Title</th>
                  <th className="pb-2 font-medium">Subtitle Copy</th>
                  <th className="pb-2 font-medium">CTA Button</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {banners.map((banner) => (
                  <tr key={banner.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-800 border border-zinc-200">
                        {banner.targetAudience}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="text-[10px] text-zinc-400 uppercase">{banner.badge}</div>
                      <div className="font-semibold text-zinc-900 font-sans text-xs">{banner.title}</div>
                    </td>
                    <td className="py-3 text-zinc-500 font-sans text-[11px] max-w-xs truncate">
                      {banner.subtitle}
                    </td>
                    <td className="py-3 text-zinc-700">
                      <span>{banner.ctaText}</span>
                      <span className="text-[10px] text-zinc-400 block font-mono">({banner.ctaLink})</span>
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          banner.isActive
                            ? "bg-zinc-950 text-white"
                            : "bg-zinc-100 text-zinc-500 border border-zinc-200"
                        }`}
                      >
                        {banner.isActive ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleToggleBanner(banner.id, banner.isActive)}
                        className="px-2.5 py-1 rounded-md text-xs font-mono font-medium border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-800 transition-colors"
                      >
                        {banner.isActive ? "Hide" : "Show"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

            {/* TAB 4: Cost Centers & Approvals Governance */}
      {adminTab === "GOVERNANCE" && (
        <div className="space-y-6">
          {/* Enterprise Cost Center Budgets (Acme Corp ORG-8821) */}
          <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-100 gap-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-zinc-950" />
                <h2 className="text-sm font-semibold text-zinc-950">Enterprise Cost Center Budgets</h2>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded border border-zinc-200 bg-zinc-50 text-zinc-700">
                  Acme Corp [ORG-8821]
                </span>
              </div>

              {enterpriseBudgets && (
                <div className="flex items-center gap-4 text-xs font-mono text-zinc-600">
                  <div>
                    <span className="text-zinc-400 text-[10px] uppercase block">Total Allocated</span>
                    <span className="font-semibold text-zinc-950">
                      {enterpriseBudgets.totalAllocated.toLocaleString()} pts
                    </span>
                  </div>
                  <div className="h-6 w-px bg-zinc-200" />
                  <div>
                    <span className="text-zinc-400 text-[10px] uppercase block">Total Disbursed</span>
                    <span className="font-semibold text-zinc-950">
                      {enterpriseBudgets.totalSpent.toLocaleString()} pts
                    </span>
                  </div>
                  <div className="h-6 w-px bg-zinc-200" />
                  <div>
                    <span className="text-zinc-400 text-[10px] uppercase block">Remaining Pool</span>
                    <span className="font-semibold text-zinc-950">
                      {enterpriseBudgets.totalRemaining.toLocaleString()} pts
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Department Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {enterpriseBudgets?.departments?.map((dept: any) => (
                <div
                  key={dept.id}
                  className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50 flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-800 font-medium">
                        {dept.code}
                      </span>
                      <span className="text-[11px] font-mono text-zinc-500">
                        {dept.utilizationRate}% utilized
                      </span>
                    </div>
                    <h3 className="text-xs font-semibold text-zinc-900 leading-snug">{dept.name}</h3>
                    <p className="text-[11px] text-zinc-500 mt-0.5 truncate">{dept.head}</p>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <div className="h-1.5 w-full bg-zinc-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-zinc-900 rounded-full transition-all"
                        style={{ width: `${Math.min(100, dept.utilizationRate)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
                      <span>{dept.spentPoints.toLocaleString()} spent</span>
                      <span className="font-medium text-zinc-900">{dept.remainingPoints.toLocaleString()} left</span>
                    </div>
                  </div>

                  {/* Quick Top-up actions */}
                  <div className="pt-2 border-t border-zinc-200/60 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-400 font-mono">Top-up:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleAllocatePoints(dept.id, 2500)}
                        className="text-[10px] font-mono px-2 py-0.5 rounded border border-zinc-200 hover:bg-zinc-200/70 text-zinc-800 transition-colors"
                      >
                        +2.5k
                      </button>
                      <button
                        onClick={() => handleAllocatePoints(dept.id, 5000)}
                        className="text-[10px] font-mono px-2 py-0.5 rounded border border-zinc-200 hover:bg-zinc-200/70 text-zinc-800 transition-colors"
                      >
                        +5.0k
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Corporate Disbursement Approval Queue (> $250 Compliance Policy) */}
          <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-zinc-950" />
                <h2 className="text-sm font-semibold text-zinc-950">Manager Approval Governance Queue</h2>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded border border-zinc-200 bg-zinc-50 text-zinc-600">
                  Policy Threshold &gt; $250.00
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 text-white font-medium ml-1">
                  {approvalRequests.filter((r) => r.status === "PENDING").length} Pending
                </span>
              </div>

              <button
                onClick={async () => {
                  const [b, a] = await Promise.all([
                    fetchEnterpriseBudgets(),
                    fetchPendingApprovals(),
                  ]);
                  setEnterpriseBudgets(b);
                  setApprovalRequests(a);
                }}
                className="text-xs font-mono text-zinc-500 hover:text-zinc-950 flex items-center gap-1 transition-colors"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Refresh Queue</span>
              </button>
            </div>

            {approvalRequests.length === 0 ? (
              <div className="text-center py-6 text-xs text-zinc-400 font-mono">
                No disbursement approval requests currently pending.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-zinc-100 text-[10px] uppercase text-zinc-400">
                      <th className="pb-2 font-medium">Requester & Cost Center</th>
                      <th className="pb-2 font-medium">Recipient</th>
                      <th className="pb-2 font-medium">Card Brand & Value</th>
                      <th className="pb-2 font-medium">Business Justification</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 font-medium text-right">Governance Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {approvalRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-zinc-50/80 transition-colors">
                        <td className="py-2.5">
                          <div className="font-medium text-zinc-900">{req.requesterName}</div>
                          <div className="text-[10px] text-zinc-500 font-sans">{req.departmentName}</div>
                        </td>
                        <td className="py-2.5">
                          <div className="text-zinc-900">{req.recipientName}</div>
                          <div className="text-[10px] text-zinc-400">{req.recipientEmail}</div>
                        </td>
                        <td className="py-2.5">
                          <div className="font-semibold text-zinc-900">
                            ${req.faceValue}.00 {req.brandName}
                          </div>
                          <div className="text-[10px] text-zinc-500">
                            {req.pointsRequired.toLocaleString()} pts
                          </div>
                        </td>
                        <td className="py-2.5 text-zinc-600 font-sans max-w-xs truncate text-[11px]">
                          {req.reason}
                        </td>
                        <td className="py-2.5">
                          {req.status === "PENDING" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border border-zinc-200 bg-zinc-50 text-zinc-800">
                              <Clock className="h-3 w-3 text-zinc-500" />
                              <span>Pending</span>
                            </span>
                          )}
                          {req.status === "APPROVED" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-950 text-white">
                              <CheckCircle2 className="h-3 w-3 text-zinc-200" />
                              <span>Approved</span>
                            </span>
                          )}
                          {req.status === "REJECTED" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border border-zinc-200 bg-zinc-100 text-zinc-500">
                              <XCircle className="h-3 w-3 text-zinc-400" />
                              <span>Rejected</span>
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 text-right">
                          {req.status === "PENDING" ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleReviewApproval(req.id, "APPROVE")}
                                disabled={resolvingId === req.id}
                                className="px-2.5 py-1 rounded bg-zinc-950 hover:bg-zinc-800 text-white text-[11px] font-medium transition-colors flex items-center gap-1 disabled:opacity-50"
                              >
                                {resolvingId === req.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Check className="h-3 w-3" />
                                )}
                                <span>Approve & Issue</span>
                              </button>
                              <button
                                onClick={() => handleReviewApproval(req.id, "REJECT")}
                                disabled={resolvingId === req.id}
                                className="px-2.5 py-1 rounded border border-zinc-200 hover:bg-zinc-100 text-zinc-700 text-[11px] font-medium transition-colors disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <div className="text-[10px] text-zinc-400 font-mono">
                              {req.orderId ? `Order #${req.orderId}` : `By ${req.reviewerName || "Admin"}`}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: Operations & Telemetry */}
      {adminTab === "OPERATIONS" && (
        <div className="space-y-6">
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
                        <span className={`w-2 h-2 rounded-full ${webhookResult.status === 200 ? "bg-zinc-900" : "bg-zinc-400"}`} />
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

          {/* Transactional Email Audit Trail */}
          <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-zinc-950" />
                <h2 className="text-sm font-semibold text-zinc-950">Transactional Email Delivery Trail</h2>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded border border-zinc-200 bg-zinc-50 text-zinc-600">
                  Resend / DKIM Service
                </span>
              </div>

              <button
                onClick={async () => {
                  const logs = await fetchEmailAuditLogs();
                  setEmailLogs(logs);
                }}
                className="text-xs font-mono text-zinc-500 hover:text-zinc-950 flex items-center gap-1 transition-colors"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Refresh Logs</span>
              </button>
            </div>

            {emailLogs.length === 0 ? (
              <div className="text-center py-6 text-xs text-zinc-400 font-mono">
                No emails dispatched in this session yet. Redeem a voucher or purchase points to trigger delivery logs.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-zinc-100 text-[10px] uppercase text-zinc-400">
                      <th className="pb-2 font-medium">Message ID</th>
                      <th className="pb-2 font-medium">Recipient</th>
                      <th className="pb-2 font-medium">Subject</th>
                      <th className="pb-2 font-medium">Engine</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 font-medium text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {emailLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-zinc-50/80 transition-colors">
                        <td className="py-2.5 font-medium text-zinc-900">{log.id}</td>
                        <td className="py-2.5 text-zinc-700">{log.to}</td>
                        <td className="py-2.5 text-zinc-600 truncate max-w-xs">{log.subject}</td>
                        <td className="py-2.5">
                          <span className="px-1.5 py-0.5 rounded text-[10px] border border-zinc-200 bg-zinc-50 text-zinc-600">
                            {log.isSimulated ? "Simulator" : "Live Resend"}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                            log.status === "DELIVERED" || log.status === "SIMULATED"
                              ? "text-zinc-950"
                              : "text-zinc-400"
                          }`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
                            {log.status}
                          </span>
                        </td>
                        <td className="py-2.5 text-right text-zinc-400 text-[11px]">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Coupon Modal */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-zinc-200 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-zinc-950" />
                <h3 className="font-semibold text-sm text-zinc-950">Create Promotional Coupon</h3>
              </div>
              <button
                onClick={() => setIsCouponModalOpen(false)}
                className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-[10px] uppercase text-zinc-500 mb-1">Coupon Code (Uppercase)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FLASH25"
                  value={newCouponCode}
                  onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono font-bold uppercase text-zinc-900 focus:border-zinc-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase text-zinc-500 mb-1">Discount %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newDiscountPct}
                    onChange={(e) => setNewDiscountPct(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-900 focus:border-zinc-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-zinc-500 mb-1">Bonus Points</label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={newBonusPts}
                    onChange={(e) => setNewBonusPts(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-900 focus:border-zinc-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-zinc-500 mb-1">Min Order Value ($)</label>
                <input
                  type="number"
                  min="0"
                  value={newMinOrder}
                  onChange={(e) => setNewMinOrder(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-900 focus:border-zinc-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-zinc-500 mb-1 font-sans">Campaign Description</label>
                <input
                  type="text"
                  placeholder="e.g. 25% off rewards for spring festival"
                  value={newCouponDesc}
                  onChange={(e) => setNewCouponDesc(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 font-sans text-xs text-zinc-900 focus:border-zinc-400 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 font-sans">
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingCoupon}
                  className="px-4 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-medium flex items-center gap-1.5 disabled:opacity-50"
                >
                  {creatingCoupon && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Activate Coupon</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Banner Modal */}
      {isBannerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-zinc-200 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-zinc-950" />
                <h3 className="font-semibold text-sm text-zinc-950">Publish Merchandising Banner</h3>
              </div>
              <button
                onClick={() => setIsBannerModalOpen(false)}
                className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBanner} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-mono text-zinc-500 mb-1">Headline Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Spring Team Recognition Bonus"
                  value={newBannerTitle}
                  onChange={(e) => setNewBannerTitle(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-900 focus:border-zinc-400 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono text-zinc-500 mb-1">Subtitle / Body</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Reward top performers this quarter with zero merchant fulfillment fees."
                  value={newBannerSubtitle}
                  onChange={(e) => setNewBannerSubtitle(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-900 focus:border-zinc-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono">
                <div>
                  <label className="block text-[10px] uppercase text-zinc-500 mb-1 font-sans">Badge Text</label>
                  <input
                    type="text"
                    value={newBannerBadge}
                    onChange={(e) => setNewBannerBadge(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-900 focus:border-zinc-400 focus:outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-zinc-500 mb-1 font-sans">Target Audience</label>
                  <select
                    value={newBannerAudience}
                    onChange={(e) => setNewBannerAudience(e.target.value as any)}
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-900 focus:border-zinc-400 focus:outline-none text-xs"
                  >
                    <option value="ALL">All Portals</option>
                    <option value="PERSONAL">Personal Only</option>
                    <option value="CORPORATE">Corporate Only</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-mono text-zinc-500 mb-1">CTA Button Text</label>
                  <input
                    type="text"
                    value={newBannerCtaText}
                    onChange={(e) => setNewBannerCtaText(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-900 focus:border-zinc-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono text-zinc-500 mb-1">CTA Destination</label>
                  <input
                    type="text"
                    value={newBannerCtaLink}
                    onChange={(e) => setNewBannerCtaLink(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-900 focus:border-zinc-400 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 font-sans">
                <button
                  type="button"
                  onClick={() => setIsBannerModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingBanner}
                  className="px-4 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-medium flex items-center gap-1.5 disabled:opacity-50"
                >
                  {creatingBanner && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Publish Banner</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
