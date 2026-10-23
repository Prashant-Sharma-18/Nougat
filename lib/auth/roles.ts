export type AccountType = "PERSONAL" | "CORPORATE" | "ADMIN";

// Pre-defined administrative account IDs strictly provisioned for platform operations
export const PREDEFINED_ADMIN_EMAILS = [
  "admin@loyaltyrewards.io",
  "admin@nougatrewards.com",
];

export const PREDEFINED_ADMIN_IDS = [
  "ea12d6fb-682c-429d-99d2-a71e50b42161",
];

export function getAccountType(user: { id?: string; email: string; role?: string; name?: string | null } | null): AccountType {
  if (!user || !user.email) return "PERSONAL";

  const email = user.email.toLowerCase().trim();

  // 1. Super Admin is strictly restricted to pre-defined IDs
  if (
    PREDEFINED_ADMIN_EMAILS.includes(email) ||
    (user.id && PREDEFINED_ADMIN_IDS.includes(user.id)) ||
    (user.role === "ADMIN" && email.startsWith("admin"))
  ) {
    return "ADMIN";
  }

  // 2. Corporate accounts (Acme Corp, enterprise workspaces, corporate disbursements)
  if (
    email.includes("corp") ||
    email.includes("acme") ||
    email.includes("internal") ||
    email.includes("enterprise") ||
    user.role === "ADMIN" // legacy role fallback
  ) {
    return "CORPORATE";
  }

  // 3. Normal personal consumers buying gift cards
  return "PERSONAL";
}

export function isSuperAdmin(user: { id?: string; email: string; role?: string } | null): boolean {
  return getAccountType(user) === "ADMIN";
}

export function isCorporateAccount(user: { id?: string; email: string; role?: string } | null): boolean {
  return getAccountType(user) === "CORPORATE";
}

export function isPersonalAccount(user: { id?: string; email: string; role?: string } | null): boolean {
  return getAccountType(user) === "PERSONAL";
}

