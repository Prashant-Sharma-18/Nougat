"use server";

import { prisma } from "@/lib/prisma";

export async function getBrandCatalog(options?: {
  category?: string;
  search?: string;
  onlyActive?: boolean;
}) {
  const where: any = {};

  if (options?.onlyActive !== false) {
    where.isActive = true;
  }

  if (options?.category && options.category !== "All") {
    where.category = options.category;
  }

  if (options?.search && options.search.trim() !== "") {
    where.OR = [
      { name: { contains: options.search, mode: "insensitive" } },
      { description: { contains: options.search, mode: "insensitive" } },
    ];
  }

  return prisma.brandCatalogCache.findMany({
    where,
    orderBy: { name: "asc" },
  });
}

export async function getBrandById(id: string) {
  return prisma.brandCatalogCache.findUnique({
    where: { id },
  });
}

