"use client";

import React from "react";
import { useUser } from "./UserContext";
import PersonalDashboardView from "./PersonalDashboardView";
import CorporateDashboardView from "./CorporateDashboardView";

export default function WorkspaceDashboard({ brands }: { brands: any[] }) {
  const { isEnterprise } = useUser();

  if (isEnterprise) {
    return <CorporateDashboardView initialBrands={brands} />;
  }

  return <PersonalDashboardView initialBrands={brands} />;
}

