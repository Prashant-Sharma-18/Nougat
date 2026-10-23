"use client";

import { useState } from "react";
import { useUser } from "./UserContext";
import { POINT_PACKS, PointPack } from "@/lib/payments/stripe";
import {
  initiatePointPackPurchase,
  confirmPointPackPayment,
} from "@/actions/payments";
import {
  X,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  Building2,
  UserCheck,
} from "lucide-react";

interface BuyPointsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newBalance: number) => void;
}

export function BuyPointsModal({ isOpen, onClose, onSuccess }: BuyPointsModalProps) {
  const { currentUser, isEnterprise, refreshUserData, updateUserBalance } = useUser();
  const [selectedPackId, setSelectedPackId] = useState<string>(
    isEnterprise ? "pack_enterprise_pool" : "pack_value"
  );
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
  const [expiry, setExpiry] = useState("12/28");
  const [cvc, setCvc] = useState("888");
  const [cardHolder, setCardHolder] = useState(
    currentUser?.name || (isEnterprise ? "Acme Corp Treasury" : "Cardholder Name")
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successDetails, setSuccessDetails] = useState<{
    pack: PointPack;
    newBalance: number;
    transactionId: string;
  } | null>(null);

  if (!isOpen) return null;

  const currentPack =
    POINT_PACKS.find((p) => p.id === selectedPackId) || POINT_PACKS[1];

  const handlePurchase = async () => {
    if (!currentUser) {
      setError("Please sign in or select an active persona first.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Step 1: Initiate payment intent via server action
      const initRes = await initiatePointPackPurchase({
        userId: currentUser.id,
        packId: currentPack.id,
      });

      if (!initRes.success) {
        throw new Error("Unable to establish payment intent.");
      }

      // Step 2: Confirm payment (handles live Stripe or simulator)
      const confirmRes = await confirmPointPackPayment({
        userId: currentUser.id,
        paymentIntentId: initRes.paymentIntentId,
        packId: currentPack.id,
      });

      if (!confirmRes.success) {
        throw new Error("Payment verification failed.");
      }

      updateUserBalance(confirmRes.newBalance);
      await refreshUserData();

      setSuccessDetails({
        pack: currentPack,
        newBalance: confirmRes.newBalance,
        transactionId: initRes.paymentIntentId,
      });

      if (onSuccess) {
        onSuccess(confirmRes.newBalance);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during payment processing.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetAndClose = () => {
    setSuccessDetails(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded border border-zinc-700 bg-zinc-800 flex items-center justify-center text-zinc-100">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-zinc-100 tracking-tight">
                  {isEnterprise ? "Acquire Corporate Point Allocation" : "Top Up Loyalty Points"}
                </h2>
                <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded border border-zinc-700 bg-zinc-800 text-zinc-300">
                  {isEnterprise ? "Enterprise B2B" : "Direct Card Payment"}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                100 points = $1.00 face value across all brand redemptions
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {successDetails ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full border border-zinc-700 bg-zinc-900 mx-auto flex items-center justify-center text-zinc-100">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-zinc-100">
                  Payment Succeeded
                </h3>
                <p className="text-sm text-zinc-400">
                  Successfully credited{" "}
                  <span className="font-mono font-medium text-zinc-100">
                    +{successDetails.pack.totalPoints.toLocaleString()} points
                  </span>{" "}
                  to your account ledger.
                </p>
              </div>

              <div className="p-4 rounded border border-zinc-800 bg-zinc-900 text-left space-y-2 text-xs font-mono">
                <div className="flex justify-between text-zinc-400">
                  <span>Package:</span>
                  <span className="text-zinc-200">{successDetails.pack.name}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Amount Charged:</span>
                  <span className="text-zinc-200">{successDetails.pack.priceFormatted} USD</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Payment Intent Reference:</span>
                  <span className="text-zinc-200 truncate max-w-[240px]">{successDetails.transactionId}</span>
                </div>
                <div className="flex justify-between text-zinc-400 pt-2 border-t border-zinc-800 font-medium">
                  <span>New Balance:</span>
                  <span className="text-zinc-100 text-sm">{successDetails.newBalance.toLocaleString()} pts</span>
                </div>
              </div>

              <button
                onClick={handleResetAndClose}
                className="w-full py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded text-sm font-medium transition-colors"
              >
                Close and View Updated Wallet
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className="p-3 rounded border border-zinc-700 bg-zinc-900 text-xs text-zinc-300">
                  {error}
                </div>
              )}

              {/* Point Pack Options */}
              <div className="space-y-3">
                <label className="text-xs font-medium text-zinc-300 uppercase tracking-wider block">
                  Select Allocation Bundle
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {POINT_PACKS.map((pack) => {
                    const isSelected = selectedPackId === pack.id;
                    const isEnterpriseRecommended = isEnterprise && pack.targetAudience === "ENTERPRISE";

                    return (
                      <button
                        key={pack.id}
                        type="button"
                        onClick={() => setSelectedPackId(pack.id)}
                        className={`p-4 rounded-lg border text-left transition-all relative ${
                          isSelected
                            ? "border-zinc-100 bg-zinc-900 shadow-sm"
                            : "border-zinc-800 hover:border-zinc-700 bg-zinc-950"
                        }`}
                      >
                        {pack.badge && (
                          <span className="absolute top-3 right-3 text-[10px] font-mono uppercase px-2 py-0.5 rounded border border-zinc-700 bg-zinc-800 text-zinc-200">
                            {pack.badge}
                          </span>
                        )}

                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            {pack.targetAudience === "ENTERPRISE" ? (
                              <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                            ) : (
                              <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
                            )}
                            <h4 className="text-sm font-semibold text-zinc-100">
                              {pack.name}
                            </h4>
                          </div>

                          <div className="flex items-baseline gap-2 pt-1">
                            <span className="text-xl font-bold font-mono text-zinc-100">
                              {pack.totalPoints.toLocaleString()}
                            </span>
                            <span className="text-xs text-zinc-400">pts</span>
                            {pack.bonusPoints > 0 && (
                              <span className="text-xs font-mono text-zinc-400">
                                (+{pack.bonusPoints.toLocaleString()} bonus)
                              </span>
                            )}
                          </div>

                          <div className="flex justify-between items-center pt-2 border-t border-zinc-800/80 text-xs">
                            <span className="font-mono text-zinc-100 font-medium">
                              {pack.priceFormatted}
                            </span>
                            <span className="font-mono text-[11px] text-zinc-400">
                              {pack.effectiveRate}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Payment Details Form */}
              <div className="space-y-4 pt-2 border-t border-zinc-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-zinc-300 uppercase tracking-wider block">
                    Payment Method
                  </label>
                  <span className="text-[11px] text-zinc-400 flex items-center gap-1 font-mono">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    256-Bit Encrypted
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">Cardholder Name</label>
                    <input
                      type="text"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-sm text-zinc-100 focus:outline-none focus:border-zinc-600"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">Card Number</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full px-3 py-2 pl-9 bg-zinc-900 border border-zinc-800 rounded text-sm font-mono text-zinc-100 focus:outline-none focus:border-zinc-600"
                      />
                      <CreditCard className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-zinc-400 block mb-1">Expiration</label>
                      <input
                        type="text"
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                        placeholder="MM/YY"
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-sm font-mono text-zinc-100 focus:outline-none focus:border-zinc-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400 block mb-1">Security Code (CVC)</label>
                      <input
                        type="password"
                        value={cvc}
                        onChange={(e) => setCvc(e.target.value)}
                        maxLength={4}
                        placeholder="CVC"
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-sm font-mono text-zinc-100 focus:outline-none focus:border-zinc-600"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Summary & Submit */}
              <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/60 space-y-2 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Selected Package:</span>
                  <span className="text-zinc-200">{currentPack.name}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Points to Credit:</span>
                  <span className="font-mono text-zinc-200">
                    +{currentPack.totalPoints.toLocaleString()} pts
                  </span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Processing Fee:</span>
                  <span className="font-mono text-zinc-400">$0.00</span>
                </div>
                <div className="flex justify-between text-zinc-100 font-semibold pt-2 border-t border-zinc-800 text-sm">
                  <span>Total Amount Due:</span>
                  <span className="font-mono">{currentPack.priceFormatted} USD</span>
                </div>
              </div>

              <button
                type="button"
                disabled={isProcessing}
                onClick={handlePurchase}
                className="w-full py-3 px-4 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-900 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <span>Processing Payment via Secure Rails...</span>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Authorize Payment of {currentPack.priceFormatted}</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
