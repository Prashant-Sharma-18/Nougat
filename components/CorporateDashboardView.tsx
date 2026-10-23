"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "./UserContext";
import { formatPoints, pointsToDollars } from "@/lib/utils";
import { 
  fetchEnterpriseBudgets, 
  allocateBudgetPoints, 
  fetchPendingApprovals, 
  resolveApprovalRequest 
} from "@/actions/enterprise";
import { 
  fetchAutomations, 
  toggleScheduleStatus, 
  triggerAutomationExecution 
} from "@/actions/automations";
import { fetchPromotionsData } from "@/actions/promotions";
import { 
  Building2, 
  Briefcase, 
  Clock, 
  ShieldCheck, 
  Users, 
  Layers, 
  Plus, 
  Check, 
  RotateCcw, 
  Loader2, 
  ArrowRight,
  ChevronRight,
  ExternalLink,
  Zap,
  Sliders,
  CreditCard,
  History,
  CheckCircle2,
  XCircle
} from "lucide-react";

export default function CorporateDashboardView({ initialBrands }: { initialBrands: any[] }) {
  const { currentUser, refreshUserData } = useUser();
  const [budgets, setBudgets] = useState<any | null>(null);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingApprovalId, setResolvingApprovalId] = useState<string | null>(null);
  const [executingSchedId, setExecutingSchedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; isError?: boolean } | null>(null);
  const [activeBanner, setActiveBanner] = useState<any | null>(null);

  const balance = currentUser?.pointBalance ?? 0;
  const dollarEquivalent = pointsToDollars(balance);

  const loadCorporateData = async () => {
    try {
      setLoading(true);
      const [budgetData, approvalData, automationsData, promosData] = await Promise.all([
        fetchEnterpriseBudgets(),
        fetchPendingApprovals(),
        fetchAutomations(),
        fetchPromotionsData(),
      ]);
      setBudgets(budgetData);
      setApprovals(approvalData);
      setSchedules(automationsData.schedules);
      const b = promosData.banners.find((x) => x.isActive && (x.targetAudience === "CORPORATE" || x.targetAudience === "ALL"));
      if (b) setActiveBanner(b);
    } catch (err: any) {
      console.error("Failed to load corporate dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCorporateData();
  }, []);

  const handleAllocate = async (deptId: string, pts: number) => {
    try {
      await allocateBudgetPoints({ departmentId: deptId, additionalPoints: pts });
      setFeedback({ message: `Successfully allocated +${pts.toLocaleString()} pts to cost center.` });
      const b = await fetchEnterpriseBudgets();
      setBudgets(b);
      setTimeout(() => setFeedback(null), 4000);
    } catch (e: any) {
      setFeedback({ message: e.message, isError: true });
    }
  };

  const handleResolveApproval = async (requestId: string, action: "APPROVE" | "REJECT") => {
    if (!currentUser) return;
    try {
      setResolvingApprovalId(requestId);
      await resolveApprovalRequest({
        requestId,
        action,
        reviewerName: "Corporate Finance Director",
        adminUserId: currentUser.id,
      });
      setFeedback({
        message: action === "APPROVE"
          ? "Corporate disbursement approved and digital card fulfilled."
          : "Disbursement request rejected per policy.",
      });
      await loadCorporateData();
      await refreshUserData();
      setTimeout(() => setFeedback(null), 4000);
    } catch (e: any) {
      setFeedback({ message: e.message, isError: true });
    } finally {
      setResolvingApprovalId(null);
    }
  };

  const handleTriggerAutomation = async (schedId: string) => {
    if (!currentUser) return;
    try {
      setExecutingSchedId(schedId);
      const res = await triggerAutomationExecution({
        scheduleId: schedId,
        adminUserId: currentUser.id,
      });
      if (res.success) {
        setFeedback({
          message: `Scheduled run complete: ${res.recipientsProcessed} vouchers dispatched (${res.totalPointsCharged.toLocaleString()} pts charged).`,
        });
        await loadCorporateData();
        await refreshUserData();
        setTimeout(() => setFeedback(null), 4000);
      }
    } catch (e: any) {
      setFeedback({ message: e.message, isError: true });
    } finally {
      setExecutingSchedId(null);
    }
  };

  const pendingApprovalsCount = approvals.filter((a) => a.status === "PENDING").length;
  const activeSchedulesCount = schedules.filter((s) => s.status === "ACTIVE").length;

  return (
    <div className="space-y-8">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between shadow-xs animate-in fade-in ${
            feedback.isError ? "bg-zinc-100 border border-zinc-300 text-zinc-900" : "bg-zinc-950 text-white"
          }`}
        >
          <span>{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-[11px] font-mono text-zinc-400 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Enterprise Executive Cockpit Header */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 sm:p-8 shadow-xs card-hover-subtle">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-zinc-950 text-white font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                Enterprise Corporate Portal
              </span>
              <span className="text-[11px] font-mono text-zinc-500">
                Workspace: Acme Corporation [ORG-8821]
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950 leading-tight">
              Workforce Gifting & Cost Center Governance.
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
              Disburse digital rewards to team members, supervise departmental budgets, govern high-value managerial approvals (&gt; $250 policy), and maintain automated incentive schedules.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] font-mono text-zinc-500">
              <span className="flex items-center gap-1.5 text-zinc-800">
                <CheckCircle2 className="h-3.5 w-3.5 text-zinc-950" />
                <span>Dual Provider Failover (Tremendous + Reloadly)</span>
              </span>
              <span className="flex items-center gap-1.5 text-zinc-800">
                <CheckCircle2 className="h-3.5 w-3.5 text-zinc-950" />
                <span>Split-Tender Co-Pay Enabled</span>
              </span>
            </div>
          </div>

          {/* Treasury Telemetry Card */}
          <div className="lg:w-96 shrink-0 bg-zinc-50 rounded-2xl border border-zinc-200 p-5 space-y-4 shadow-xs">
            <div className="flex items-start justify-between border-b border-zinc-200/80 pb-3">
              <div>
                <span className="text-[10px] uppercase font-mono text-zinc-500 tracking-wider block">
                  Corporate Treasury Balance
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
                  Pool Equivalent
                </span>
                <span className="text-base font-semibold font-mono text-zinc-900 tabular-nums block mt-0.5">
                  ${dollarEquivalent.toFixed(2)} USD
                </span>
              </div>
            </div>

            <div className="space-y-1.5 text-[11px] font-mono text-zinc-600">
              <div className="flex justify-between items-center py-0.5">
                <span>Credit Line Authorized:</span>
                <span className="font-semibold text-zinc-900">$25,000.00</span>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span>Primary Routing:</span>
                <span className="font-semibold text-zinc-900">Tremendous API v2</span>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span>Secondary Failover:</span>
                <span className="font-semibold text-zinc-900">Reloadly Engine</span>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-200/80 flex items-center justify-between">
              <Link
                href="/corporate/team"
                className="text-xs font-sans font-semibold text-zinc-950 hover:underline flex items-center gap-1"
              >
                <span>Team Roster & Gifting</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/bulk-rewards"
                className="text-[11px] font-mono text-zinc-500 hover:text-zinc-900"
              >
                Bulk CSV Run
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-zinc-200 bg-white shadow-xs space-y-1.5 card-hover-subtle">
          <span className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider block">Total Budget Pool</span>
          <div className="text-2xl font-bold font-mono text-zinc-950 tabular-nums">
            {budgets?.totalAllocated?.toLocaleString() ?? "50,000"} <span className="text-xs text-zinc-400 font-normal">pts</span>
          </div>
          <span className="text-[11px] text-zinc-500 font-mono block">Across 4 Cost Centers</span>
        </div>

        <div className="p-5 rounded-2xl border border-zinc-200 bg-white shadow-xs space-y-1.5 card-hover-subtle">
          <span className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider block">Disbursed Spend</span>
          <div className="text-2xl font-bold font-mono text-zinc-950 tabular-nums">
            {budgets?.totalSpent?.toLocaleString() ?? "19,200"} <span className="text-xs text-zinc-400 font-normal">pts</span>
          </div>
          <span className="text-[11px] text-zinc-500 font-mono block">
            {budgets?.totalAllocated ? Math.round((budgets.totalSpent / budgets.totalAllocated) * 100) : 0}% Budget Utilized
          </span>
        </div>

        <div className="p-5 rounded-2xl border border-zinc-200 bg-white shadow-xs space-y-1.5 card-hover-subtle">
          <span className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider block">Pending Approvals</span>
          <div className="text-2xl font-bold font-mono text-zinc-950 tabular-nums">
            {pendingApprovalsCount}
          </div>
          <span className="text-[11px] text-zinc-500 font-mono block">High-Value Threshold &gt; $250</span>
        </div>

        <div className="p-5 rounded-2xl border border-zinc-200 bg-white shadow-xs space-y-1.5 card-hover-subtle">
          <span className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider block">Active Automations</span>
          <div className="text-2xl font-bold font-mono text-zinc-950 tabular-nums">
            {activeSchedulesCount}
          </div>
          <span className="text-[11px] text-zinc-500 font-mono block">Automated Monthly Pipelines</span>
        </div>
      </div>

      {/* Featured Banner: Team Directory & Team Member Gifting */}
      <div className="bg-zinc-950 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 border border-zinc-800">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-zinc-800 text-zinc-200 border border-zinc-700">
              Team Member Gifting
            </span>
            <span className="text-[11px] font-mono text-zinc-400">Acme Corp Workforce Roster</span>
          </div>
          <h2 className="text-lg font-bold tracking-tight text-white">
            Send Gift Cards Directly to Listed Team Members
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Choose any colleague from your company team directory, select from active merchant brands, include a personalized recognition message, and disburse instantly from your department cost center.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 shrink-0">
          <Link
            href="/corporate/team"
            className="py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs"
          >
            <Users className="h-4 w-4" />
            <span>Open Team Directory & Gifting</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Dynamic Corporate Merchandising Banner (Admin Managed) */}
      {activeBanner && (
        <div className="bg-white rounded-2xl p-6 border border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-xs">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-zinc-100 text-zinc-800 border border-zinc-200 font-medium">
                {activeBanner.badge}
              </span>
              <span className="text-[11px] font-mono text-zinc-500">Corporate Campaign</span>
            </div>
            <h3 className="text-base font-bold tracking-tight text-zinc-950">
              {activeBanner.title}
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              {activeBanner.subtitle}
            </p>
          </div>

          <div className="shrink-0">
            <Link
              href={activeBanner.ctaLink}
              className="py-2.5 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs"
            >
              <span>{activeBanner.ctaText}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Department Cost Center Budgets Grid */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs space-y-5 card-hover-subtle">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-zinc-950 text-white flex items-center justify-center">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-950">Department Cost Center Budgets</h2>
              <span className="text-[11px] text-zinc-500">Autonomous departmental budget allocations</span>
            </div>
          </div>

          <Link
            href="/corporate/team"
            className="text-xs font-mono text-zinc-600 hover:text-zinc-950 flex items-center gap-1 font-medium"
          >
            <span>Team Gifting Roster</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {budgets?.departments?.map((dept: any) => (
            <div
              key={dept.id}
              className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/70 hover:bg-zinc-50 hover:border-zinc-300 transition-all flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-800 font-bold">
                    {dept.code}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-600 font-medium">
                    {dept.utilizationRate}% used
                  </span>
                </div>
                <h3 className="text-xs font-bold text-zinc-950 leading-snug">{dept.name}</h3>
                <p className="text-[11px] text-zinc-500 mt-0.5 truncate">{dept.head}</p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="h-2 w-full bg-zinc-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-zinc-950 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, dept.utilizationRate)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
                  <span>{dept.spentPoints.toLocaleString()} spent</span>
                  <span className="font-semibold text-zinc-900">{dept.remainingPoints.toLocaleString()} remaining</span>
                </div>
              </div>

              {/* Instant Top-up buttons */}
              <div className="pt-2 border-t border-zinc-200/80 flex items-center justify-between">
                <span className="text-[10px] text-zinc-500 font-mono">Grant Points:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleAllocate(dept.id, 2500)}
                    className="text-[10px] font-mono px-2 py-1 rounded-md border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-900 font-medium transition-colors shadow-xs"
                  >
                    +2.5k
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAllocate(dept.id, 5000)}
                    className="text-[10px] font-mono px-2 py-1 rounded-md border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-900 font-medium transition-colors shadow-xs"
                  >
                    +5.0k
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dual Governance Grid: Manager Approvals Queue + Scheduled Automations Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Manager Approvals Queue */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs space-y-4 flex flex-col justify-between card-hover-subtle">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-zinc-950" />
                <h3 className="text-sm font-bold text-zinc-950">Manager Approval Queue</h3>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-zinc-950 text-white font-medium">
                  {pendingApprovalsCount} Pending
                </span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">Policy &gt; $250.00</span>
            </div>

            {approvals.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-400 font-mono">
                No corporate approvals currently pending.
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 max-h-80 overflow-y-auto">
                {approvals.map((req) => (
                  <div key={req.id} className="py-3.5 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-zinc-950">{req.recipientName}</span>
                        <span className="text-[10px] font-mono text-zinc-500">({req.departmentName.split(" ")[0]})</span>
                      </div>
                      <div className="text-[11px] text-zinc-600 font-sans truncate max-w-xs mt-0.5">
                        ${req.faceValue} {req.brandName} • {req.reason}
                      </div>
                    </div>

                    <div>
                      {req.status === "PENDING" ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleResolveApproval(req.id, "APPROVE")}
                            disabled={resolvingApprovalId === req.id}
                            className="px-2.5 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-[11px] font-medium transition-colors flex items-center gap-1 shadow-xs"
                          >
                            {resolvingApprovalId === req.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                            <span>Approve</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResolveApproval(req.id, "REJECT")}
                            disabled={resolvingApprovalId === req.id}
                            className="px-2.5 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 text-zinc-700 text-[11px] font-medium transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded ${
                          req.status === "APPROVED" ? "bg-zinc-950 text-white" : "bg-zinc-100 text-zinc-500"
                        }`}>
                          {req.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-zinc-100 text-right">
            <Link
              href="/orders"
              className="text-xs font-mono text-zinc-600 hover:text-zinc-950 inline-flex items-center gap-1 font-medium"
            >
              <span>Fulfillment & Audit Orders</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Right: Scheduled Recurring Automations */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs space-y-4 flex flex-col justify-between card-hover-subtle">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-zinc-950" />
                <h3 className="text-sm font-bold text-zinc-950">Active Recurring Automations</h3>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-zinc-950 text-white font-medium">
                  {activeSchedulesCount} Active
                </span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">Monthly Run</span>
            </div>

            <div className="divide-y divide-zinc-100 max-h-80 overflow-y-auto">
              {schedules.map((s) => (
                <div key={s.id} className="py-3.5 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-zinc-950">{s.name}</span>
                      <span className="text-[10px] font-mono uppercase bg-zinc-100 px-2 py-0.5 rounded text-zinc-700 font-medium">
                        {s.frequency}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                      ${s.amountPerRecipient} {s.brandName} • {s.recipients.length} recipients ({s.departmentName.split(" ")[0]})
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleTriggerAutomation(s.id)}
                    disabled={executingSchedId === s.id}
                    className="px-3 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-[11px] font-medium transition-colors flex items-center gap-1.5 shrink-0 disabled:opacity-50 shadow-xs"
                  >
                    {executingSchedId === s.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Zap className="h-3 w-3" />
                    )}
                    <span>Run Now</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-100 text-right">
            <Link
              href="/bulk-rewards"
              className="text-xs font-mono text-zinc-600 hover:text-zinc-950 inline-flex items-center gap-1 font-medium"
            >
              <span>Manage Bulk Schedules & Logs</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Corporate Action Command Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Link
          href="/corporate/team"
          className="p-5 rounded-2xl border border-zinc-200 bg-white hover:border-zinc-300 transition-all shadow-xs flex items-center justify-between group card-hover-subtle"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-950 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-zinc-950 block">Team Directory</span>
              <span className="text-[11px] text-zinc-500">1-click gift card sending</span>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:text-zinc-950 transition-colors" />
        </Link>

        <Link
          href="/bulk-rewards"
          className="p-5 rounded-2xl border border-zinc-200 bg-white hover:border-zinc-300 transition-all shadow-xs flex items-center justify-between group card-hover-subtle"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-950 flex items-center justify-center shrink-0">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-zinc-950 block">Bulk Batch Runs</span>
              <span className="text-[11px] text-zinc-500">Spreadsheet CSV payouts</span>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:text-zinc-950 transition-colors" />
        </Link>

        <Link
          href="/history"
          className="p-5 rounded-2xl border border-zinc-200 bg-white hover:border-zinc-300 transition-all shadow-xs flex items-center justify-between group card-hover-subtle"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-950 flex items-center justify-center shrink-0">
              <History className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-zinc-950 block">Settlement Ledger</span>
              <span className="text-[11px] text-zinc-500">Double-entry audit trail</span>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:text-zinc-950 transition-colors" />
        </Link>

        <Link
          href="/scanner"
          className="p-5 rounded-2xl border border-zinc-200 bg-white hover:border-zinc-300 transition-all shadow-xs flex items-center justify-between group card-hover-subtle"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-950 flex items-center justify-center shrink-0">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-zinc-950 block">POS Terminal</span>
              <span className="text-[11px] text-zinc-500">Simulate store redemption</span>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:text-zinc-950 transition-colors" />
        </Link>
      </div>
    </div>
  );
}

