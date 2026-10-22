"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/UserContext";
import { loginUser } from "@/actions/users";
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  Loader2, 
  Check, 
  Building2, 
  User as UserIcon,
  Eye,
  EyeOff,
  AlertCircle
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { users, switchUser, refreshUserData } = useUser();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      const user = await loginUser({ email });
      await refreshUserData();
      switchUser(user.id);
      
      // Route based on role
      if (user.role === "ADMIN" || user.email.includes("corp") || user.email.includes("admin")) {
        router.push("/bulk-rewards");
      } else {
        router.push("/wallet");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (userId: string, isEnt: boolean) => {
    switchUser(userId);
    if (isEnt) {
      router.push("/bulk-rewards");
    } else {
      router.push("/wallet");
    }
  };

  return (
    <div className="max-w-md mx-auto py-10 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-800 text-xs font-mono">
          <Lock className="h-3.5 w-3.5 text-zinc-700" />
          <span>Secure Platform Access</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
          Sign In to Nougat
        </h1>
        <p className="text-xs text-zinc-500">
          Access your personal gift card wallet or enterprise rewards workspace.
        </p>
      </div>

      {/* Main Login Card */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs p-6 space-y-5">
        {errorMsg && (
          <div className="p-3 bg-zinc-100 border border-zinc-300 rounded-lg text-xs text-zinc-900 flex items-start gap-2 font-mono">
            <AlertCircle className="h-4 w-4 text-zinc-700 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase font-mono text-zinc-500 mb-1.5">
              Work or Personal Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
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
                className="w-full pl-9 pr-10 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-sans text-zinc-900 focus:border-zinc-400 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-medium shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            <span>Sign In to Account</span>
            <ArrowRight className="h-3.5 w-3.5 text-zinc-400" />
          </button>
        </form>

        {/* Persona One-Click Access Strip */}
        <div className="pt-4 border-t border-zinc-100 space-y-2.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block text-center">
            Or Quick-Launch Demo Account
          </span>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {users.slice(0, 4).map((u) => {
              const isEnt = u.role === "ADMIN" || u.email.includes("corp") || u.email.includes("admin");
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickLogin(u.id, isEnt)}
                  className="p-2.5 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-left transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    {isEnt ? (
                      <Building2 className="h-3 w-3 text-zinc-900 shrink-0" />
                    ) : (
                      <UserIcon className="h-3 w-3 text-zinc-600 shrink-0" />
                    )}
                    <span className="font-semibold text-zinc-950 truncate block text-[11px]">
                      {u.name?.split(" ")[0]}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 block truncate mt-0.5">
                    {isEnt ? "Enterprise" : "Personal"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Link */}
      <div className="text-center text-xs text-zinc-500">
        Don&apos;t have an account yet?{" "}
        <Link href="/signup" className="font-semibold text-zinc-950 hover:underline">
          Sign up for free
        </Link>
      </div>
    </div>
  );
}

