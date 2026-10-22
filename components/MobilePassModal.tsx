"use client";

import React, { useState } from "react";
import { 
  X, 
  Wifi, 
  RotateCw, 
  Check, 
  ShieldCheck, 
  Smartphone,
  Wallet,
  CheckCircle2
} from "lucide-react";

interface MobilePassModalProps {
  card: {
    id: string;
    brandName: string;
    faceValue: number;
    remainingCardBalance?: number | null;
    cardCodeEncrypted?: string | null;
    cardPinEncrypted?: string | null;
    recipientName?: string | null;
    recipientEmail?: string | null;
    claimUrl?: string | null;
    providerOrderId?: string | null;
    createdAt: string;
  };
  userName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function MobilePassModal({
  card,
  userName = "Loyalty Member",
  isOpen,
  onClose,
}: MobilePassModalProps) {
  const [walletType, setWalletType] = useState<"APPLE" | "GOOGLE">("APPLE");
  const [isFlipped, setIsFlipped] = useState(false);
  const [nfcTapped, setNfcTapped] = useState(false);
  const [addedToWallet, setAddedToWallet] = useState(false);

  if (!isOpen) return null;

  const currentBalance = card.remainingCardBalance !== null && card.remainingCardBalance !== undefined
    ? card.remainingCardBalance
    : card.faceValue;

  const cardholderName = card.recipientName || userName;

  const handleSimulateNfc = () => {
    setNfcTapped(true);
    setTimeout(() => setNfcTapped(false), 2500);
  };

  const handleAddToWallet = () => {
    setAddedToWallet(true);
    setTimeout(() => setAddedToWallet(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] border border-zinc-800 bg-zinc-950">
        {/* Wallet Type Switcher Bar */}
        <div className="bg-zinc-900 px-4 py-3 flex items-center justify-between border-b border-zinc-800">
          <div className="flex items-center gap-1 p-1 bg-zinc-950 rounded-lg border border-zinc-800">
            <button
              onClick={() => setWalletType("APPLE")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                walletType === "APPLE"
                  ? "bg-zinc-100 text-zinc-950 font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Smartphone className="h-3 w-3" />
              Apple Wallet
            </button>
            <button
              onClick={() => setWalletType("GOOGLE")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                walletType === "GOOGLE"
                  ? "bg-zinc-100 text-zinc-950 font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Wallet className="h-3 w-3" />
              Google Pay
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Card Pass Container with Flip Effect */}
        <div className="bg-zinc-950 p-6 flex-1 overflow-y-auto flex flex-col items-center justify-center">
          <div 
            className="w-full relative [perspective:1000px] cursor-pointer group"
            onClick={() => setIsFlipped(!isFlipped)}
            title="Click card to flip"
          >
            <div 
              className={`w-full rounded-2xl text-white shadow-xl border border-zinc-800 transition-transform duration-500 [transform-style:preserve-3d] ${
                isFlipped ? "[transform:rotateY(180deg)]" : ""
              }`}
            >
              {/* FRONT OF THE PASS */}
              <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 relative [backface-visibility:hidden]">
                {/* Top header: Brand & NFC Contactless */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 block">
                      {walletType === "APPLE" ? "Apple Wallet Pass" : "Google Wallet Pass"}
                    </span>
                    <h3 className="text-lg font-semibold tracking-tight text-white mt-0.5">
                      {card.brandName}
                    </h3>
                  </div>

                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10px] font-medium">
                      <Wifi className="h-3 w-3 rotate-90 text-zinc-300" />
                      <span>NFC</span>
                    </div>
                    <span className="text-[9px] text-zinc-500 mt-1 uppercase font-mono">Ready to Tap</span>
                  </div>
                </div>

                {/* Balance display */}
                <div className="my-5 p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 block">
                      Available Balance
                    </span>
                    <span className="text-2xl font-bold font-mono text-white tracking-tight">
                      ${Number(currentBalance).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-zinc-500 block font-mono">Face Value: ${card.faceValue}.00</span>
                  </div>

                  <div className="text-right">
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-mono uppercase font-semibold bg-zinc-800 border border-zinc-700 text-zinc-200">
                      ACTIVE
                    </span>
                  </div>
                </div>

                {/* Cardholder details */}
                <div className="grid grid-cols-2 gap-3 mb-5 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-zinc-400 block">
                      Cardholder
                    </span>
                    <span className="font-medium text-zinc-200 truncate block">
                      {cardholderName}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-mono text-zinc-400 block">
                      PIN
                    </span>
                    <span className="font-mono font-bold text-zinc-200">
                      {card.cardPinEncrypted || "NONE"}
                    </span>
                  </div>
                </div>

                {/* Scannable Barcode / Aztec QR Mockup */}
                <div className="pt-4 border-t border-zinc-800 text-center space-y-2">
                  <div className="bg-white p-3 rounded-xl inline-block">
                    <div className="w-40 h-24 mx-auto flex flex-col justify-center items-center">
                      <div className="flex gap-1 mb-1.5">
                        <div className="w-7 h-7 border-4 border-zinc-950 rounded p-0.5 flex items-center justify-center">
                          <div className="w-2.5 h-2.5 bg-zinc-950 rounded-xs"></div>
                        </div>
                        <div className="w-20 h-7 flex flex-col justify-between py-0.5">
                          <div className="h-1 bg-zinc-950 w-full rounded"></div>
                          <div className="h-1 bg-zinc-950 w-3/4 rounded"></div>
                          <div className="h-1 bg-zinc-950 w-5/6 rounded"></div>
                        </div>
                        <div className="w-7 h-7 border-4 border-zinc-950 rounded p-0.5 flex items-center justify-center">
                          <div className="w-2.5 h-2.5 bg-zinc-950 rounded-xs"></div>
                        </div>
                      </div>

                      {/* Barcode lines */}
                      <div className="flex items-center gap-[2px] h-9 w-36 px-1">
                        {[4, 2, 6, 1, 3, 5, 2, 4, 1, 7, 3, 2, 5, 1, 4, 6, 2, 3, 5, 1, 4, 2, 7, 3, 1, 5, 2].map((w, i) => (
                          <div key={i} className="h-full bg-zinc-950" style={{ width: `${w * 1.3}px` }} />
                        ))}
                      </div>
                    </div>
                    <span className="font-mono text-[10px] font-bold text-zinc-950 tracking-wider block mt-1">
                      {card.cardCodeEncrypted || "CARD-PASS-ACTIVE"}
                    </span>
                  </div>

                  <p className="text-[10px] text-zinc-400 flex items-center justify-center gap-1 font-mono">
                    <RotateCw className="h-3 w-3" /> Tap pass to flip details
                  </p>
                </div>
              </div>

              {/* BACK OF THE PASS */}
              <div className="p-6 rounded-2xl bg-zinc-900 text-zinc-300 absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] flex flex-col justify-between border border-zinc-800 overflow-y-auto">
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                    <h4 className="font-semibold text-white text-sm">Pass Terms & Details</h4>
                    <span className="text-[10px] text-zinc-400 font-mono">ID: {card.id.slice(0, 8)}</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-zinc-400 block">Merchant Instructions</span>
                      <p className="text-zinc-300 leading-relaxed text-[11px] mt-0.5">
                        Present this pass at physical retail POS checkout or enter voucher code online during checkout.
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono uppercase text-zinc-400 block">Provider Verification</span>
                      <p className="font-mono text-[11px] text-zinc-200 mt-0.5">
                        {card.providerOrderId || "PROV-ACTIVE-FULFILLED"}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono uppercase text-zinc-400 block">Security</span>
                      <p className="text-[11px] text-zinc-300 mt-0.5 flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5 text-zinc-400" />
                        AES-256 hardware encrypted pass
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono uppercase text-zinc-400 block">Support</span>
                      <p className="text-[11px] text-zinc-400 mt-0.5 font-mono">
                        support@nougatrewards.io
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-800 text-center">
                  <span className="text-[10px] text-zinc-400 flex items-center justify-center gap-1 font-mono">
                    <RotateCw className="h-3 w-3" /> Tap to flip back
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-zinc-900 border-t border-zinc-800 p-4 space-y-2.5">
          {nfcTapped && (
            <div className="p-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 text-xs text-center font-medium flex items-center justify-center gap-2">
              <Check className="h-3.5 w-3.5 text-zinc-200" />
              NFC Contactless Reader Authenticated.
            </div>
          )}

          {addedToWallet && (
            <div className="p-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 text-xs text-center font-medium flex items-center justify-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-zinc-200" />
              Pass successfully saved to your mobile wallet.
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleAddToWallet}
              className="py-2 px-3 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              {walletType === "APPLE" ? (
                <>
                  <Smartphone className="h-3.5 w-3.5" />
                  <span>Add to Apple Wallet</span>
                </>
              ) : (
                <>
                  <Wallet className="h-3.5 w-3.5" />
                  <span>Save to Google Pay</span>
                </>
              )}
            </button>

            <button
              onClick={handleSimulateNfc}
              className="py-2 px-3 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-medium text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Wifi className="h-3.5 w-3.5 rotate-90 text-zinc-400" />
              <span>Simulate NFC Tap</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
