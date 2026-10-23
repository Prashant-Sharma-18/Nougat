"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@/components/UserContext";
import CorporateDashboardView from "@/components/CorporateDashboardView";
import { getBrandCatalog } from "@/actions/catalog";
import { Building2, Lock, ArrowRight, ShieldAlert, User as UserIcon } from "lucide-react";

export default function CorporatePortalPage() {
  const { currentUser, isCorporate, isAdmin, loading } = useUser();
  const [brands, setBrands] = useState<any[]>([]);

  useEffect(() => {
    async function loadBrands() {
      try {
        const b = await getBrandCatalog({ onlyActive: true });
        setBrands(b);
      } catch (e) {
        console.error("Failed to load catalog for corporate portal:", e);
      }
    }
    loadBrands();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center font-mono text-xs text-zinc-500">
        Loading corporate workspace...
      </div>
    );
  }

  // Guard: If not a Corporate account or Admin, show explicit separation screen
  if (!isCorporate && !isAdmin) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-6">
        <div className="h-14 w-14 rounded-2xl bg-zinc-100 border border-zinc-200 text-zinc-800 flex items-center justify-center mx-auto">
          <Building2 className="h-7 w-7 text-zinc-800" />
        </div>

        <div className="space-y-2">
          <span className="px-2.5 py-0.5 rounded text-[10px] font-mono uppercase bg-zinc-100 text-zinc-800 border border-zinc-200">
            Corporate Portal Restricted
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
            Corporate Account Required
          </h1>
          <p className="text-xs text-zinc-600 leading-relaxed max-w-md mx-auto">
            You are currently signed in with a <strong>Personal Consumer</strong> account ({currentUser?.email}). Corporate team gifting, department cost centers, and workforce automations are only accessible to verified company accounts.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-zinc-200 text-xs text-left space-y-3 font-mono">
          <div className="flex items-start gap-2.5">
            <Lock className="h-4 w-4 text-zinc-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-zinc-900 block font-sans">Strict Portal Separation Active</span>
              <span className="text-[11px] text-zinc-500">
                To access Acme Corp workforce rewards, switch to your company ID or register an organization workspace.
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/login?portal=corporate"
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs"
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>Sign In with Corporate ID</span>
          </Link>

          <Link
            href="/signup?type=enterprise"
            className="w-full sm:w-auto px-4 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>Register Organization</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  return <CorporateDashboardView initialBrands={brands} />;
}
