"use server";

import { prisma } from "@/lib/prisma";
import {
  listDepartments,
  listApprovalRequests,
  addDepartmentPoints,
  deductDepartmentSpend,
  createApprovalRecord,
  updateApprovalRecord,
  DepartmentBudget,
  ApprovalRequest,
} from "@/lib/enterprise/budgets";
import { redeemPointsForCard } from "@/actions/redeem";
import { createNotification } from "@/actions/notifications";
import { revalidatePath } from "next/cache";

export async function fetchEnterpriseBudgets(): Promise<{
  departments: (DepartmentBudget & { utilizationRate: number; remainingPoints: number })[];
  totalAllocated: number;
  totalSpent: number;
  totalRemaining: number;
}> {
  const depts = listDepartments().map((d) => {
    const remaining = Math.max(0, d.allocatedPoints - d.spentPoints);
    const rate = d.allocatedPoints > 0 ? Math.round((d.spentPoints / d.allocatedPoints) * 100) : 0;
    return {
      ...d,
      remainingPoints: remaining,
      utilizationRate: rate,
    };
  });

  const totalAllocated = depts.reduce((sum, d) => sum + d.allocatedPoints, 0);
  const totalSpent = depts.reduce((sum, d) => sum + d.spentPoints, 0);

  return {
    departments: depts,
    totalAllocated,
    totalSpent,
    totalRemaining: Math.max(0, totalAllocated - totalSpent),
  };
}

export async function allocateBudgetPoints({
  departmentId,
  additionalPoints,
}: {
  departmentId: string;
  additionalPoints: number;
}) {
  if (additionalPoints <= 0) {
    throw new Error("Additional points to allocate must be greater than zero.");
  }

  const updated = addDepartmentPoints(departmentId, additionalPoints);

  revalidatePath("/admin");
  revalidatePath("/bulk-rewards");

  return {
    success: true,
    department: updated,
  };
}

export async function fetchPendingApprovals(): Promise<ApprovalRequest[]> {
  return listApprovalRequests();
}

export async function submitApprovalRequest({
  departmentId,
  requesterName,
  requesterEmail,
  recipientName,
  recipientEmail,
  brandId,
  brandName,
  faceValue,
  reason,
}: {
  departmentId: string;
  requesterName: string;
  requesterEmail: string;
  recipientName: string;
  recipientEmail: string;
  brandId: string;
  brandName: string;
  faceValue: number;
  reason: string;
}) {
  const depts = listDepartments();
  const dept = depts.find((d) => d.id === departmentId);
  if (!dept) {
    throw new Error(`Cost center '${departmentId}' not recognized.`);
  }

  const pointsRequired = Math.round(faceValue * 100);

  const request = createApprovalRecord({
    departmentId,
    departmentName: dept.name,
    requesterName,
    requesterEmail,
    recipientName,
    recipientEmail,
    brandId,
    brandName,
    faceValue,
    pointsRequired,
    reason,
  });

  revalidatePath("/admin");
  revalidatePath("/bulk-rewards");

  return {
    success: true,
    request,
  };
}

export async function resolveApprovalRequest({
  requestId,
  action,
  reviewerName,
  rejectionReason,
  adminUserId,
}: {
  requestId: string;
  action: "APPROVE" | "REJECT";
  reviewerName: string;
  rejectionReason?: string;
  adminUserId: string;
}) {
  const requests = listApprovalRequests();
  const target = requests.find((r) => r.id === requestId);

  if (!target) {
    throw new Error(`Approval request '${requestId}' not found.`);
  }

  if (target.status !== "PENDING") {
    throw new Error(`Request has already been reviewed (Current status: ${target.status}).`);
  }

  if (action === "REJECT") {
    const updated = updateApprovalRecord(requestId, {
      status: "REJECTED",
      reviewerName,
      rejectionReason: rejectionReason || "Disbursement rejected per cost center review policy.",
    });

    try {
      await createNotification({
        userId: adminUserId,
        title: "Disbursement Request Rejected",
        message: `Request for $${target.faceValue} ${target.brandName} (${target.recipientName}) was rejected by ${reviewerName}.`,
        type: "SYSTEM",
        link: "/admin",
      });
    } catch (e) {
      // Non-blocking
    }

    revalidatePath("/admin");
    return { success: true, request: updated };
  }

  // Action is APPROVE: Execute redemption on behalf of corporate account
  try {
    const order = await redeemPointsForCard({
      userId: adminUserId,
      brandId: target.brandId,
      faceValue: target.faceValue,
      isGift: true,
      recipientName: target.recipientName,
      recipientEmail: target.recipientEmail,
      giftMessage: `Corporate Award: ${target.reason} (Approved by ${reviewerName})`,
      bypass2Fa: true, // Pre-authorized by manager approval
      skipVelocityCheck: true,
    });

    deductDepartmentSpend(target.departmentId, target.pointsRequired);

    const updated = updateApprovalRecord(requestId, {
      status: "APPROVED",
      reviewerName,
      orderId: order.orderId,
    });

    try {
      await createNotification({
        userId: adminUserId,
        title: "Disbursement Approved & Executed",
        message: `Approved $${target.faceValue} ${target.brandName} for ${target.recipientName}. Order #${order.orderId} fulfilled.`,
        type: "ORDER",
        link: "/orders",
      });
    } catch (e) {
      // Non-blocking
    }

    revalidatePath("/admin");
    revalidatePath("/orders");
    revalidatePath("/wallet");

    return {
      success: true,
      request: updated,
      orderId: order.orderId,
    };
  } catch (err: any) {
    throw new Error(`Approval fulfillment failed: ${err.message}`);
  }
}

