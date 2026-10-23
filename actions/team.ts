"use server";

import { prisma } from "@/lib/prisma";
import { listTeamMembers, addTeamMember, recordGiftToTeamMember, TeamMember } from "@/lib/enterprise/team";
import { deductDepartmentSpend } from "@/lib/enterprise/budgets";
import { redeemPointsForCard } from "@/actions/redeem";
import { createNotification } from "@/actions/notifications";
import { revalidatePath } from "next/cache";

export async function fetchTeamMembers(): Promise<TeamMember[]> {
  return listTeamMembers();
}

export async function createTeamMember({
  name,
  email,
  departmentId,
  departmentName,
  title,
}: {
  name: string;
  email: string;
  departmentId: string;
  departmentName: string;
  title: string;
}) {
  if (!name.trim() || !email.trim()) {
    throw new Error("Name and email are required for adding a team member.");
  }

  const member = addTeamMember({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    departmentId,
    departmentName,
    title: title.trim() || "Team Member",
  });

  revalidatePath("/corporate/team");
  revalidatePath("/bulk-rewards");
  return { success: true, member };
}

export async function sendGiftCardToTeamMember({
  memberId,
  brandId,
  faceValue,
  giftMessage,
  senderUserId,
}: {
  memberId: string;
  brandId: string;
  faceValue: number;
  giftMessage?: string;
  senderUserId: string;
}) {
  const members = listTeamMembers();
  const member = members.find((m) => m.id === memberId);
  if (!member) {
    throw new Error(`Team member '${memberId}' not found in corporate directory.`);
  }

  const pointsRequired = Math.round(faceValue * 100);

  // Execute redemption on corporate account
  const order = await redeemPointsForCard({
    userId: senderUserId,
    brandId,
    faceValue,
    isGift: true,
    recipientName: member.name,
    recipientEmail: member.email,
    giftMessage: giftMessage || `Corporate Spot Award from Acme Corp [ORG-8821]`,
    bypass2Fa: faceValue < 250, // Standard team gifts up to $250
    skipVelocityCheck: true,
  });

  // Track spend against member's cost center
  deductDepartmentSpend(member.departmentId, pointsRequired);
  recordGiftToTeamMember(member.id, faceValue);

  try {
    await createNotification({
      userId: senderUserId,
      title: "Team Gift Card Dispatched",
      message: `Successfully issued $${faceValue} reward card to ${member.name} (${member.email}).`,
      type: "ORDER",
      link: "/wallet",
    });
  } catch (e) {
    // Non-blocking
  }

  revalidatePath("/corporate/team");
  revalidatePath("/wallet");
  revalidatePath("/admin");
  revalidatePath("/history");

  return {
    success: true,
    orderId: order.orderId,
    member,
  };
}

