"use client";

import React, { useState, useEffect } from "react";
import { lookupVoucher, processPosCharge, getRecentActiveCardsForScanner } from "@/actions/scanner";
import { 
  CreditCard, 
  Search, 
  AlertCircle, 
  Loader2, 
  Receipt, 
  DollarSign, 
  ShieldCheck 
} from "lucide-react";

export default function PosScannerPage() {
  const [cardNumber, setCardNumber] = useState("");
  const [cardPin, setCardPin] = useState("");
  const [loadingLookup, setLoadingLookup] = useState(false);
  const [activeCard, setActiveCard] = useState<any | null>(null);
  const [chargeAmount, setChargeAmount] = useState<string>("10.00");
  const [charging, setCharging] = useState(false);
  const [receipt, setReceipt] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [recentCards, setRecentCards] = useState<any[]>([]);

  useEffect(() => {
    async function loadRecents() {
      try {
        const cards = await getRecentActiveCardsForScanner();
        setRecentCards(cards);
      } catch (e) {
        // ignore
      }
    }
    loadRecents();
  }, []);

  const handleLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!cardNumber) return;

    try {
      setLoadingLookup(true);
      setErrorMsg(null);
      setReceipt(null);
      const card = await lookupVoucher(cardNumber, cardPin);
      setActiveCard(card);
    } catch (err: any) {
      setErrorMsg(err.message || "Card lookup failed.");
      setActiveCard(null);
    } finally {
      setLoadingLookup(false);
    }
  };

  const handleProcessCharge = async () => {
    if (!activeCard || !chargeAmount) return;

    try {
      setCharging(true);
      setErrorMsg(null);
      const chargeNum = parseFloat(chargeAmount);
      const result = await processPosCharge(activeCard.orderId, chargeNum);

      setReceipt(result);
      setActiveCard({
        ...activeCard,
        remainingBalance: result.newBalance,
        status: result.newBalance > 0 ? "ACTIVE" : "DEPLETED",
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Authorization failed.");
    } finally {
      setCharging(false);
    }
  };

  const handleSelectRecent = (card: any) => {
    if (card.cardCode) {
      setCardNumber(card.cardCode);
      setCardPin(card.cardPin || "");
      setErrorMsg(null);
      setReceipt(null);
      lookupVoucher(card.cardCode, card.cardPin).then(setActiveCard).catch(() => {});
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-950 tracking-tight flex items-center gap-2.5">
          <CreditCard className="h-6 w-6 text-zinc-800" />
          Point-of-Sale (POS) Simulator
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
          Simulate a retail cashier or online checkout terminal verifying balance and processing vouchers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Terminal Card Scanner */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-xs space-y-5">
            <h2 className="text-sm font-semibold text-zinc-950 flex items-center gap-2">
              <Search className="h-4 w-4 text-zinc-700" />
              Scan or Enter Gift Card
            </h2>

            {/* Input Form */}
            <form onSubmit={handleLookup} className="space-y-3 font-mono">
              <div>
                <label className="block text-[10px] uppercase text-zinc-500 mb-1">
                  Card Number / Voucher Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. 6738-2581-9206-6651"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs tracking-wider focus:border-zinc-400 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 items-end">
                <div>
                  <label className="block text-[10px] uppercase text-zinc-500 mb-1">
                    Security PIN (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 7230"
                    value={cardPin}
                    onChange={(e) => setCardPin(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs tracking-widest focus:border-zinc-400 focus:bg-white focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loadingLookup || !cardNumber}
                  className="py-2 px-4 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loadingLookup ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Verify Balance"}
                </button>
              </div>
            </form>

            {/* Quick-fill picker from recent cards */}
            {recentCards.length > 0 && (
              <div className="pt-3 border-t border-zinc-100">
                <span className="text-[10px] uppercase font-mono text-zinc-400 block mb-2">
                  Recently Issued Cards
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {recentCards.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectRecent(c)}
                      className="p-2.5 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 hover:border-zinc-300 text-left transition-colors"
                    >
                      <span className="block font-medium text-xs text-zinc-900 truncate">{c.brandName}</span>
                      <span className="text-[10px] text-zinc-600 font-mono block">
                        ${c.remainingBalance} / ${c.faceValue}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 bg-zinc-50 border border-zinc-300 rounded-lg text-xs text-zinc-900 flex items-center gap-2 font-mono">
                <AlertCircle className="h-4 w-4 text-zinc-700 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Active Card Details & Authorization Panel */}
          {activeCard && (
            <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-xs space-y-5 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">
                    Verified Voucher
                  </span>
                  <h3 className="text-base font-bold text-zinc-950">{activeCard.brandName}</h3>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-zinc-100 text-zinc-800 border border-zinc-200">
                  {activeCard.status}
                </span>
              </div>

              {/* Balance Box */}
              <div className="grid grid-cols-2 gap-4 bg-zinc-50 p-4 rounded-xl border border-zinc-200 font-mono">
                <div>
                  <span className="text-[10px] uppercase text-zinc-500 block">Available Balance</span>
                  <span className="text-2xl font-bold text-zinc-950">
                    ${activeCard.remainingBalance.toFixed(2)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase text-zinc-500 block">Original Face Value</span>
                  <span className="text-lg font-medium text-zinc-700">
                    ${activeCard.faceValue.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Charge Section */}
              {activeCard.remainingBalance > 0 && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleProcessCharge();
                  }}
                  className="space-y-3 pt-1"
                >
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-zinc-900 font-mono">
                      Charge Amount ($ USD)
                    </label>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      Press Enter or click Authorize
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <DollarSign className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                      <input
                        type="number"
                        step="0.01"
                        max={activeCard.remainingBalance}
                        value={chargeAmount}
                        onChange={(e) => setChargeAmount(e.target.value)}
                        className="w-full pl-7 pr-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-mono font-bold focus:border-zinc-400 focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={charging || !chargeAmount || parseFloat(chargeAmount) <= 0}
                      className="px-4 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-medium shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {charging ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Authorize Payment"}
                    </button>
                  </div>

                  {/* Fast-Tender Preset Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-mono text-zinc-400 mr-1 uppercase">Presets:</span>
                    {[5, 10, 15, 20]
                      .filter((amt) => amt <= activeCard.remainingBalance)
                      .map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setChargeAmount(amt.toFixed(2))}
                          className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-colors ${
                            parseFloat(chargeAmount) === amt
                              ? "bg-zinc-950 text-white border-zinc-950 font-bold"
                              : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-200"
                          }`}
                        >
                          ${amt}.00
                        </button>
                      ))}
                    <button
                      type="button"
                      onClick={() => setChargeAmount(activeCard.remainingBalance.toFixed(2))}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-colors ${
                        parseFloat(chargeAmount) === activeCard.remainingBalance
                          ? "bg-zinc-950 text-white border-zinc-950 font-bold"
                          : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-200"
                      }`}
                    >
                      Full (${activeCard.remainingBalance.toFixed(2)})
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Printed Cashier Slip */}
        <div>
          {receipt ? (
            <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-xs space-y-4 font-mono text-xs text-zinc-800 animate-in fade-in">
              <div className="text-center border-b border-dashed border-zinc-300 pb-3">
                <Receipt className="h-5 w-5 mx-auto mb-1 text-zinc-400" />
                <h4 className="font-bold uppercase tracking-wider text-xs">MERCHANT RECEIPT</h4>
                <p className="text-[10px] text-zinc-500">TERMINAL #001 - APPROVED</p>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Brand:</span>
                  <span className="font-semibold">{receipt.brandName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Auth Code:</span>
                  <span className="font-semibold text-zinc-950">{receipt.approvalCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Amount Charged:</span>
                  <span className="font-bold">${receipt.chargedAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Remaining Balance:</span>
                  <span className="font-bold">${receipt.newBalance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Timestamp:</span>
                  <span className="text-[10px]">{new Date(receipt.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-zinc-300 pt-3 text-center text-[10px] text-zinc-400">
                <ShieldCheck className="h-3.5 w-3.5 mx-auto mb-1 text-zinc-600" />
                <span>Verified by Nougat Settlement Engine</span>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-50 rounded-xl border border-dashed border-zinc-300 p-8 text-center text-xs text-zinc-400 space-y-2">
              <Receipt className="h-7 w-7 mx-auto text-zinc-300" />
              <p className="font-medium text-zinc-600 font-mono">No Transaction Receipt Yet</p>
              <p className="text-[11px] font-mono">Authorize a charge to print cashier slip.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
