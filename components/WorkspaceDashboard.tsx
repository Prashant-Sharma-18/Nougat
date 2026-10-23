"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "./UserContext";
import PersonalDashboardView from "./PersonalDashboardView";
import CorporateDashboardView from "./CorporateDashboardView";

export default function WorkspaceDashboard({ brands }: { brands: any[] }) {
  const { isCorporate, isAdmin, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (isAdmin) {
        router.replace("/admin");
      } else if (isCorporate) {
        router.replace("/corporate");
      }
    }
  }, [isAdmin, isCorporate, loading, router]);

  if (loading) {
    return (
      <div className="py-20 text-center font-mono text-xs text-zinc-500">
        Loading rewards portal...
      </div>
    );
  }

  // If corporate account renders before client redirect finishes
  if (isCorporate) {
    return <CorporateDashboardView initialBrands={brands} />;
  }

  // Default: Personal Consumer Gift Card Buying Platform
  return <PersonalDashboardView initialBrands={brands} />;
}
