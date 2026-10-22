"use client";

import React from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  ArrowRight, 
  Zap, 
  Lock, 
  Globe2, 
  Building2, 
  Users, 
  CreditCard, 
  Wallet, 
  CheckCircle2, 
  Server, 
  Check, 
  FileSpreadsheet,
  ArrowUpRight,
  Code2,
  Terminal,
  Cpu
} from "lucide-react";

export default function MarketingPage() {
  return (
    <div className="space-y-24 py-6">
      {/* 1. Hero Section */}
      <section className="text-center max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-800 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Nougat Infrastructure 2026 • Commercial Release</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-zinc-950 leading-[1.1]">
          The Point Ledger & Real-Time Gift Card Settlement Gateway.
        </h1>

        <p className="text-base sm:text-lg text-zinc-600 max-w-2xl mx-auto leading-relaxed">
          Nougat powers point-to-gift-card conversions with double-entry ACID isolation, dual-provider automatic failover via Tremendous API, and enterprise bulk employee disbursements.
        </p>

        {/* CTA Button Group */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/signup?type=enterprise"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs"
          >
            <Building2 className="h-4 w-4" />
            <span>Create Enterprise Workspace</span>
            <ArrowRight className="h-3.5 w-3.5 text-zinc-400" />
          </Link>

          <Link
            href="/login"
            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-zinc-200 hover:bg-zinc-100 bg-white text-zinc-900 text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <span>Sign In to Portal</span>
          </Link>

          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-zinc-200 hover:bg-zinc-100 bg-white text-zinc-600 hover:text-zinc-950 text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Explore Live Demo</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-zinc-400" />
          </Link>
        </div>

        {/* Operational Highlights Strip */}
        <div className="pt-6 grid grid-cols-2 md:grid-cols-4 gap-3 text-left font-mono">
          <div className="p-3.5 rounded-xl bg-white border border-zinc-200 shadow-xs">
            <span className="text-[10px] uppercase text-zinc-400 block">Ledger Isolation</span>
            <span className="text-sm font-bold text-zinc-950 block mt-0.5">ACID Compliant</span>
            <span className="text-[11px] text-zinc-500">Zero double-spends</span>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-zinc-200 shadow-xs">
            <span className="text-[10px] uppercase text-zinc-400 block">Gateway Settlement</span>
            <span className="text-sm font-bold text-zinc-950 block mt-0.5">Tremendous API</span>
            <span className="text-[11px] text-zinc-500">Auto Reloadly fallback</span>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-zinc-200 shadow-xs">
            <span className="text-[10px] uppercase text-zinc-400 block">Vault Cryptography</span>
            <span className="text-sm font-bold text-zinc-950 block mt-0.5">AES-256-GCM</span>
            <span className="text-[11px] text-zinc-500">Authenticated tags</span>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-zinc-200 shadow-xs">
            <span className="text-[10px] uppercase text-zinc-400 block">Exchange Ratio</span>
            <span className="text-sm font-bold text-zinc-950 block mt-0.5">100 pts = $1.00</span>
            <span className="text-[11px] text-zinc-500">7 currencies supported</span>
          </div>
        </div>
      </section>

      {/* 2. Dual-Mode Architecture Showcase: Personal vs Enterprise */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 block">
            Designed For Two Unified Audiences
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-950 tracking-tight">
            Tailored Experiences for Consumers and Organizations
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600">
            A single unified backend engine supporting both personal loyalty members and corporate enterprise workforces.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1: General Consumer Portal */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-800 text-xs font-mono border border-zinc-200">
                <Users className="h-3.5 w-3.5 text-zinc-600" />
                <span>General Consumer Experience</span>
              </div>

              <h3 className="text-xl font-bold text-zinc-950">Personal Loyalty Rewards</h3>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                Allow customers to earn points on every retail transaction and convert balances into instant digital gift cards for Starbucks, Amazon, Apple, Target, and 100+ global brands.
              </p>

              <div className="space-y-2.5 pt-2 text-xs">
                <div className="flex items-center gap-2 text-zinc-800">
                  <Check className="h-4 w-4 text-zinc-950 shrink-0" />
                  <span>Instant barcode and PIN delivery for physical retail checkouts</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-800">
                  <Check className="h-4 w-4 text-zinc-950 shrink-0" />
                  <span>Apple Wallet & Google Pay digital pass export</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-800">
                  <Check className="h-4 w-4 text-zinc-950 shrink-0" />
                  <span>VIP loyalty tier progression (Bronze, Silver, Gold, Platinum)</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-800">
                  <Check className="h-4 w-4 text-zinc-950 shrink-0" />
                  <span>Send personalized gift cards with custom greeting notes</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-100">
              <Link
                href="/signup?type=personal"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-xs font-semibold transition-colors"
              >
                <span>Join Personal Rewards</span>
                <ArrowRight className="h-3.5 w-3.5 text-zinc-500" />
              </Link>
            </div>
          </div>

          {/* Card 2: Enterprise Corporate Workspace */}
          <div className="bg-white rounded-2xl border border-zinc-950 shadow-xs p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-950 text-white text-xs font-mono border border-zinc-800">
                <Building2 className="h-3.5 w-3.5 text-white" />
                <span>Corporate Enterprise Workspace</span>
              </div>

              <h3 className="text-xl font-bold text-zinc-950">B2B Workforce Incentives</h3>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                Empower HR leaders, department heads, and managers to distribute spot bonuses and performance milestones across hundreds of employees with one-click spreadsheet imports.
              </p>

              <div className="space-y-2.5 pt-2 text-xs">
                <div className="flex items-center gap-2 text-zinc-800">
                  <Check className="h-4 w-4 text-zinc-950 shrink-0" />
                  <span>CSV spreadsheet team upload with auto-column parsing</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-800">
                  <Check className="h-4 w-4 text-zinc-950 shrink-0" />
                  <span>Split-tender billing: Exhaust points + charge Corporate Credit Card</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-800">
                  <Check className="h-4 w-4 text-zinc-950 shrink-0" />
                  <span>Merchant POS scanner terminal for in-store voucher redemption</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-800">
                  <Check className="h-4 w-4 text-zinc-950 shrink-0" />
                  <span>Interactive Tremendous webhook simulator for API verification</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-100">
              <Link
                href="/signup?type=enterprise"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold transition-colors shadow-xs"
              >
                <span>Launch Enterprise Workspace</span>
                <ArrowRight className="h-3.5 w-3.5 text-zinc-400" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Core Technical Capabilities Bento Grid */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 block">
            Enterprise Engine Specs
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-950 tracking-tight">
            Engineered for High-Consequence Financial Transactions
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600">
            Guaranteed isolation, multi-provider resiliency, and military-grade encryption built-in.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Bento Item 1 */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs space-y-3">
            <div className="h-9 w-9 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center">
              <Lock className="h-4 w-4 text-zinc-900" />
            </div>
            <h4 className="font-semibold text-sm text-zinc-950">ACID Atomic Double-Entry</h4>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Every point debit and credit is an immutable ledger entry. Row-level transaction isolation prevents race conditions and double-spending across concurrent requests.
            </p>
          </div>

          {/* Bento Item 2 */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs space-y-3">
            <div className="h-9 w-9 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center">
              <Server className="h-4 w-4 text-zinc-900" />
            </div>
            <h4 className="font-semibold text-sm text-zinc-950">Dual-Provider Failover</h4>
            <p className="text-xs text-zinc-600 leading-relaxed">
              If the primary Tremendous API gateway returns an upstream outage or rate-limit, orders automatically fail over to Reloadly without human intervention.
            </p>
          </div>

          {/* Bento Item 3 */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs space-y-3">
            <div className="h-9 w-9 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-zinc-900" />
            </div>
            <h4 className="font-semibold text-sm text-zinc-950">AES-256-GCM Vault</h4>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Digital card claim codes and PIN numbers are encrypted at rest using AES-256-GCM with distinct 96-bit initialization vectors and authenticated tags.
            </p>
          </div>

          {/* Bento Item 4 */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs space-y-3">
            <div className="h-9 w-9 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center">
              <Globe2 className="h-4 w-4 text-zinc-900" />
            </div>
            <h4 className="font-semibold text-sm text-zinc-950">Global Multi-Currency FX</h4>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Real-time foreign exchange matrix dynamically converts points and card denominations across USD, EUR, GBP, JPY, CAD, AUD, and INR.
            </p>
          </div>

          {/* Bento Item 5 */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs space-y-3">
            <div className="h-9 w-9 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center">
              <Terminal className="h-4 w-4 text-zinc-900" />
            </div>
            <h4 className="font-semibold text-sm text-zinc-950">Webhook Sandbox & Audit</h4>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Built-in HMAC-SHA256 signature verification console allows administrators to simulate partner order callbacks and test atomic refund rollbacks.
            </p>
          </div>

          {/* Bento Item 6 */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs space-y-3">
            <div className="h-9 w-9 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-zinc-900" />
            </div>
            <h4 className="font-semibold text-sm text-zinc-950">Merchant POS Terminal</h4>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Retail cashier simulator with barcode scanner hotkey support, partial balance swipes, and formatted printed receipts with remaining balance tracking.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Enterprise Feature Comparison Table */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 block">
            Plan Capabilities
          </span>
          <h2 className="text-2xl font-bold text-zinc-950 tracking-tight">
            Compare Account Features
          </h2>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 font-mono text-zinc-500 text-[11px] uppercase">
                  <th className="py-3.5 px-6 font-semibold">Capability</th>
                  <th className="py-3.5 px-6 font-semibold">Personal Member</th>
                  <th className="py-3.5 px-6 font-semibold">Enterprise Workspace</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                <tr>
                  <td className="py-3.5 px-6 font-medium text-zinc-950">Instant Gift Card Redemptions</td>
                  <td className="py-3.5 px-6 text-zinc-700">Yes (100+ Brands)</td>
                  <td className="py-3.5 px-6 text-zinc-950 font-semibold">Yes (Unlimited Catalog)</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-medium text-zinc-950">Bulk Team CSV Import</td>
                  <td className="py-3.5 px-6 text-zinc-400">Not Available</td>
                  <td className="py-3.5 px-6 text-zinc-950 font-semibold">Yes (Unlimited Batch Size)</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-medium text-zinc-950">Split Corporate Card Co-Pay</td>
                  <td className="py-3.5 px-6 text-zinc-400">Personal Cards Only</td>
                  <td className="py-3.5 px-6 text-zinc-950 font-semibold">Corporate Card & Invoicing</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-medium text-zinc-950">Merchant POS Terminal Access</td>
                  <td className="py-3.5 px-6 text-zinc-400">Simulator Only</td>
                  <td className="py-3.5 px-6 text-zinc-950 font-semibold">Full Merchant Terminal & Barcodes</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-medium text-zinc-950">Webhook Simulation & Telemetry</td>
                  <td className="py-3.5 px-6 text-zinc-400">Not Available</td>
                  <td className="py-3.5 px-6 text-zinc-950 font-semibold">HMAC-SHA256 Sandbox Console</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-medium text-zinc-950">Audit Trail Exports</td>
                  <td className="py-3.5 px-6 text-zinc-700">Personal Ledger CSV</td>
                  <td className="py-3.5 px-6 text-zinc-950 font-semibold">Full B2B Settlement CSVs</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 5. Bottom Call to Action */}
      <section className="bg-zinc-950 text-white rounded-2xl p-10 sm:p-12 text-center space-y-6 shadow-sm">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white max-w-xl mx-auto">
          Start Settling Digital Gift Cards with Complete Isolation.
        </h2>
        <p className="text-zinc-400 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
          Create an enterprise workspace to disburse employee bonuses, or join as a personal rewards member today.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/signup?type=enterprise"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <Building2 className="h-4 w-4" />
            <span>Set Up Enterprise Workspace</span>
          </Link>

          <Link
            href="/login"
            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-zinc-300 hover:text-white text-xs sm:text-sm font-medium transition-colors"
          >
            <span>Sign In to Existing Account</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

