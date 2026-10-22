"use server";

import { prisma } from "@/lib/prisma";

export async function exportLedgerCsv(userId?: string): Promise<string> {
  const where = userId ? { userId } : {};
  const entries = await prisma.pointLedger.findMany({
    where,
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  const headers = [
    "Transaction ID",
    "Timestamp",
    "User Name",
    "User Email",
    "Transaction Type",
    "Points Amount",
    "Description",
    "Reference ID",
  ];

  const rows = entries.map((e) => [
    `"${e.id}"`,
    `"${new Date(e.createdAt).toISOString()}"`,
    `"${e.user?.name || "N/A"}"`,
    `"${e.user?.email || "N/A"}"`,
    `"${e.type}"`,
    e.amount,
    `"${e.description.replace(/"/g, '""')}"`,
    `"${e.referenceId || "N/A"}"`,
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export async function exportOrdersCsv(userId?: string): Promise<string> {
  const where = userId ? { userId } : {};
  const orders = await prisma.redemptionOrder.findMany({
    where,
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  const headers = [
    "Order ID",
    "Timestamp",
    "User Name",
    "User Email",
    "Brand Name",
    "Face Value ($)",
    "Currency",
    "Points Spent",
    "Cash Spent ($)",
    "Payment Method",
    "Status",
    "Provider Order ID",
    "Recipient Name",
    "Recipient Email",
    "Remaining Card Balance ($)",
  ];

  const rows = orders.map((o) => [
    `"${o.id}"`,
    `"${new Date(o.createdAt).toISOString()}"`,
    `"${o.user?.name || "N/A"}"`,
    `"${o.user?.email || "N/A"}"`,
    `"${o.brandName.replace(/"/g, '""')}"`,
    o.faceValue,
    `"${o.currency}"`,
    o.pointsSpent,
    o.cashSpent || 0,
    `"${o.paymentMethod || "Points Only"}"`,
    `"${o.status}"`,
    `"${o.providerOrderId || "N/A"}"`,
    `"${o.recipientName || "Self"}"`,
    `"${o.recipientEmail || o.user?.email || "N/A"}"`,
    o.remainingCardBalance !== null && o.remainingCardBalance !== undefined ? o.remainingCardBalance : o.faceValue,
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export async function exportWalletCardsCsv(userId?: string): Promise<string> {
  const where: any = userId ? { userId, status: "COMPLETED" } : { status: "COMPLETED" };
  const orders = await prisma.redemptionOrder.findMany({
    where,
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  const headers = [
    "Voucher ID",
    "Brand Name",
    "Face Value ($)",
    "Remaining Balance ($)",
    "Currency",
    "Recipient",
    "Issued Date",
    "Claim URL",
    "Provider Order ID",
  ];

  const rows = orders.map((o) => {
    const rem = o.remainingCardBalance !== null && o.remainingCardBalance !== undefined 
      ? o.remainingCardBalance 
      : o.faceValue;

    return [
      `"${o.id}"`,
      `"${o.brandName.replace(/"/g, '""')}"`,
      o.faceValue,
      rem,
      `"${o.currency}"`,
      `"${o.recipientName || "Self"}"`,
      `"${new Date(o.createdAt).toISOString()}"`,
      `"${o.claimUrl || "N/A"}"`,
      `"${o.providerOrderId || "N/A"}"`,
    ];
  });

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}
