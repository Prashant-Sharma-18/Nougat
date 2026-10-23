"use server";

import { 
  listCoupons, 
  listPromoBanners, 
  createCoupon, 
  setCouponStatus, 
  validateAndApplyCoupon, 
  createPromoBanner, 
  setPromoBannerStatus,
  Coupon,
  PromoBanner
} from "@/lib/admin/promotions";
import { revalidatePath } from "next/cache";

export async function fetchPromotionsData(): Promise<{
  coupons: Coupon[];
  banners: PromoBanner[];
}> {
  return {
    coupons: listCoupons(),
    banners: listPromoBanners(),
  };
}

export async function createCouponAction({
  code,
  discountPercentage,
  bonusPoints,
  minOrderValue,
  maxUses,
  description,
  expiresInDays,
}: {
  code: string;
  discountPercentage: number;
  bonusPoints: number;
  minOrderValue: number;
  maxUses: number;
  description: string;
  expiresInDays?: number;
}) {
  const expiresAt = new Date(Date.now() + (expiresInDays || 60) * 24 * 3600 * 1000).toISOString();
  const coupon = createCoupon({
    code,
    discountPercentage: Number(discountPercentage) || 0,
    bonusPoints: Number(bonusPoints) || 0,
    minOrderValue: Number(minOrderValue) || 0,
    maxUses: Number(maxUses) || 500,
    isActive: true,
    expiresAt,
    description: description.trim() || `Promotional discount code ${code.toUpperCase()}`,
  });

  revalidatePath("/admin");
  return { success: true, coupon };
}

export async function toggleCouponStatusAction(couponId: string, isActive: boolean) {
  const updated = setCouponStatus(couponId, isActive);
  revalidatePath("/admin");
  return { success: true, coupon: updated };
}

export async function validateCouponAction(code: string, orderValue: number) {
  const result = validateAndApplyCoupon(code, orderValue);
  return result;
}

export async function createBannerAction({
  title,
  subtitle,
  badge,
  ctaText,
  ctaLink,
  targetAudience,
}: {
  title: string;
  subtitle: string;
  badge: string;
  ctaText: string;
  ctaLink: string;
  targetAudience: "ALL" | "PERSONAL" | "CORPORATE";
}) {
  const banner = createPromoBanner({
    title,
    subtitle,
    badge,
    ctaText,
    ctaLink,
    targetAudience,
    isActive: true,
  });

  revalidatePath("/admin");
  revalidatePath("/");
  return { success: true, banner };
}

export async function toggleBannerStatusAction(bannerId: string, isActive: boolean) {
  const updated = setPromoBannerStatus(bannerId, isActive);
  revalidatePath("/admin");
  revalidatePath("/");
  return { success: true, banner: updated };
}

