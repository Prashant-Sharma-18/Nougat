"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/components/UserContext";
import { registerUser } from "@/actions/users";
import { 
  Building2, 
  User as UserIcon, 
  Mail, 
  Lock, 
  ArrowRight, 
  Loader2, 
  Check, 
  AlertCircle,
  Briefcase,
  Gift,
  Coins
} from "lucide-react";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { switchUser, refreshUserData } = useUser();

  const initialType = searchParams.get("type") === "enterprise" ? "ENTERPRISE" : "PERSONAL";
  const [accountType, setAccountType] = useState<"PERSONAL" | "ENTERPRISE">(initialType);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [teamSize, setTeamSize] = useState("10-50");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const typeParam = searchParams.get("type");
    if (typeParam === "enterprise") {
      setAccountType("ENTERPRISE");
    } else if (typeParam === "personal") {
      setAccountType("PERSONAL");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }

    if (accountType === "ENTERPRISE" && !companyName.trim()) {
      setErrorMsg("Please enter your organization or company name.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

      const user = await registerUser({
        name,
        email,
        accountType,
        companyName: accountType === "ENTERPRISE" ? companyName : undefined,
      });

      await refreshUserData();
      switchUser(user.id);

      if (accountType === "ENTERPRISE") {
        router.push("/bulk-rewards");
      } else {
        router.push("/wallet");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-800 text-xs font-mono">
          <Gift className="h-3.5 w-3.5 text-zinc-700" />
          <span>New Account Registration</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
          Create Your Nougat Account
        </h1>
        <p className="text-xs text-zinc-500">
          Select account type to unlock instant gift cards or corporate workforce disbursements.
        </p>
      </div>

      {/* Account Type Selector Tabs */}
      <div className="grid grid-cols-2 gap-2 bg-zinc-100 p-1 rounded-xl border border-zinc-200">
        <button
          type="button"
          onClick={() => {
            setAccountType("PERSONAL");
            setErrorMsg(null);
          }}
          className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
            accountType === "PERSONAL"
              ? "bg-white text-zinc-950 shadow-xs"
              : "text-zinc-500 hover:text-zinc-900"
          }`}
        >
          <UserIcon className="h-3.5 w-3.5" />
          <span>Personal Member</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setAccountType("ENTERPRISE");
            setErrorMsg(null);
          }}
          className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
            accountType === "ENTERPRISE"
              ? "bg-zinc-950 text-white shadow-xs"
              : "text-zinc-500 hover:text-zinc-900"
          }`}
        >
          <Building2 className="h-3.5 w-3.5" />
          <span>Enterprise Workspace</span>
        </button>
      </div>

      {/* Main Registration Form */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs p-6 space-y-5">
        {/* Welcome Bonus Callout */}
        <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-zinc-700" />
            <span className="text-zinc-600">Starting Point Grant:</span>
          </div>
          <span className="font-bold text-zinc-950">
            {accountType === "ENTERPRISE" ? "50,000 pts ($500 Pool)" : "2,500 pts ($25 Bonus)"}
          </span>
        </div>

        {errorMsg && (
          <div className="p-3 bg-zinc-100 border border-zinc-300 rounded-lg text-xs text-zinc-900 flex items-start gap-2 font-mono">
            <AlertCircle className="h-4 w-4 text-zinc-700 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-[10px] uppercase font-mono text-zinc-500 mb-1.5">
              {accountType === "ENTERPRISE" ? "Corporate Administrator Name" : "Full Name"}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={accountType === "ENTERPRISE" ? "e.g. Elena Rostova" : "e.g. Alex Morgan"}
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-sans text-zinc-900 focus:border-zinc-400 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-[10px] uppercase font-mono text-zinc-500 mb-1.5">
              {accountType === "ENTERPRISE" ? "Corporate Work Email" : "Email Address"}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={accountType === "ENTERPRISE" ? "elena@acmeworkspace.com" : "alex@example.com"}
                className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-sans text-zinc-900 focus:border-zinc-400 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Enterprise Specific Fields */}
          {accountType === "ENTERPRISE" && (
            <>
              <div>
                <label className="block text-[10px] uppercase font-mono text-zinc-500 mb-1.5">
                  Company / Organization Name
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Acme Corporation"
                    className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-sans text-zinc-900 focus:border-zinc-400 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono text-zinc-500 mb-1.5">
                  Estimated Team Size
                </label>
                <select
                  value={teamSize}
                  onChange={(e) => setTeamSize(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-sans text-zinc-900 focus:border-zinc-400 focus:bg-white focus:outline-none"
                >
                  <option value="1-10">1 - 10 Team Members</option>
                  <option value="10-50">10 - 50 Team Members</option>
                  <option value="50-250">50 - 250 Team Members</option>
                  <option value="250+">250+ Enterprise Scale</option>
                </select>
              </div>
            </>
          )}

          {/* Password */}
          <div>
            <label className="block text-[10px] uppercase font-mono text-zinc-500 mb-1.5">
              Account Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-sans text-zinc-900 focus:border-zinc-400 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            <span>
              {accountType === "ENTERPRISE" ? "Launch Enterprise Workspace" : "Create Personal Account"}
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-zinc-400" />
          </button>
        </form>
      </div>

      {/* Footer Link */}
      <div className="text-center text-xs text-zinc-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-zinc-950 hover:underline">
          Sign in here
        </Link>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto py-16 text-center text-xs font-mono text-zinc-500">
          Loading registration portal...
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
