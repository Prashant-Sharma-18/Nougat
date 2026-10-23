"use server";

import { prisma } from "@/lib/prisma";
import { getAccountType, PREDEFINED_ADMIN_EMAILS } from "@/lib/auth/roles";

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

  // Ensure predefined corporate demo user exists
  const corpUser = await prisma.user.findUnique({
    where: { email: "elena.corp@acmeworkspace.com" },
  });
  if (!corpUser) {
    const c = await prisma.user.create({
      data: {
        email: "elena.corp@acmeworkspace.com",
        name: "Elena Rostova (Acme Corp)",
        role: "ADMIN",
        pointBalance: 125000,
      },
    });
    await prisma.pointLedger.create({
      data: {
        userId: c.id,
        amount: 125000,
        type: "EARNED",
        description: "Acme Corp Initial Treasury Allocation",
      },
    });
  }

  // Ensure predefined super admin user exists
  const adminUser = await prisma.user.findUnique({
    where: { email: "admin@loyaltyrewards.io" },
  });
  if (!adminUser) {
    const a = await prisma.user.create({
      data: {
        email: "admin@loyaltyrewards.io",
        name: "Platform Administrator",
        role: "ADMIN",
        pointBalance: 50000,
      },
    });
    await prisma.pointLedger.create({
      data: {
        userId: a.id,
        amount: 50000,
        type: "EARNED",
        description: "Platform Security Operations Allocation",
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
  accountType: "PERSONAL" | "CORPORATE" | "ENTERPRISE" | "ADMIN";
  companyName?: string;
}) {
  // Public registration is strictly forbidden for administrative accounts
  if (accountType === "ADMIN") {
    throw new Error(
      "Administrative accounts cannot be registered publicly. The Admin Operations Console is restricted to pre-defined platform security IDs."
    );
  }

  const cleanEmail = email.toLowerCase().trim();

  // Guard: Cannot sign up using a reserved admin email
  if (PREDEFINED_ADMIN_EMAILS.includes(cleanEmail)) {
    throw new Error("This email is reserved for platform administration. Please sign in instead.");
  }

  const existing = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  if (existing) {
    throw new Error("An account with this email already exists. Please sign in instead.");
  }

  const isCorporate = accountType === "CORPORATE" || accountType === "ENTERPRISE";
  const startingPoints = isCorporate ? 50000 : 2500;
  const displayName = isCorporate && companyName ? `${name} (${companyName})` : name;

  const user = await prisma.user.create({
    data: {
      email: cleanEmail,
      name: displayName,
      role: isCorporate ? "ADMIN" : "USER",
      pointBalance: startingPoints,
    },
  });

  await prisma.pointLedger.create({
    data: {
      userId: user.id,
      amount: startingPoints,
      type: "EARNED",
      description: isCorporate
        ? `Corporate Workspace Setup Bonus (${companyName || "Organization Treasury"})`
        : "Personal Loyalty Welcome Bonus",
    },
  });

  return { ...user, accountType: isCorporate ? "CORPORATE" : "PERSONAL" };
}

export async function loginUser({
  email,
  portalTarget,
}: {
  email: string;
  portalTarget?: "PERSONAL" | "CORPORATE" | "ADMIN";
}) {
  const cleanEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  if (!user) {
    throw new Error("No account found with this email. Please verify your address or create an account.");
  }

  const detectedType = getAccountType(user);

  // If user attempted to log in to Admin portal without an admin account
  if (portalTarget === "ADMIN" && detectedType !== "ADMIN") {
    throw new Error(
      "Access Denied: This account does not have platform administrative privileges. The Admin Portal is restricted to pre-defined security IDs."
    );
  }

  return { ...user, accountType: detectedType };
}

