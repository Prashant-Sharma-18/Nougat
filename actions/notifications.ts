"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getUserNotifications(userId: string) {
  if (!userId) return [];
  try {
    return await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 25,
    });
  } catch (err) {
    console.error("Failed to load notifications:", err);
    return [];
  }
}

export async function markNotificationAsRead(id: string) {
  try {
    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    revalidatePath("/");
    return { success: true };
  } catch (err) {
    console.error("Failed to mark notification read:", err);
    return { success: false };
  }
}

export async function markAllNotificationsAsRead(userId: string) {
  try {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    revalidatePath("/");
    return { success: true };
  } catch (err) {
    console.error("Failed to mark all notifications read:", err);
    return { success: false };
  }
}

export async function createNotification({
  userId,
  title,
  message,
  type = "INFO",
  link,
}: {
  userId: string;
  title: string;
  message: string;
  type?: string;
  link?: string;
}) {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        link,
      },
    });
  } catch (err) {
    console.error("Failed to create notification:", err);
    return null;
  }
}

