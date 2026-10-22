"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  CheckCircle2, 
  ExternalLink, 
  Copy, 
  Check, 
  Wallet, 
  X, 
  Mail,
  ShieldCheck,
  Zap
} from "lucide-react";

interface ClaimSuccessModalProps {
  orderData: {
    orderId: string;
    claimUrl?: string | null;
    cardCode?: string | null;
    cardPin?: string | null;
    faceValue: number;
    brandName: string;
    remainingBalance: number;
    providerUsed?: string;
    failoverTriggered?: boolean;
    emailPreviewHtml?: string;
    tierApplied?: string;
    pointsSpent?: number;
    cashSpent?: number;
    paymentMethod?: string | null;
  };
  onClose: () => void;
}

export default function ClaimSuccessModal({ orderData, onClose }: ClaimSuccessModalProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  const copyToClipboard = (text: string, type: "code" | "pin") => {
    navigator.clipboard.writeText(text);
    if (type === "code") {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedPin(true);
      setTimeout(() => setCopiedPin(false), 2000);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
        <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-zinc-200 overflow-hidden">
          {/* Header */}
          <div className="bg-zinc-950 text-white p-6 text-center relative border-b border-zinc-800">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 mb-3">
              <CheckCircle2 className="h-6 w-6 text-zinc-100" />
            </div>

            <h3 className="text-lg font-bold tracking-tight">Redemption Successful</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1 font-mono">
              ${orderData.faceValue} {orderData.brandName} voucher issued and added to your wallet.
            </p>

            {/* Provider and Failover badges */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3">
              {orderData.providerUsed && (
                <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px] font-mono uppercase">
                  Provider: {orderData.providerUsed}
                </span>
              )}
              {orderData.cashSpent && orderData.cashSpent > 0 ? (
                <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-200 text-[10px] font-mono uppercase">
                  Split-Tender: {orderData.pointsSpent} pts + ${orderData.cashSpent.toFixed(2)} Card
                </span>
              ) : null}
              {orderData.failoverTriggered && (
                <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-200 text-[10px] font-mono uppercase flex items-center gap-1">
                  <Zap className="h-3 w-3" /> Auto-Failover
                </span>
              )}
            </div>
          </div>

          {/* Digital Gift Card representation */}
          <div className="p-6 space-y-4">
            <div className="rounded-xl bg-zinc-900 p-5 text-white border border-zinc-800">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                    Digital Reward
                  </span>
                  <h4 className="text-base font-bold tracking-tight text-white mt-0.5">
                    {orderData.brandName}
                  </h4>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold font-mono text-white">
                    ${orderData.faceValue}
                  </span>
                  <span className="text-[10px] text-zinc-400 block uppercase font-mono">USD</span>
                </div>
              </div>

              {/* Voucher Codes */}
              <div className="mt-4 pt-3.5 border-t border-zinc-800 space-y-2">
                {orderData.cardCode && (
                  <div className="bg-zinc-950 rounded-lg p-2.5 flex items-center justify-between border border-zinc-800">
                    <div>
                      <span className="text-[10px] uppercase font-mono text-zinc-500 block">
                        Voucher Code
                      </span>
                      <span className="font-mono text-xs font-semibold tracking-wider text-zinc-200">
                        {orderData.cardCode}
                      </span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(orderData.cardCode!, "code")}
                      className="p-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition-colors"
                      title="Copy Code"
                    >
                      {copiedCode ? <Check className="h-3.5 w-3.5 text-zinc-100" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                )}

                {orderData.cardPin && (
                  <div className="bg-zinc-950 rounded-lg p-2.5 flex items-center justify-between border border-zinc-800">
                    <div>
                      <span className="text-[10px] uppercase font-mono text-zinc-500 block">
                        PIN
                      </span>
                      <span className="font-mono text-xs font-semibold tracking-widest text-zinc-200">
                        {orderData.cardPin}
                      </span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(orderData.cardPin!, "pin")}
                      className="p-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition-colors"
                      title="Copy PIN"
                    >
                      {copiedPin ? <Check className="h-3.5 w-3.5 text-zinc-100" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-2">
              {orderData.claimUrl && (
                <a
                  href={orderData.claimUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white font-medium text-xs transition-colors flex items-center justify-center gap-2"
                >
                  <span>Open Official Claim Link</span>
                  <ExternalLink className="h-3.5 w-3.5 text-zinc-400" />
                </a>
              )}

              <div className="grid grid-cols-2 gap-2">
                {orderData.emailPreviewHtml && (
                  <button
                    onClick={() => setShowEmailPreview(true)}
                    className="py-2 px-3 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-medium text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Mail className="h-3.5 w-3.5 text-zinc-500" />
                    <span>View Email Receipt</span>
                  </button>
                )}

                <Link
                  href="/wallet"
                  onClick={onClose}
                  className="py-2 px-3 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-medium text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Wallet className="h-3.5 w-3.5 text-zinc-500" />
                  <span>Go to Wallet</span>
                </Link>
              </div>
            </div>

            {/* Ledger note */}
            <div className="flex items-center gap-2 text-[10px] text-zinc-500 bg-zinc-50 p-2.5 rounded-lg border border-zinc-200 font-mono">
              <ShieldCheck className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
              <span>
                Protected by AES-256 Vault • Order #{orderData.orderId.slice(0, 8)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* In-App Email Receipt Preview Modal */}
      {showEmailPreview && orderData.emailPreviewHtml && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh] border border-zinc-200">
            <div className="px-5 py-3.5 bg-zinc-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono">
                <Mail className="h-4 w-4 text-zinc-400" />
                <h4 className="text-xs font-semibold">HTML Email Receipt Preview</h4>
              </div>
              <button
                onClick={() => setShowEmailPreview(false)}
                className="p-1 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-auto bg-zinc-100">
              <iframe
                srcDoc={orderData.emailPreviewHtml}
                title="Email Preview"
                className="w-full h-[500px] border border-zinc-200 rounded-lg bg-white"
              />
            </div>
            <div className="px-5 py-3 bg-white border-t border-zinc-200 flex justify-end">
              <button
                onClick={() => setShowEmailPreview(false)}
                className="px-3.5 py-1.5 rounded-lg bg-zinc-950 text-white text-xs font-medium hover:bg-zinc-800 transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
