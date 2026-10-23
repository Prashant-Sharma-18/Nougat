export interface Coupon {
  id: string;
  code: string;
  discountPercentage: number;
  bonusPoints: number;
  minOrderValue: number;
  usageCount: number;
  maxUses: number;
  isActive: boolean;
  expiresAt: string;
  description: string;
}

export interface PromoBanner {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  ctaText: string;
  ctaLink: string;
  targetAudience: "ALL" | "PERSONAL" | "CORPORATE";
  isActive: boolean;
}

// In-memory promotion store
let coupons: Coupon[] = [
  {
    id: "coup_01",
    code: "SAVE10",
    discountPercentage: 10,
    bonusPoints: 0,
    minOrderValue: 25,
    usageCount: 42,
    maxUses: 500,
    isActive: true,
    expiresAt: new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString(),
    description: "10% Instant discount on any personal gift card redemption.",
  },
  {
    id: "coup_02",
    code: "CORP20",
    discountPercentage: 20,
    bonusPoints: 5000,
    minOrderValue: 250,
    usageCount: 18,
    maxUses: 100,
    isActive: true,
    expiresAt: new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString(),
    description: "20% Bulk team bonus points on corporate distributions over $250.",
  },
  {
    id: "coup_03",
    code: "WELCOME500",
    discountPercentage: 0,
    bonusPoints: 500,
    minOrderValue: 10,
    usageCount: 124,
    maxUses: 1000,
    isActive: true,
    expiresAt: new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString(),
    description: "500 Welcome bonus loyalty points for first-time personal members.",
  },
];

let promoBanners: PromoBanner[] = [
  {
    id: "ban_01",
    title: "Q4 Employee Spot Recognition Boost",
    subtitle: "Distribute bulk holiday gift cards to your engineering and sales teams with split corporate card co-pay.",
    badge: "Enterprise Workforce Incentives",
    ctaText: "Launch Bulk Batch",
    ctaLink: "/bulk-rewards",
    targetAudience: "CORPORATE",
    isActive: true,
  },
  {
    id: "ban_02",
    title: "Earn 1.5x VIP Points on Dining & Coffee",
    subtitle: "Redeem Starbucks, Uber Eats, and Chipotle gift vouchers today and unlock instant Platinum VIP status.",
    badge: "Personal Member Perks",
    ctaText: "Shop Dining Cards",
    ctaLink: "/",
    targetAudience: "PERSONAL",
    isActive: true,
  },
];

export function listCoupons(): Coupon[] {
  return coupons.map((c) => ({ ...c }));
}

export function listPromoBanners(): PromoBanner[] {
  return promoBanners.map((b) => ({ ...b }));
}

export function createCoupon(params: Omit<Coupon, "id" | "usageCount">): Coupon {
  const newCoupon: Coupon = {
    ...params,
    id: `coup_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    code: params.code.trim().toUpperCase(),
    usageCount: 0,
  };
  coupons.unshift(newCoupon);
  return newCoupon;
}

export function setCouponStatus(couponId: string, isActive: boolean): Coupon {
  const coupon = coupons.find((c) => c.id === couponId);
  if (!coupon) {
    throw new Error(`Coupon '${couponId}' not found.`);
  }
  coupon.isActive = isActive;
  return { ...coupon };
}

export function validateAndApplyCoupon(code: string, orderValue: number): {
  valid: boolean;
  discountPercentage: number;
  bonusPoints: number;
  discountDollars: number;
  message: string;
} {
  const coupon = coupons.find((c) => c.code === code.trim().toUpperCase() && c.isActive);
  if (!coupon) {
    return {
      valid: false,
      discountPercentage: 0,
      bonusPoints: 0,
      discountDollars: 0,
      message: `Coupon code '${code}' is invalid or expired.`,
    };
  }

  if (orderValue < coupon.minOrderValue) {
    return {
      valid: false,
      discountPercentage: 0,
      bonusPoints: 0,
      discountDollars: 0,
      message: `Minimum order value for coupon '${coupon.code}' is $${coupon.minOrderValue.toFixed(2)}.`,
    };
  }

  const discountDollars = Math.round((orderValue * coupon.discountPercentage) / 100);
  coupon.usageCount += 1;

  return {
    valid: true,
    discountPercentage: coupon.discountPercentage,
    bonusPoints: coupon.bonusPoints,
    discountDollars,
    message: `Applied ${coupon.code}: ${coupon.discountPercentage}% discount (${discountDollars} savings).`,
  };
}

export function createPromoBanner(params: Omit<PromoBanner, "id">): PromoBanner {
  const newBanner: PromoBanner = {
    ...params,
    id: `ban_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
  };
  promoBanners.unshift(newBanner);
  return newBanner;
}

export function setPromoBannerStatus(bannerId: string, isActive: boolean): PromoBanner {
  const banner = promoBanners.find((b) => b.id === bannerId);
  if (!banner) {
    throw new Error(`Promo banner '${bannerId}' not found.`);
  }
  banner.isActive = isActive;
  return { ...banner };
}

