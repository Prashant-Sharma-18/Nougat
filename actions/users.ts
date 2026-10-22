"use server";

import { prisma } from "@/lib/prisma";

export async function getUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: "asc" },
  });
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
  });
}

export async function getOrCreateDefaultUser() {
  let user = await prisma.user.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: "alex.demo@loyaltyrewards.io",
        name: "Alex Morgan",
        role: "USER",
        pointBalance: 7500, // $75.00 worth of starting loyalty points
      },
    });

    // Create initial welcome point ledger
    await prisma.pointLedger.create({
      data: {
        userId: user.id,
        amount: 7500,
        type: "EARNED",
        description: "Welcome Loyalty Sign-up Bonus & Milestone",
      },
    });
  }

  return user;
}

export async function registerUser({
  name,
  email,
  accountType,
  companyName,
}: {
  name: string;
  email: string;
  accountType: "PERSONAL" | "ENTERPRISE";
  companyName?: string;
}) {
  const cleanEmail = email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  if (existing) {
    throw new Error("An account with this email already exists. Please sign in instead.");
  }

  const isEnterprise = accountType === "ENTERPRISE";
  const startingPoints = isEnterprise ? 50000 : 2500;
  const displayName = isEnterprise && companyName ? `${name} (${companyName})` : name;

  const user = await prisma.user.create({
    data: {
      email: cleanEmail,
      name: displayName,
      role: isEnterprise ? "ADMIN" : "USER",
      pointBalance: startingPoints,
    },
  });

  await prisma.pointLedger.create({
    data: {
      userId: user.id,
      amount: startingPoints,
      type: "EARNED",
      description: isEnterprise
        ? `Enterprise Workspace Setup Bonus (${companyName || "Organization Pool"})`
        : "Personal Loyalty Welcome Bonus",
    },
  });

  return user;
}

export async function loginUser({ email }: { email: string }) {
  const cleanEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  if (!user) {
    throw new Error("No account found with this email. Please check your email or sign up.");
  }

  return user;
}

