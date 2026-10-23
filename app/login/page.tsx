"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/components/UserContext";
import { loginUser } from "@/actions/users";
import { getAccountType } from "@/lib/auth/roles";
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  Loader2, 
  Check, 
  Building2, 
  User as UserIcon,
  Sliders,
  ShieldCheck,
  AlertCircle
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { users, switchUser, refreshUserData } = useUser();

  const [portalTab, setPortalTab] = useState<"PERSONAL" | "CORPORATE" | "ADMIN">("PERSONAL");
  const [email, setEmail] = useState("alex.demo@loyaltyrewards.io");
  const [password, setPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const portalParam = searchParams.get("portal");
    if (portalParam === "admin") {
      setPortalTab("ADMIN");
      setEmail("admin@loyaltyrewards.io");
    } else if (portalParam === "corporate" || portalParam === "enterprise") {
      setPortalTab("CORPORATE");
      setEmail("elena.corp@acmeworkspace.com");
    } else {
      setPortalTab("PERSONAL");
      setEmail("alex.demo@loyaltyrewards.io");
    }
  }, [searchParams]);

  const handleTabChange = (tab: "PERSONAL" | "CORPORATE" | "ADMIN") => {
    setPortalTab(tab);
    setErrorMsg(null);
    if (tab === "PERSONAL") {
      setEmail("alex.demo@loyaltyrewards.io");
    } else if (tab === "CORPORATE") {
      setEmail("elena.corp@acmeworkspace.com");
    } else {
      setEmail("admin@loyaltyrewards.io");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      const user = await loginUser({ email, portalTarget: portalTab });
      await refreshUserData();
      switchUser(user.id);

      // Route strictly based on account type & target portal
      if (portalTab === "ADMIN") {
        router.push("/admin");
      } else if (portalTab === "CORPORATE") {
        router.push("/corporate");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (targetUser: any) => {
    const accType = getAccountType(targetUser);
    switchUser(targetUser.id);
    if (accType === "ADMIN") {
      router.push("/admin");
    } else if (accType === "CORPORATE") {
      router.push("/corporate");
    } else {
      router.push("/");
    }
  };

  return (
    <div className="max-w-md mx-auto py-10 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-800 text-xs font-mono">
          <Lock className="h-3.5 w-3.5 text-zinc-700" />
          <span>Multi-Portal Authentication</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
          Sign In to Nougat
        </h1>
        <p className="text-xs text-zinc-500">
          Select your portal to access personal rewards, corporate team gifting, or admin operations.
        </p>
      </div>

      {/* 3-Way Portal Selector Tabs */}
      <div className="grid grid-cols-3 gap-1 bg-zinc-100 p-1 rounded-xl border border-zinc-200 text-xs font-mono">
        <button
          type="button"
          onClick={() => handleTabChange("PERSONAL")}
          className={`py-2 px-2 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-colors ${
            portalTab === "PERSONAL"
              ? "bg-white text-zinc-950 font-semibold shadow-xs"
              : "text-zinc-500 hover:text-zinc-900"
          }`}
        >
          <UserIcon className="h-3.5 w-3.5" />
          <span>Personal</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("CORPORATE")}
          className={`py-2 px-2 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-colors ${
            portalTab === "CORPORATE"
              ? "bg-white text-zinc-950 font-semibold shadow-xs"
              : "text-zinc-500 hover:text-zinc-900"
          }`}
        >
          <Building2 className="h-3.5 w-3.5" />
          <span>Corporate</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("ADMIN")}
          className={`py-2 px-2 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-colors ${
            portalTab === "ADMIN"
              ? "bg-zinc-950 text-white font-semibold shadow-xs"
              : "text-zinc-500 hover:text-zinc-900"
          }`}
        >
          <Sliders className="h-3.5 w-3.5" />
          <span>Admin</span>
        </button>
      </div>

      {/* Main Login Card */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs p-6 space-y-5">
        {/* Portal Description Strip */}
        <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-semibold text-zinc-900 font-sans">
              {portalTab === "PERSONAL" && "Personal Consumer Portal"}
              {portalTab === "CORPORATE" && "Corporate Workforce Workspace"}
              {portalTab === "ADMIN" && "Super Admin Console (Pre-defined IDs Only)"}
            </span>
            <span className="text-[10px] text-zinc-500 uppercase">
              {portalTab}
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 leading-snug">
            {portalTab === "PERSONAL" && "Buy gift cards for personal use, track order delivery status, and access your digital vault."}
            {portalTab === "CORPORATE" && "Acme Corp team member directory, 1-click team gifting, department cost centers, and automations."}
            {portalTab === "ADMIN" && "Restricted to pre-defined security IDs. Manages brand listings, discounts, coupons, and telemetry."}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-zinc-100 border border-zinc-300 rounded-lg text-xs text-zinc-900 flex items-start gap-2 font-mono">
            <AlertCircle className="h-4 w-4 text-zinc-700 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase font-mono text-zinc-500 mb-1.5">
              {portalTab === "ADMIN" ? "Pre-defined Admin Email" : portalTab === "CORPORATE" ? "Corporate Work Email" : "Personal Email"}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-sans text-zinc-900 focus:border-zinc-400 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[10px] uppercase font-mono text-zinc-500">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[10px] font-mono text-zinc-400 hover:text-zinc-700"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-10 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-sans text-zinc-900 focus:border-zinc-400 focus:bg-white focus:outline-none font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-medium shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            <span>Enter {portalTab === "ADMIN" ? "Admin Operations" : portalTab === "CORPORATE" ? "Corporate Workspace" : "Personal Portal"}</span>
            <ArrowRight className="h-3.5 w-3.5 text-zinc-400" />
          </button>
        </form>

        {/* Quick Launch Predefined Personas */}
        <div className="pt-4 border-t border-zinc-100 space-y-2.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block text-center">
            Or Quick-Launch Pre-defined ID
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            {/* Personal Demo */}
            <button
              type="button"
              onClick={() => {
                const u = users.find((x) => getAccountType(x) === "PERSONAL") || users[0];
                if (u) handleQuickLogin(u);
              }}
              className="p-2.5 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-left transition-colors"
            >
              <div className="flex items-center gap-1.5 font-semibold text-zinc-900 text-[11px]">
                <UserIcon className="h-3.5 w-3.5 text-zinc-700" />
                <span>Alex Morgan</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 block mt-0.5 truncate">
                Personal Consumer
              </span>
            </button>

            {/* Corporate Demo */}
            <button
              type="button"
              onClick={() => {
                const u = users.find((x) => getAccountType(x) === "CORPORATE") || users[0];
                if (u) handleQuickLogin(u);
              }}
              className="p-2.5 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-left transition-colors"
            >
              <div className="flex items-center gap-1.5 font-semibold text-zinc-900 text-[11px]">
                <Building2 className="h-3.5 w-3.5 text-zinc-900" />
                <span>Elena Vance</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 block mt-0.5 truncate">
                Acme Corp Manager
              </span>
            </button>

            {/* Admin Demo */}
            <button
              type="button"
              onClick={() => {
                const u = users.find((x) => getAccountType(x) === "ADMIN") || users[0];
                if (u) handleQuickLogin(u);
              }}
              className="p-2.5 rounded-lg border border-zinc-950 bg-zinc-950 text-white hover:bg-zinc-800 text-left transition-colors"
            >
              <div className="flex items-center gap-1.5 font-semibold text-white text-[11px]">
                <ShieldCheck className="h-3.5 w-3.5 text-zinc-200" />
                <span>Super Admin</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400 block mt-0.5 truncate">
                Pre-defined Admin
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Link */}
      <div className="text-center text-xs text-zinc-500">
        {portalTab === "ADMIN" ? (
          <span>
            Admin accounts cannot be registered. Need personal or corporate access?{" "}
            <Link href="/signup" className="font-semibold text-zinc-950 hover:underline">
              Create an account
            </Link>
          </span>
        ) : (
          <span>
            Don&apos;t have an account yet?{" "}
            <Link
              href={portalTab === "CORPORATE" ? "/signup?type=enterprise" : "/signup?type=personal"}
              className="font-semibold text-zinc-950 hover:underline"
            >
              Sign up for {portalTab === "CORPORATE" ? "Corporate" : "Personal"}
            </Link>
          </span>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto py-16 text-center text-xs font-mono text-zinc-500">
          Loading authentication gateway...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
