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

  const balance = currentUser?.pointBalance ?? 0;
  const dollarEquivalent = pointsToDollars(balance);

  const loadCorporateData = async () => {
    try {
      setLoading(true);
      const [budgetData, approvalData, automationsData] = await Promise.all([
        fetchEnterpriseBudgets(),
        fetchPendingApprovals(),
        fetchAutomations(),
      ]);
      setBudgets(budgetData);
      setApprovals(approvalData);
      setSchedules(automationsData.schedules);
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
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-zinc-950 text-white font-medium">
                Enterprise Executive Cockpit
              </span>
              <span className="text-[11px] font-mono text-zinc-500">
                Organization: Acme Corp [ORG-8821]
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">
              Workforce Rewards & Cost Center Governance.
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
              Allocate department points budgets, supervise high-value disbursement requests (&gt; $250 policy threshold), and manage automated employee incentive schedules.
            </p>
          </div>

          {/* Treasury Telemetry Card */}
          <div className="lg:w-96 shrink-0 bg-zinc-50 rounded-xl border border-zinc-200 p-5 space-y-3.5 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-2.5">
              <div>
                <span className="text-[10px] uppercase text-zinc-400 block">Corporate Treasury Pool</span>
                <span className="text-xl font-bold text-zinc-950">{formatPoints(balance)} pts</span>
              </div>
              <span className="text-right text-zinc-500 text-[11px] block">
                ~ ${dollarEquivalent.toFixed(2)} USD
              </span>
            </div>

            <div className="space-y-1.5 text-[11px] text-zinc-600">
              <div className="flex justify-between">
                <span>Credit Co-Pay Line:</span>
                <span className="font-semibold text-zinc-900">$25,000 Authorized</span>
              </div>
              <div className="flex justify-between">
                <span>Fulfillment Engine:</span>
                <span className="font-semibold text-zinc-900">Tremendous API v2</span>
              </div>
              <div className="flex justify-between">
                <span>Failover Router:</span>
                <span className="font-semibold text-zinc-900">Reloadly Active</span>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-200 flex items-center justify-between">
              <Link
                href="/bulk-rewards"
                className="text-xs font-sans font-semibold text-zinc-950 hover:underline flex items-center gap-1"
              >
                <span>Bulk Distribution Portal</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/admin"
                className="text-[11px] font-sans text-zinc-500 hover:text-zinc-900"
              >
                Admin Console
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-zinc-200 bg-white shadow-xs space-y-1">
          <span className="text-[10px] font-mono uppercase text-zinc-500 block">Total Budget Pool</span>
          <div className="text-xl font-bold font-mono text-zinc-950">
            {budgets?.totalAllocated?.toLocaleString() ?? "50,000"} pts
          </div>
          <span className="text-[11px] text-zinc-400 font-mono block">4 Cost Centers</span>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 bg-white shadow-xs space-y-1">
          <span className="text-[10px] font-mono uppercase text-zinc-500 block">Disbursed Spend</span>
          <div className="text-xl font-bold font-mono text-zinc-950">
            {budgets?.totalSpent?.toLocaleString() ?? "19,200"} pts
          </div>
          <span className="text-[11px] text-zinc-400 font-mono block">
            {budgets?.totalAllocated ? Math.round((budgets.totalSpent / budgets.totalAllocated) * 100) : 0}% Utilized
          </span>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 bg-white shadow-xs space-y-1">
          <span className="text-[10px] font-mono uppercase text-zinc-500 block">Pending Approvals</span>
          <div className="text-xl font-bold font-mono text-zinc-950">
            {pendingApprovalsCount}
          </div>
          <span className="text-[11px] text-zinc-400 font-mono block">Policy &gt; $250.00</span>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 bg-white shadow-xs space-y-1">
          <span className="text-[10px] font-mono uppercase text-zinc-500 block">Active Automations</span>
          <div className="text-xl font-bold font-mono text-zinc-950">
            {activeSchedulesCount}
          </div>
          <span className="text-[11px] text-zinc-400 font-mono block">Auto-disbursed monthly</span>
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

      {/* Department Cost Center Budgets Grid */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-zinc-950" />
            <h2 className="text-sm font-semibold text-zinc-950">Department Cost Center Budgets</h2>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded border border-zinc-200 bg-zinc-50 text-zinc-700">
              Acme Corp [ORG-8821]
            </span>
          </div>

          <Link
            href="/admin"
            className="text-xs font-mono text-zinc-500 hover:text-zinc-950 flex items-center gap-1"
          >
            <span>Manage Cost Centers</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {budgets?.departments?.map((dept: any) => (
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

              {/* Progress Bar */}
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

              {/* Instant Top-up buttons */}
              <div className="pt-2 border-t border-zinc-200/60 flex items-center justify-between">
                <span className="text-[10px] text-zinc-400 font-mono">Top-up:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleAllocate(dept.id, 2500)}
                    className="text-[10px] font-mono px-2 py-0.5 rounded border border-zinc-200 hover:bg-zinc-200/70 text-zinc-800 transition-colors"
                  >
                    +2.5k
                  </button>
                  <button
                    onClick={() => handleAllocate(dept.id, 5000)}
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

      {/* Dual Governance Grid: Manager Approvals Queue + Scheduled Automations Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Manager Approvals Queue */}
        <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-zinc-950" />
                <h3 className="text-xs font-semibold text-zinc-950">Manager Approval Queue</h3>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-zinc-900 text-white font-medium">
                  {pendingApprovalsCount} Pending
                </span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">Policy &gt; $250</span>
            </div>

            {approvals.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-400 font-mono">
                No corporate approvals currently pending.
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 max-h-80 overflow-y-auto">
                {approvals.map((req) => (
                  <div key={req.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-zinc-900">{req.recipientName}</span>
                        <span className="text-[10px] font-mono text-zinc-400">({req.departmentName.split(" ")[0]})</span>
                      </div>
                      <div className="text-[11px] text-zinc-500 font-sans truncate max-w-xs mt-0.5">
                        ${req.faceValue} {req.brandName} • {req.reason}
                      </div>
                    </div>

                    <div>
                      {req.status === "PENDING" ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleResolveApproval(req.id, "APPROVE")}
                            disabled={resolvingApprovalId === req.id}
                            className="px-2 py-1 rounded bg-zinc-950 hover:bg-zinc-800 text-white text-[10px] font-medium transition-colors flex items-center gap-1"
                          >
                            {resolvingApprovalId === req.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleResolveApproval(req.id, "REJECT")}
                            disabled={resolvingApprovalId === req.id}
                            className="px-2 py-1 rounded border border-zinc-200 hover:bg-zinc-100 text-zinc-700 text-[10px] font-medium transition-colors"
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
              href="/admin"
              className="text-xs font-mono text-zinc-500 hover:text-zinc-950 inline-flex items-center gap-1"
            >
              <span>Full Audit Queue</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Right: Scheduled Recurring Automations */}
        <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-zinc-950" />
                <h3 className="text-xs font-semibold text-zinc-950">Active Recurring Automations</h3>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-zinc-900 text-white font-medium">
                  {activeSchedulesCount} Active
                </span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">Auto-Disbursed</span>
            </div>

            <div className="divide-y divide-zinc-100 max-h-80 overflow-y-auto">
              {schedules.map((s) => (
                <div key={s.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-zinc-900">{s.name}</span>
                      <span className="text-[10px] font-mono uppercase bg-zinc-100 px-1.5 py-0.2 rounded text-zinc-700">
                        {s.frequency}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                      ${s.amountPerRecipient} {s.brandName} • {s.recipients.length} recipients ({s.departmentName.split(" ")[0]})
                    </div>
                  </div>

                  <button
                    onClick={() => handleTriggerAutomation(s.id)}
                    disabled={executingSchedId === s.id}
                    className="px-2.5 py-1 rounded bg-zinc-950 hover:bg-zinc-800 text-white text-[10px] font-medium transition-colors flex items-center gap-1 shrink-0 disabled:opacity-50"
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
              className="text-xs font-mono text-zinc-500 hover:text-zinc-950 inline-flex items-center gap-1"
            >
              <span>Manage Schedules & Logs</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Corporate Action Command Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Link
          href="/bulk-rewards"
          className="p-4 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors shadow-xs flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <Users className="h-4 w-4 text-zinc-700" />
            <div>
              <span className="text-xs font-semibold text-zinc-950 block">Bulk Batch Disburser</span>
              <span className="text-[10px] text-zinc-400 font-mono">Spreadsheet CSV Import</span>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
        </Link>

        <Link
          href="/admin"
          className="p-4 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors shadow-xs flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <Sliders className="h-4 w-4 text-zinc-700" />
            <div>
              <span className="text-xs font-semibold text-zinc-950 block">Admin Console</span>
              <span className="text-[10px] text-zinc-400 font-mono">Cost Centers & Supply</span>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
        </Link>

        <Link
          href="/history"
          className="p-4 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors shadow-xs flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <History className="h-4 w-4 text-zinc-700" />
            <div>
              <span className="text-xs font-semibold text-zinc-950 block">Double-Entry Ledger</span>
              <span className="text-[10px] text-zinc-400 font-mono">Audit Statements</span>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
        </Link>

        <Link
          href="/scanner"
          className="p-4 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors shadow-xs flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <CreditCard className="h-4 w-4 text-zinc-700" />
            <div>
              <span className="text-xs font-semibold text-zinc-950 block">POS Terminal</span>
              <span className="text-[10px] text-zinc-400 font-mono">Barcode Scanner</span>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
        </Link>
      </div>
    </div>
  );
}

