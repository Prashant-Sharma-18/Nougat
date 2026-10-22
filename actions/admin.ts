"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function toggleBrandStatus(brandId: string, isActive: boolean) {
  const brand = await prisma.brandCatalogCache.update({
    where: { id: brandId },
    data: { isActive },
  });
  revalidatePath("/");
  revalidatePath("/admin");
  return brand;
}

export async function updateBrandExchangeRate(brandId: string, pointsPerUnit: number) {
  if (pointsPerUnit <= 0) {
    throw new Error("Exchange rate must be greater than zero.");
  }

  const brand = await prisma.brandCatalogCache.update({
    where: { id: brandId },
    data: { pointsPerUnit },
  });
  revalidatePath("/");
  revalidatePath("/admin");
  return brand;
}

export async function adjustUserPoints({
  userId,
  amount,
  reason,
}: {
  userId: string;
  amount: number;
  reason: string;
}) {
  if (amount === 0) {
    throw new Error("Adjustment amount cannot be zero.");
  }

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found.");
    }

    if (amount < 0 && user.pointBalance + amount < 0) {
      throw new Error(`Cannot reduce balance below 0. Current balance is ${user.pointBalance}.`);
    }

    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        pointBalance: { increment: amount },
      },
    });

    const ledger = await tx.pointLedger.create({
      data: {
        userId,
        amount,
        type: "ADJUSTED",
        description: `Admin Adjustment: ${reason}`,
        referenceId: `ADM-ADJ-${Date.now()}`,
      },
    });

    return { user: updatedUser, ledger };
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/history");
  return result;
}

export async function getAdminMetrics() {
  const users = await prisma.user.findMany();
  const totalPointsInCirculation = users.reduce((sum, u) => sum + u.pointBalance, 0);

  const orders = await prisma.redemptionOrder.findMany();
  const completedOrders = orders.filter((o) => o.status === "COMPLETED");
  const totalValueRedeemed = completedOrders.reduce((sum, o) => sum + o.faceValue, 0);
  const totalPointsRedeemed = completedOrders.reduce((sum, o) => sum + o.pointsSpent, 0);

  const brands = await prisma.brandCatalogCache.findMany({
    orderBy: { name: "asc" },
  });

  const recentOrders = await prisma.redemptionOrder.findMany({
    take: 15,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  return {
    totalUsersCount: users.length,
    totalPointsInCirculation,
    totalOrdersCount: orders.length,
    completedOrdersCount: completedOrders.length,
    totalValueRedeemed,
    totalPointsRedeemed,
    brands,
    users,
    recentOrders,
  };
}

