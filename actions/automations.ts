"use server";

import { prisma } from "@/lib/prisma";
import { 
  listAutomationSchedules, 
  listAutomationLogs, 
  setAutomationScheduleStatus, 
  recordAutomationLog, 
  advanceScheduleNextRun,
  AutomationSchedule, 
  AutomationRunLog 
} from "@/lib/enterprise/automations";
import { deductDepartmentSpend, listDepartments } from "@/lib/enterprise/budgets";
import { redeemPointsForCard } from "@/actions/redeem";
import { createNotification } from "@/actions/notifications";
import { revalidatePath } from "next/cache";

export async function fetchAutomations(): Promise<{
  schedules: AutomationSchedule[];
  logs: AutomationRunLog[];
}> {
  return {
    schedules: listAutomationSchedules(),
    logs: listAutomationLogs(),
  };
}

export async function toggleScheduleStatus(scheduleId: string, active: boolean) {
  const updated = setAutomationScheduleStatus(scheduleId, active ? "ACTIVE" : "PAUSED");
  revalidatePath("/bulk-rewards");
  revalidatePath("/admin");
  return { success: true, schedule: updated };
}

export async function triggerAutomationExecution({
  scheduleId,
  adminUserId,
}: {
  scheduleId: string;
  adminUserId: string;
}): Promise<{
  success: boolean;
  orderIds: string[];
  totalPointsCharged: number;
  recipientsProcessed: number;
  log: AutomationRunLog;
}> {
  const schedules = listAutomationSchedules();
  const schedule = schedules.find((s) => s.id === scheduleId);
  if (!schedule) {
    throw new Error(`Automation schedule '${scheduleId}' not found.`);
  }

  const user = await prisma.user.findUnique({
    where: { id: adminUserId },
  });
  if (!user) {
    throw new Error("Admin / corporate execution account not found.");
  }

  const pointsPerRecipient = Math.round(schedule.amountPerRecipient * 100);
  const totalPointsRequired = pointsPerRecipient * schedule.recipients.length;

  // Verify corporate points balance
  if (user.pointBalance < totalPointsRequired) {
    throw new Error(
      `Insufficient corporate pool: Need ${totalPointsRequired.toLocaleString()} pts, current balance is ${user.pointBalance.toLocaleString()} pts.`
    );
  }

  const fulfilledOrderIds: string[] = [];
  const errors: string[] = [];

  for (const recipient of schedule.recipients) {
    try {
      const order = await redeemPointsForCard({
        userId: adminUserId,
        brandId: schedule.brandId,
        faceValue: schedule.amountPerRecipient,
        isGift: true,
        recipientName: recipient.name,
        recipientEmail: recipient.email,
        giftMessage: `Automated Disbursement: ${schedule.name} (${schedule.departmentName})`,
        bypass2Fa: true, // Automated pre-authorized enterprise schedule
        skipVelocityCheck: true,
      });
      fulfilledOrderIds.push(order.orderId);
    } catch (err: any) {
      errors.push(`${recipient.name}: ${err.message}`);
    }
  }

  const processedCount = fulfilledOrderIds.length;
  const actualPointsCharged = processedCount * pointsPerRecipient;

  // Deduct from cost center spend
  if (actualPointsCharged > 0) {
    deductDepartmentSpend(schedule.departmentId, actualPointsCharged);
    advanceScheduleNextRun(schedule.id, actualPointsCharged, processedCount);
  }

  const logStatus = errors.length === 0 ? "SUCCESS" : processedCount > 0 ? "PARTIAL" : "FAILED";
  const logDetails = `Automated run for '${schedule.name}'. Dispatched ${processedCount}/${schedule.recipients.length} cards ($${schedule.amountPerRecipient} ${schedule.brandName}). Total: ${actualPointsCharged.toLocaleString()} pts charged to ${schedule.departmentName}.`;

  const log = recordAutomationLog({
    scheduleId: schedule.id,
    scheduleName: schedule.name,
    departmentId: schedule.departmentId,
    recipientsProcessed: processedCount,
    pointsCharged: actualPointsCharged,
    status: logStatus,
    details: logDetails,
  });

  try {
    await createNotification({
      userId: adminUserId,
      title: "Scheduled Automation Executed",
      message: `Run complete for '${schedule.name}'. ${processedCount} vouchers fulfilled.`,
      type: "ORDER",
      link: "/bulk-rewards",
    });
  } catch (e) {
    // Non-blocking
  }

  revalidatePath("/bulk-rewards");
  revalidatePath("/admin");
  revalidatePath("/orders");
  revalidatePath("/wallet");

  return {
    success: processedCount > 0,
    orderIds: fulfilledOrderIds,
    totalPointsCharged: actualPointsCharged,
    recipientsProcessed: processedCount,
    log,
  };
}

