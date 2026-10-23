import { deductDepartmentSpend, listDepartments } from "@/lib/enterprise/budgets";

export type ScheduleFrequency = "MONTHLY" | "QUARTERLY" | "ANNIVERSARY";

export interface ScheduledRecipient {
  name: string;
  email: string;
}

export interface AutomationSchedule {
  id: string;
  name: string;
  frequency: ScheduleFrequency;
  departmentId: string;
  departmentName: string;
  brandId: string;
  brandName: string;
  amountPerRecipient: number;
  recipients: ScheduledRecipient[];
  status: "ACTIVE" | "PAUSED";
  nextRunAt: string;
  lastRunAt?: string;
  totalDisbursedCount: number;
  totalPointsDisbursed: number;
}

export interface AutomationRunLog {
  id: string;
  scheduleId: string;
  scheduleName: string;
  executedAt: string;
  recipientsProcessed: number;
  pointsCharged: number;
  departmentId: string;
  status: "SUCCESS" | "FAILED" | "PARTIAL";
  details: string;
}

// In-memory automation state for Acme Corp [ORG-8821]
let automationSchedules: AutomationSchedule[] = [
  {
    id: "sched_monthly_eng",
    name: "Cloud Infrastructure On-Call Stipend",
    frequency: "MONTHLY",
    departmentId: "dept_eng",
    departmentName: "Engineering & Cloud Infrastructure",
    brandId: "prod_amazon_us",
    brandName: "Amazon",
    amountPerRecipient: 50,
    recipients: [
      { name: "Devon Vance", email: "devon.v@acmecorp.internal" },
      { name: "Kavita Nair", email: "kavita.n@acmecorp.internal" },
      { name: "Marcus Brody", email: "marcus.b@acmecorp.internal" },
    ],
    status: "ACTIVE",
    nextRunAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    lastRunAt: new Date(Date.now() - 23 * 24 * 3600 * 1000).toISOString(),
    totalDisbursedCount: 6,
    totalPointsDisbursed: 30000,
  },
  {
    id: "sched_q3_sales",
    name: "Enterprise Quota Overachievers Club",
    frequency: "QUARTERLY",
    departmentId: "dept_sales",
    departmentName: "Global Sales & Strategic Partnerships",
    brandId: "prod_apple_us",
    brandName: "Apple",
    amountPerRecipient: 100,
    recipients: [
      { name: "Elena Rostova", email: "elena.r@acmecorp.internal" },
      { name: "David Miller", email: "david.m@acmecorp.internal" },
    ],
    status: "ACTIVE",
    nextRunAt: new Date(Date.now() + 18 * 24 * 3600 * 1000).toISOString(),
    lastRunAt: new Date(Date.now() - 72 * 24 * 3600 * 1000).toISOString(),
    totalDisbursedCount: 4,
    totalPointsDisbursed: 40000,
  },
  {
    id: "sched_csat_ops",
    name: "Customer Operations CSAT Spot Grant",
    frequency: "MONTHLY",
    departmentId: "dept_ops",
    departmentName: "Customer Operations & Support",
    brandId: "prod_starbucks_us",
    brandName: "Starbucks",
    amountPerRecipient: 25,
    recipients: [
      { name: "Rachel Adams", email: "rachel.a@acmecorp.internal" },
      { name: "Tariq Mansoor", email: "tariq.m@acmecorp.internal" },
    ],
    status: "ACTIVE",
    nextRunAt: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
    lastRunAt: new Date(Date.now() - 27 * 24 * 3600 * 1000).toISOString(),
    totalDisbursedCount: 8,
    totalPointsDisbursed: 20000,
  },
];

let automationLogs: AutomationRunLog[] = [
  {
    id: "log_init_01",
    scheduleId: "sched_monthly_eng",
    scheduleName: "Cloud Infrastructure On-Call Stipend",
    executedAt: new Date(Date.now() - 23 * 24 * 3600 * 1000).toISOString(),
    recipientsProcessed: 3,
    pointsCharged: 15000,
    departmentId: "dept_eng",
    status: "SUCCESS",
    details: "Dispatched $50 Amazon vouchers to 3 engineers. Cost center ENG-401 charged.",
  },
  {
    id: "log_init_02",
    scheduleId: "sched_csat_ops",
    scheduleName: "Customer Operations CSAT Spot Grant",
    executedAt: new Date(Date.now() - 27 * 24 * 3600 * 1000).toISOString(),
    recipientsProcessed: 2,
    pointsCharged: 5000,
    departmentId: "dept_ops",
    status: "SUCCESS",
    details: "Dispatched $25 Starbucks vouchers to 2 specialists. Cost center OPS-103 charged.",
  },
];

export function listAutomationSchedules(): AutomationSchedule[] {
  return automationSchedules.map((s) => ({
    ...s,
    recipients: s.recipients.map((r) => ({ ...r })),
  }));
}

export function listAutomationLogs(): AutomationRunLog[] {
  return [...automationLogs];
}

export function setAutomationScheduleStatus(
  scheduleId: string,
  status: "ACTIVE" | "PAUSED"
): AutomationSchedule {
  const sched = automationSchedules.find((s) => s.id === scheduleId);
  if (!sched) {
    throw new Error(`Automation schedule '${scheduleId}' not found.`);
  }
  sched.status = status;
  return { ...sched };
}

export function recordAutomationLog(entry: Omit<AutomationRunLog, "id" | "executedAt">): AutomationRunLog {
  const log: AutomationRunLog = {
    ...entry,
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    executedAt: new Date().toISOString(),
  };
  automationLogs.unshift(log);
  return log;
}

export function advanceScheduleNextRun(scheduleId: string, totalPoints: number, recipientsCount: number) {
  const sched = automationSchedules.find((s) => s.id === scheduleId);
  if (!sched) return;

  const now = Date.now();
  sched.lastRunAt = new Date(now).toISOString();
  sched.totalDisbursedCount += recipientsCount;
  sched.totalPointsDisbursed += totalPoints;

  // Advance next run
  const intervalDays = sched.frequency === "QUARTERLY" ? 90 : 30;
  sched.nextRunAt = new Date(now + intervalDays * 24 * 3600 * 1000).toISOString();
}

