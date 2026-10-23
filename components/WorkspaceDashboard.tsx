"use client";

import React from "react";
import Link from "next/link";
import { useUser } from "./UserContext";
import PersonalDashboardView from "./PersonalDashboardView";
import CorporateDashboardView from "./CorporateDashboardView";
import { Sliders, Tag, Sparkles, Building2, ArrowRight, Layers } from "lucide-react";

export default function WorkspaceDashboard({ brands }: { brands: any[] }) {
  const { isCorporate, isAdmin } = useUser();

  if (isAdmin) {
    return (
      <div className="space-y-8">
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-zinc-950 text-white font-medium">
                  Master Super Admin Platform
                </span>
                <span className="text-[11px] font-mono text-zinc-500">Live Production Control</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">
                Operations & Merchandising Central.
              </h1>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed max-w-2xl">
                Supervise the entire Nougat multi-tenant platform: brand catalog listings, promotional discount coupons, merchandising hero banners, corporate department cost centers, and double-entry transaction ledgers.
              </p>
            </div>

            <Link
              href="/admin"
              className="py-2.5 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold flex items-center gap-2 shadow-xs shrink-0"
            >
              <Sliders className="h-4 w-4" />
              <span>Open Admin Operations Console</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/admin"
            className="p-5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors shadow-xs space-y-3 group"
          >
            <div className="h-10 w-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-900 group-hover:bg-zinc-950 group-hover:text-white transition-colors">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-zinc-950">Brand Listings</h3>
              <p className="text-xs text-zinc-500 mt-1">Manage active brand merchant catalog and exchange rates.</p>
            </div>
          </Link>

          <Link
            href="/admin"
            className="p-5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors shadow-xs space-y-3 group"
          >
            <div className="h-10 w-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-900 group-hover:bg-zinc-950 group-hover:text-white transition-colors">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-zinc-950">Discounts & Coupons</h3>
              <p className="text-xs text-zinc-500 mt-1">Create promotional codes (SAVE10, CORP20) and track redemption metrics.</p>
            </div>
          </Link>

          <Link
            href="/admin"
            className="p-5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors shadow-xs space-y-3 group"
          >
            <div className="h-10 w-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-900 group-hover:bg-zinc-950 group-hover:text-white transition-colors">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-zinc-950">Marketing Banners</h3>
              <p className="text-xs text-zinc-500 mt-1">Publish hero banners targeted to Personal, Corporate, or All users.</p>
            </div>
          </Link>

          <Link
            href="/corporate/team"
            className="p-5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors shadow-xs space-y-3 group"
          >
            <div className="h-10 w-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-900 group-hover:bg-zinc-950 group-hover:text-white transition-colors">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-zinc-950">Team Gifting Roster</h3>
              <p className="text-xs text-zinc-500 mt-1">Inspect corporate team members and per-department cost center limits.</p>
            </div>
          </Link>
        </div>

        <CorporateDashboardView initialBrands={brands} />
      </div>
    );
  }

  if (isCorporate) {
    return <CorporateDashboardView initialBrands={brands} />;
  }

  return <PersonalDashboardView initialBrands={brands} />;
}
