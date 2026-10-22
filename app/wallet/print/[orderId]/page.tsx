"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getOrderById } from "@/actions/orders";
import { Printer, ArrowLeft, ShieldCheck, Gift, CheckCircle, ExternalLink } from "lucide-react";

export default function PrintVoucherPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!orderId) return;
      try {
        setLoading(true);
        const data = await getOrderById(orderId);
        setOrder(data);
      } catch (err) {
        console.error("Failed to load order for printing:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [orderId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-zinc-500 font-mono">
        Generating printable voucher...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-12 text-center space-y-3">
        <h3 className="font-semibold text-zinc-800">Order not found</h3>
        <button
          onClick={() => router.push("/wallet")}
          className="px-4 py-2 bg-zinc-950 text-white rounded-lg text-xs font-medium"
        >
          Return to Wallet
        </button>
      </div>
    );
  }

  const formattedDate = new Date(order.createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      {/* Non-printed action controls */}
      <div className="flex items-center justify-between print:hidden">
        <button
          onClick={() => router.push("/wallet")}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-950 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Wallet
        </button>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-medium transition-colors"
        >
          <Printer className="h-4 w-4" />
          Print / Save as PDF
        </button>
      </div>

      {/* The Printable Certificate Container */}
      <div className="bg-white rounded-2xl border border-zinc-300 shadow-sm overflow-hidden print:border-none print:shadow-none print:p-0">
        {/* Certificate Header Banner */}
        <div className="bg-zinc-950 text-white p-8 text-center relative border-b border-zinc-850">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-mono mb-3">
            <Gift className="h-3.5 w-3.5 text-zinc-400" />
            <span>Digital Gift Certificate</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">{order.brandName}</h1>
          <div className="mt-2 text-3xl font-bold font-mono text-zinc-100">
            ${order.faceValue} <span className="text-base font-normal text-zinc-400">{order.currency}</span>
          </div>

          <p className="text-xs text-zinc-400 mt-2 font-mono">
            {order.recipientName ? (
              <>
                Gifted to: <strong className="text-zinc-200">{order.recipientName}</strong> • From: {order.user?.name || "A Friend"}
              </>
            ) : (
              <>Issued to: {order.user?.name || "Loyalty Member"}</>
            )}
          </p>

          {order.giftMessage && (
            <div className="mt-3 py-2 px-4 bg-zinc-900 rounded-lg inline-block max-w-md text-zinc-300 text-xs italic border border-zinc-800">
              "{order.giftMessage}"
            </div>
          )}
        </div>

        {/* Certificate Body */}
        <div className="p-8 space-y-6">
          {/* Card Number & PIN Box */}
          <div className="p-6 bg-zinc-50 rounded-xl border border-zinc-200 text-center space-y-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 block mb-1">
                Card Number / Voucher Code
              </span>
              <span className="font-mono text-xl sm:text-2xl font-bold tracking-widest text-zinc-950 bg-white px-4 py-2 rounded-lg border border-zinc-300 inline-block">
                {order.cardCodeEncrypted || "Delivered via Claim Link"}
              </span>
            </div>

            {order.cardPinEncrypted && (
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 block mb-1">
                  Security PIN
                </span>
                <span className="font-mono text-base font-semibold tracking-widest text-zinc-800 bg-white px-3 py-1 rounded border border-zinc-300 inline-block">
                  {order.cardPinEncrypted}
                </span>
              </div>
            )}

            {/* Visual Simulated Barcode */}
            <div className="pt-2 flex flex-col items-center justify-center">
              <div className="h-12 w-64 bg-zinc-950 rounded flex items-center justify-around px-2 py-1">
                <div className="w-1 h-10 bg-white" />
                <div className="w-2 h-10 bg-white" />
                <div className="w-0.5 h-10 bg-white" />
                <div className="w-1.5 h-10 bg-white" />
                <div className="w-1 h-10 bg-white" />
                <div className="w-3 h-10 bg-white" />
                <div className="w-0.5 h-10 bg-white" />
                <div className="w-2 h-10 bg-white" />
                <div className="w-1 h-10 bg-white" />
                <div className="w-2.5 h-10 bg-white" />
                <div className="w-1 h-10 bg-white" />
                <div className="w-0.5 h-10 bg-white" />
                <div className="w-2 h-10 bg-white" />
                <div className="w-1 h-10 bg-white" />
              </div>
              <span className="text-[9px] font-mono text-zinc-400 mt-1">SCAN AT REGISTER OR ENTER ONLINE</span>
            </div>
          </div>

          {/* How to Redeem Instructions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-zinc-200 space-y-1 bg-white">
              <strong className="font-semibold text-zinc-950 block flex items-center gap-1.5 font-mono">
                <CheckCircle className="h-4 w-4 text-zinc-700" />
                Online Checkout
              </strong>
              <p className="text-zinc-600 leading-relaxed text-[11px]">
                Enter the voucher code and PIN in the Gift Card section during checkout on the merchant website.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-zinc-200 space-y-1 bg-white">
              <strong className="font-semibold text-zinc-950 block flex items-center gap-1.5 font-mono">
                <ShieldCheck className="h-4 w-4 text-zinc-700" />
                In-Store Checkout
              </strong>
              <p className="text-zinc-600 leading-relaxed text-[11px]">
                Present this printed certificate or barcode to the cashier at physical retail locations.
              </p>
            </div>
          </div>

          {order.claimUrl && (
            <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 text-xs text-zinc-700 flex items-center justify-between font-mono">
              <span>Direct provider link is also available online.</span>
              <a
                href={order.claimUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-zinc-950 underline inline-flex items-center gap-1"
              >
                Open Link <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          {/* Footer Metadata */}
          <div className="border-t border-zinc-200 pt-4 flex flex-col sm:flex-row justify-between text-[10px] text-zinc-400 font-mono gap-2">
            <span>Certificate Ref: {order.id.slice(0, 12)}</span>
            <span>Issued: {formattedDate}</span>
            <span>Platform: Nougat Enterprise Rewards</span>
          </div>
        </div>
      </div>
    </div>
  );
}
