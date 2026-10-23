"use client";

import React, { useState } from "react";
import { useUser } from "./UserContext";
import { redeemPointsForCard } from "@/actions/redeem";
import { initiateSplitTenderPayment } from "@/actions/payments";
import { requestRedemptionOtp } from "@/actions/otp";
import { formatPoints, dollarsToPoints } from "@/lib/utils";
import { OtpVerificationModal } from "./OtpVerificationModal";
import { validateCouponAction } from "@/actions/promotions";
import { 
  X, 
  AlertTriangle, 
  Loader2, 
  ShieldCheck, 
  ArrowRight,
  CreditCard,
  Lock,
  Gift,
  Tag,
  Check,
  Percent
} from "lucide-react";
import confetti from "canvas-confetti";
import { formatWithFx } from "@/lib/currency/fx";

export interface BrandItem {
  id: string;
  name: string;
  category: string;
  currencyCode: string;
  minRecipientVal: number;
  maxRecipientVal: number;
  logoUrl: string;
  description: string;
  denominations: number[];
  pointsPerUnit: number;
}

interface RedemptionModalProps {
  brand: BrandItem;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (orderData: any) => void;
}

export default function RedemptionModal({
  brand,
  isOpen,
  onClose,
  onSuccess,
}: RedemptionModalProps) {
  const { currentUser, updateUserBalance, refreshUserData, currentCurrency } = useUser();
  const [selectedDenomination, setSelectedDenomination] = useState<number>(
    brand.denominations[0] || 25
  );
  const [preferredProvider, setPreferredProvider] = useState<"AUTO_FAILOVER" | "BITREFILL" | "TREMENDOUS" | "RELOADLY">("AUTO_FAILOVER");
  const [isGift, setIsGift] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 2FA OTP state for high-value redemptions ($100+)
  const [otpChallenge, setOtpChallenge] = useState<{
    challengeId: string;
    expiresAt: number;
    maskedEmail: string;
    previewCode?: string;
  } | null>(null);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);

  // Promotional coupon state
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountPercentage: number;
    bonusPoints: number;
    discountDollars: number;
    message: string;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponFeedback, setCouponFeedback] = useState<{ message: string; isError?: boolean } | null>(null);

  if (!isOpen || !currentUser) return null;

  const basePointsRequired = dollarsToPoints(selectedDenomination);
  const couponDiscountPts = appliedCoupon ? appliedCoupon.discountDollars * 100 : 0;
  const pointsRequired = Math.max(100, basePointsRequired - couponDiscountPts);
  const userBalance = currentUser.pointBalance;
  const hasEnoughPoints = userBalance >= pointsRequired;
  const remainingPoints = userBalance - pointsRequired;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) return;

    try {
      setCouponLoading(true);
      setCouponFeedback(null);
      const res = await validateCouponAction(couponCodeInput, selectedDenomination);
      if (res.valid) {
        setAppliedCoupon({
          code: couponCodeInput.trim().toUpperCase(),
          discountPercentage: res.discountPercentage,
          bonusPoints: res.bonusPoints,
          discountDollars: res.discountDollars,
          message: res.message,
        });
        setCouponFeedback({ message: res.message });
      } else {
        setCouponFeedback({ message: res.message, isError: true });
      }
    } catch (e: any) {
      setCouponFeedback({ message: e.message || "Failed to validate coupon.", isError: true });
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCodeInput("");
    setCouponFeedback(null);
  };

  // Split-Tender (Points + Cash Top-up)
  const [useSplitTender, setUseSplitTender] = useState(false);
  const [cardMask, setCardMask] = useState("4242 4242 4242 4242");
  const [cardExp, setCardExp] = useState("12/28");
  const [cardCvc, setCardCvc] = useState("888");

  const pointsToApply = Math.min(userBalance, pointsRequired);
  const shortfallPoints = Math.max(0, pointsRequired - userBalance);
  const cashAmount = shortfallPoints / 100;
  const isSplitTenderActive = !hasEnoughPoints && useSplitTender;
  const canProceed = hasEnoughPoints || isSplitTenderActive;

  const handleRedeem = async () => {
    if (!canProceed) {
      if (!hasEnoughPoints && !useSplitTender) {
        setUseSplitTender(true);
        return;
      }
      setErrorMessage(
        `Insufficient points. You need ${formatPoints(pointsRequired - userBalance)} more points.`
      );
      return;
    }

    // High-value redemption ($100+) triggers 2FA security challenge
    if (selectedDenomination >= 100) {
      try {
        setIsSubmitting(true);
        setErrorMessage(null);
        const challenge = await requestRedemptionOtp({
          userId: currentUser.id,
          faceValue: selectedDenomination,
          brandName: brand.name,
        });
        setOtpChallenge(challenge);
        setIsOtpModalOpen(true);
        return;
      } catch (err: any) {
        setErrorMessage(err.message || "Failed to dispatch security verification code.");
        return;
      } finally {
        setIsSubmitting(false);
      }
    }

    // Standard redemptions (< $100) proceed immediately
    await executeRedemptionOrder();
  };

  const executeRedemptionOrder = async (otpToken?: string, otpChallengeId?: string) => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      let paymentIntentId: string | undefined = undefined;
      if (isSplitTenderActive && cashAmount > 0) {
        const intentRes = await initiateSplitTenderPayment({
          userId: currentUser.id,
          brandId: brand.id,
          cashAmountInDollars: cashAmount,
          pointsSpent: pointsToApply,
        });
        paymentIntentId = intentRes.paymentIntentId;
      }

      const result = await redeemPointsForCard({
        userId: currentUser.id,
        brandId: brand.id,
        faceValue: selectedDenomination,
        preferredProvider,
        isGift,
        recipientName,
        recipientEmail,
        giftMessage,
        simulateFailure,
        useSplitTender: isSplitTenderActive,
        cashAmount: isSplitTenderActive ? cashAmount : 0,
        paymentCardMask: isSplitTenderActive ? `Visa •••• ${cardMask.slice(-4)}` : undefined,
        paymentIntentId,
        otpChallengeId,
        otpVerificationToken: otpToken,
        appliedCouponCode: appliedCoupon?.code,
      });

      // Confetti burst
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // Fallback
      }

      const pointsDeducted = isSplitTenderActive ? pointsToApply : pointsRequired;
      updateUserBalance(userBalance - pointsDeducted);
      refreshUserData();
      setIsOtpModalOpen(false);
      onSuccess(result);
    } catch (err: any) {
      setErrorMessage(err.message || "Redemption request failed.");
      refreshUserData();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-zinc-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-zinc-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-zinc-900 flex items-center justify-center overflow-hidden p-1 border border-zinc-800">
              <img
                src={brand.logoUrl}
                alt={brand.name}
                className="w-full h-full object-cover rounded-md"
              />
            </div>
            <div>
              <h3 className="font-semibold text-base leading-tight">Redeem {brand.name}</h3>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                100 points = $1.00 USD • Instant Digital Delivery
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Error / Alert banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-lg bg-zinc-100 border border-zinc-300 text-zinc-900 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertTriangle className="h-4 w-4 text-zinc-700 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block font-mono">Redemption Alert</strong>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Select Denomination */}
          <div>
            <label className="block text-xs font-mono font-medium text-zinc-500 uppercase tracking-wider mb-2">
              Select Card Value
            </label>
            <div className="grid grid-cols-4 gap-2">
              {brand.denominations.map((denom) => {
                const cost = dollarsToPoints(denom);
                const isSelected = selectedDenomination === denom;
                const canAfford = userBalance >= cost;

                return (
                  <button
                    key={denom}
                    type="button"
                    onClick={() => {
                      setSelectedDenomination(denom);
                      setErrorMessage(null);
                    }}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      isSelected
                        ? "border-zinc-950 bg-zinc-100 ring-1 ring-zinc-950 font-bold"
                        : "border-zinc-200 hover:border-zinc-300 bg-white"
                    } ${!canAfford ? "opacity-60" : ""}`}
                  >
                    <span className="block text-base font-bold text-zinc-950 font-mono">
                      {currentCurrency === "USD" ? `$${denom}` : formatWithFx(denom, currentCurrency)}
                    </span>
                    <span className="block text-[11px] font-mono font-medium text-zinc-600 mt-0.5">
                      {formatPoints(cost)} pts
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Promotional Coupon Code Input */}
          <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/60 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-semibold text-zinc-900 flex items-center gap-1.5 font-sans">
                <Tag className="h-3.5 w-3.5 text-zinc-700" />
                <span>Promotional Discount Coupon</span>
              </span>
              {appliedCoupon && (
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-950 text-white font-medium">
                  {appliedCoupon.code} Applied
                </span>
              )}
            </div>

            {appliedCoupon ? (
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-zinc-200 text-xs font-mono">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 font-bold text-zinc-950">
                    <Check className="h-3.5 w-3.5 text-zinc-900" />
                    <span>{appliedCoupon.code}</span>
                    <span className="text-zinc-500 font-normal">
                      ({appliedCoupon.discountPercentage > 0 ? `${appliedCoupon.discountPercentage}% Discount` : "Bonus Applied"})
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 font-sans">
                    Saved {appliedCoupon.discountDollars * 100} points (${appliedCoupon.discountDollars.toFixed(2)})
                    {appliedCoupon.bonusPoints > 0 ? ` + ${appliedCoupon.bonusPoints.toLocaleString()} bonus pts` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="px-2 py-1 rounded text-[11px] font-sans text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 transition-colors"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. SAVE10 or CORP20"
                  value={couponCodeInput}
                  onChange={(e) => {
                    setCouponCodeInput(e.target.value.toUpperCase());
                    setCouponFeedback(null);
                  }}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-xs font-mono uppercase text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-400"
                />
                <button
                  type="submit"
                  disabled={couponLoading || !couponCodeInput.trim()}
                  className="px-3.5 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-medium font-sans transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {couponLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                  <span>Apply</span>
                </button>
              </form>
            )}

            {couponFeedback && (
              <p
                className={`text-[11px] font-mono ${
                  couponFeedback.isError ? "text-zinc-700 font-medium" : "text-zinc-900 font-semibold"
                }`}
              >
                {couponFeedback.message}
              </p>
            )}
          </div>

          {/* Points Breakdown Box */}
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center text-zinc-600">
              <span>Your Current Balance:</span>
              <span className="font-semibold text-zinc-950">
                {formatPoints(userBalance)} pts
              </span>
            </div>
            {appliedCoupon && couponDiscountPts > 0 ? (
              <>
                <div className="flex justify-between items-center text-zinc-600">
                  <span>Standard Cost (${selectedDenomination}):</span>
                  <span className="font-mono text-zinc-500 line-through">
                    {formatPoints(basePointsRequired)} pts
                  </span>
                </div>
                <div className="flex justify-between items-center text-zinc-900 font-semibold">
                  <span className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    <span>Coupon '{appliedCoupon.code}' ({appliedCoupon.discountPercentage}% off):</span>
                  </span>
                  <span>-{formatPoints(couponDiscountPts)} pts</span>
                </div>
                <div className="flex justify-between items-center text-zinc-600">
                  <span>Final Points Required:</span>
                  <span className="font-semibold text-zinc-950">
                    -{formatPoints(pointsRequired)} pts
                  </span>
                </div>
              </>
            ) : (
              <div className="flex justify-between items-center text-zinc-600">
                <span>Points Required for ${selectedDenomination}:</span>
                <span className="font-semibold text-zinc-950">
                  -{formatPoints(pointsRequired)} pts
                </span>
              </div>
            )}
            {appliedCoupon && appliedCoupon.bonusPoints > 0 && (
              <div className="flex justify-between items-center text-zinc-900 font-bold bg-zinc-100 p-1.5 rounded">
                <span>Bonus Loyalty Points:</span>
                <span>+{appliedCoupon.bonusPoints.toLocaleString()} pts</span>
              </div>
            )}
            <div className="border-t border-zinc-200 pt-2 flex justify-between items-center">
              <span className="font-semibold text-zinc-950">Remaining Balance:</span>
              <span
                className={`font-bold ${
                  remainingPoints >= 0 ? "text-zinc-950" : "text-zinc-500"
                }`}
              >
                {remainingPoints >= 0 ? `${formatPoints(remainingPoints)} pts` : "Insufficient Balance"}
              </span>
            </div>
          </div>

          {/* Split-Tender Option */}
          {!hasEnoughPoints && (
            <div className={`p-4 rounded-xl border transition-all ${
              useSplitTender 
                ? "bg-zinc-100 border-zinc-400" 
                : "bg-zinc-50 border-zinc-200"
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-zinc-950 text-white flex items-center justify-center shrink-0">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-950 flex items-center gap-1.5 font-mono">
                      Split-Tender Checkout
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-zinc-200 text-zinc-800">
                        Points + Card
                      </span>
                    </h4>
                    <p className="text-[11px] text-zinc-500">
                      Use all {formatPoints(pointsToApply)} pts (${(pointsToApply/100).toFixed(2)}) + pay ${cashAmount.toFixed(2)} with card
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useSplitTender}
                    onChange={(e) => setUseSplitTender(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-zinc-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-zinc-950"></div>
                </label>
              </div>

              {useSplitTender && (
                <div className="mt-3.5 pt-3.5 border-t border-zinc-200 space-y-3 animate-in fade-in">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white p-2.5 rounded-lg border border-zinc-200">
                      <span className="text-[10px] text-zinc-500 uppercase block font-mono">Points Value</span>
                      <span className="font-semibold text-zinc-900 font-mono">
                        {formatPoints(pointsToApply)} pts (${(pointsToApply / 100).toFixed(2)})
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-zinc-200">
                      <span className="text-[10px] text-zinc-500 uppercase block font-mono">Charge to Card</span>
                      <span className="font-bold text-zinc-950 text-sm font-mono">
                        {currentCurrency === "USD" 
                          ? `$${cashAmount.toFixed(2)} USD` 
                          : `${formatWithFx(cashAmount, currentCurrency)}`}
                      </span>
                    </div>
                  </div>

                  {/* Card input mockup */}
                  <div className="space-y-2 bg-white p-3 rounded-lg border border-zinc-200">
                    <div className="flex items-center justify-between text-[11px] font-mono text-zinc-600">
                      <span>Card Details (Pre-Authorized Test Card)</span>
                      <span className="flex items-center gap-1 text-[10px] text-zinc-500 font-mono">
                        <Lock className="h-3 w-3" /> 256-bit Encrypted
                      </span>
                    </div>

                    <div className="space-y-2">
                      <input
                        type="text"
                        value={cardMask}
                        onChange={(e) => setCardMask(e.target.value)}
                        placeholder="Card Number"
                        className="w-full px-3 py-1.5 font-mono text-xs bg-zinc-50 border border-zinc-200 rounded-md focus:border-zinc-400 focus:outline-none"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={cardExp}
                          onChange={(e) => setCardExp(e.target.value)}
                          placeholder="MM/YY"
                          className="w-full px-3 py-1.5 font-mono text-xs bg-zinc-50 border border-zinc-200 rounded-md focus:border-zinc-400 focus:outline-none"
                        />
                        <input
                          type="text"
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value)}
                          placeholder="CVC"
                          className="w-full px-3 py-1.5 font-mono text-xs bg-zinc-50 border border-zinc-200 rounded-md focus:border-zinc-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Gift to a Friend Section */}
          <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50 space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="isGiftCheckbox" className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-zinc-900">
                <input
                  type="checkbox"
                  id="isGiftCheckbox"
                  checked={isGift}
                  onChange={(e) => setIsGift(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-950 cursor-pointer"
                />
                <span className="flex items-center gap-1.5">
                  <Gift className="h-3.5 w-3.5 text-zinc-700" />
                  Send as a Gift to someone else
                </span>
              </label>
              <span className="text-[10px] text-zinc-500 font-mono">Personalized</span>
            </div>

            {isGift && (
              <div className="space-y-2.5 pt-2 border-t border-zinc-200 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-zinc-500 mb-1">
                      Recipient Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sophia Clark"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-md text-xs focus:border-zinc-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-zinc-500 mb-1">
                      Recipient Email
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. sophia@example.com"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-md text-xs focus:border-zinc-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono text-zinc-500 mb-1">
                    Personalized Greeting Note
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Happy Birthday! Enjoy this gift voucher."
                    value={giftMessage}
                    onChange={(e) => setGiftMessage(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-md text-xs focus:border-zinc-400 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Provider Selection */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-mono uppercase text-zinc-500 tracking-wider">
              Fulfillment Provider Route
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setPreferredProvider("AUTO_FAILOVER")}
                className={`py-1.5 px-2 rounded-lg border text-center text-xs font-mono font-medium transition-colors ${
                  preferredProvider === "AUTO_FAILOVER"
                    ? "border-zinc-950 bg-zinc-950 text-white font-semibold"
                    : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                Auto-Failover
              </button>
              <button
                type="button"
                onClick={() => setPreferredProvider("BITREFILL")}
                className={`py-1.5 px-2 rounded-lg border text-center text-xs font-mono font-medium transition-colors ${
                  preferredProvider === "BITREFILL"
                    ? "border-zinc-950 bg-zinc-950 text-white font-semibold"
                    : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                Bitrefill Live
              </button>
              <button
                type="button"
                onClick={() => setPreferredProvider("TREMENDOUS")}
                className={`py-1.5 px-2 rounded-lg border text-center text-xs font-mono font-medium transition-colors ${
                  preferredProvider === "TREMENDOUS"
                    ? "border-zinc-950 bg-zinc-950 text-white font-semibold"
                    : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                Tremendous
              </button>
              <button
                type="button"
                onClick={() => setPreferredProvider("RELOADLY")}
                className={`py-1.5 px-2 rounded-lg border text-center text-xs font-mono font-medium transition-colors ${
                  preferredProvider === "RELOADLY"
                    ? "border-zinc-950 bg-zinc-950 text-white font-semibold"
                    : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                Reloadly
              </button>
            </div>
          </div>

          {/* Test Rollback Simulation Toggle */}
          <div className="p-3.5 rounded-xl border border-zinc-300 bg-zinc-100 flex items-start gap-3">
            <input
              type="checkbox"
              id="simulateFail"
              checked={simulateFailure}
              onChange={(e) => setSimulateFailure(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-zinc-400 text-zinc-900 focus:ring-zinc-950 cursor-pointer"
            />
            <label htmlFor="simulateFail" className="text-xs text-zinc-900 cursor-pointer select-none">
              <strong className="font-semibold block flex items-center gap-1.5 font-mono">
                <ShieldCheck className="h-3.5 w-3.5 text-zinc-700" />
                Simulate Provider Failure (Test ACID Rollback)
              </strong>
              <span className="text-[11px] text-zinc-600 block mt-0.5">
                Forces provider API rejection to demonstrate atomic point deduction, failure detection, and automatic refund ledger entry.
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-3.5 py-2 rounded-lg text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleRedeem}
            disabled={!canProceed || isSubmitting}
            className={`px-4 py-2 rounded-lg text-xs font-semibold text-white shadow-xs flex items-center gap-2 transition-colors ${
              !canProceed || isSubmitting
                ? "bg-zinc-300 text-zinc-500 cursor-not-allowed"
                : "bg-zinc-950 hover:bg-zinc-800"
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Processing Transaction...</span>
              </>
            ) : isSplitTenderActive ? (
              <>
                <CreditCard className="h-3.5 w-3.5" />
                <span>Pay ${cashAmount.toFixed(2)} & Use {formatPoints(pointsToApply)} pts</span>
              </>
            ) : (
              <>
                {selectedDenomination >= 100 && <Lock className="h-3.5 w-3.5 text-zinc-400" />}
                <span>
                  {selectedDenomination >= 100
                    ? `Verify 2FA & Redeem $${selectedDenomination}`
                    : `Confirm $${selectedDenomination} Redemption`}
                </span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2FA OTP Security Challenge Modal */}
      {otpChallenge && (
        <OtpVerificationModal
          isOpen={isOtpModalOpen}
          onClose={() => setIsOtpModalOpen(false)}
          onSuccess={(token, challengeId) => {
            executeRedemptionOrder(token, challengeId);
          }}
          challengeId={otpChallenge.challengeId}
          maskedEmail={otpChallenge.maskedEmail}
          transactionSummary={`$${selectedDenomination.toFixed(2)} ${brand.name} Gift Voucher`}
          previewCode={otpChallenge.previewCode}
          onResendOtp={async () => {
            const fresh = await requestRedemptionOtp({
              userId: currentUser.id,
              faceValue: selectedDenomination,
              brandName: brand.name,
            });
            setOtpChallenge(fresh);
          }}
        />
      )}
    </div>
  );
}
