"use client";

import React, { useState } from "react";
import { useUser } from "./UserContext";
import { simulatePurchase, claimDailyCheckIn, claimMilestoneBonus, claimReferralBonus } from "@/actions/points";
import { ShoppingBag, Calendar, Award, X, Check, Loader2, DollarSign, Users } from "lucide-react";

interface EarnSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EarnSimulatorModal({ isOpen, onClose }: EarnSimulatorModalProps) {
  const { currentUser, updateUserBalance, refreshUserData } = useUser();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; isError?: boolean } | null>(null);
  const [customSpend, setCustomSpend] = useState<string>("50");
  const [referralCode, setReferralCode] = useState<string>("VIP2026");

  if (!isOpen || !currentUser) return null;

  const handleSimulatePurchase = async (spend: number) => {
    try {
      setLoadingAction(`purchase-${spend}`);
      setFeedback(null);
      const res = await simulatePurchase({
        userId: currentUser.id,
        spendAmount: spend,
        storeName: "Flagship Retailer",
      });
      updateUserBalance(res.newBalance);
      setFeedback({
        message: `Success: Points credited from $${spend} simulated purchase (Tier multiplier applied).`,
      });
      refreshUserData();
    } catch (err: any) {
      setFeedback({ message: err.message || "Failed to simulate purchase", isError: true });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDailyCheckIn = async () => {
    try {
      setLoadingAction("checkin");
      setFeedback(null);
      const res = await claimDailyCheckIn(currentUser.id);
      updateUserBalance(res.newBalance);
      setFeedback({ message: "Streak active: +50 Daily Check-in points credited." });
      refreshUserData();
    } catch (err: any) {
      setFeedback({ message: err.message || "Check-in failed", isError: true });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleMilestone = async (name: string, pts: number) => {
    try {
      setLoadingAction(`milestone-${pts}`);
      setFeedback(null);
      const res = await claimMilestoneBonus(currentUser.id, name, pts);
      updateUserBalance(res.newBalance);
      setFeedback({ message: `Unlocked: +${pts} points credited for: ${name}.` });
      refreshUserData();
    } catch (err: any) {
      setFeedback({ message: err.message || "Milestone failed", isError: true });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleClaimReferral = async () => {
    try {
      setLoadingAction("referral");
      setFeedback(null);
      const res = await claimReferralBonus(currentUser.id, referralCode);
      updateUserBalance(res.newBalance);
      setFeedback({ message: `Referral applied: +500 points credited for code ${referralCode.toUpperCase()}.` });
      refreshUserData();
    } catch (err: any) {
      setFeedback({ message: err.message || "Referral failed", isError: true });
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-zinc-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-zinc-950 text-white flex items-center justify-between border-b border-zinc-800">
          <div>
            <h3 className="font-semibold text-base leading-tight">Simulate Point Earnings</h3>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              Testing engine for loyalty transactions, tier multipliers & referrals
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {feedback && (
            <div
              className={`p-3 rounded-lg text-xs font-mono flex items-center gap-2 ${
                feedback.isError
                  ? "bg-zinc-100 text-zinc-900 border border-zinc-300"
                  : "bg-zinc-100 text-zinc-900 border border-zinc-300"
              }`}
            >
              <Check className="h-4 w-4 shrink-0 text-zinc-800" />
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Action 1: Purchase simulator */}
          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-zinc-700" />
                <span className="text-xs font-semibold text-zinc-900">
                  Simulate Purchase (Tier Multipliers Active)
                </span>
              </div>
              <span className="text-[11px] text-zinc-500 font-mono">Instant credit</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[25, 50, 100].map((amt) => (
                <button
                  key={amt}
                  disabled={!!loadingAction}
                  onClick={() => handleSimulatePurchase(amt)}
                  className="px-3 py-2 rounded-lg bg-white border border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50 text-xs font-mono text-zinc-800 transition-colors flex flex-col items-center justify-center disabled:opacity-50"
                >
                  {loadingAction === `purchase-${amt}` ? (
                    <Loader2 className="h-4 w-4 animate-spin text-zinc-600 my-1" />
                  ) : (
                    <>
                      <span className="font-semibold">${amt} Spend</span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        +{amt * 10}+ pts
                      </span>
                    </>
                  )}
                </button>
              ))}
            </div>

            {/* Custom Amount input */}
            <div className="flex items-center gap-2 pt-1">
              <div className="relative flex-1">
                <DollarSign className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={customSpend}
                  onChange={(e) => setCustomSpend(e.target.value)}
                  placeholder="Custom spend"
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs font-mono focus:border-zinc-400 focus:outline-none"
                />
              </div>
              <button
                disabled={!!loadingAction || !customSpend || Number(customSpend) <= 0}
                onClick={() => handleSimulatePurchase(Number(customSpend))}
                className="px-3 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-medium transition-colors disabled:opacity-50 shrink-0"
              >
                Earn Points
              </button>
            </div>
          </div>

          {/* Action 2: Daily Check-in Streak */}
          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-zinc-200 flex items-center justify-center text-zinc-800">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-900">Daily Check-in Streak</p>
                <p className="text-[11px] text-zinc-500 font-mono">Claim 50 bonus points daily</p>
              </div>
            </div>
            <button
              disabled={!!loadingAction}
              onClick={handleDailyCheckIn}
              className="px-3.5 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50 font-mono"
            >
              {loadingAction === "checkin" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                "Claim +50 pts"
              )}
            </button>
          </div>

          {/* Action 3: Referral Program Code */}
          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-zinc-700" />
                <span className="text-xs font-semibold text-zinc-900">Referral Code (+500 pts)</span>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">One-time bonus</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                placeholder="Enter referral code"
                className="flex-1 px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs uppercase font-mono tracking-wider focus:border-zinc-400 focus:outline-none"
              />
              <button
                disabled={!!loadingAction || !referralCode}
                onClick={handleClaimReferral}
                className="px-3 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-medium transition-colors disabled:opacity-50 shrink-0 font-mono"
              >
                {loadingAction === "referral" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Redeem Code"}
              </button>
            </div>
          </div>

          {/* Action 4: Milestone Celebrations */}
          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 space-y-2.5">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-zinc-700" />
              <span className="text-xs font-semibold text-zinc-900">Milestone Rewards</span>
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono">
              <button
                disabled={!!loadingAction}
                onClick={() => handleMilestone("5-Star Review Bonus", 250)}
                className="px-3 py-2 rounded-lg bg-white border border-zinc-200 hover:border-zinc-400 text-left text-xs font-medium text-zinc-700 transition-colors flex items-center justify-between disabled:opacity-50"
              >
                <span>5-Star Review</span>
                <span className="text-[11px] font-bold text-zinc-950">+250 pts</span>
              </button>
              <button
                disabled={!!loadingAction}
                onClick={() => handleMilestone("Social Media Follow", 200)}
                className="px-3 py-2 rounded-lg bg-white border border-zinc-200 hover:border-zinc-400 text-left text-xs font-medium text-zinc-700 transition-colors flex items-center justify-between disabled:opacity-50"
              >
                <span>Social Follow</span>
                <span className="text-[11px] font-bold text-zinc-950">+200 pts</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-zinc-50 border-t border-zinc-200 flex justify-between items-center text-xs font-mono">
          <span className="text-zinc-500">
            Balance: <strong className="text-zinc-950 font-bold">{currentUser.pointBalance} pts</strong>
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-100 font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
