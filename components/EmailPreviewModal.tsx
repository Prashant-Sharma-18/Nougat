"use client";

import { useState, useEffect } from "react";
import { resendVoucherEmail, previewVoucherEmail } from "@/actions/email";
import {
  X,
  Mail,
  Send,
  CheckCircle2,
  Smartphone,
  Monitor,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

interface EmailPreviewModalProps {
  orderId: string | null;
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
  brandName?: string;
}

export function EmailPreviewModal({
  orderId,
  isOpen,
  onClose,
  defaultEmail = "",
  brandName = "Voucher",
}: EmailPreviewModalProps) {
  const [recipientEmail, setRecipientEmail] = useState(defaultEmail);
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (defaultEmail) {
      setRecipientEmail(defaultEmail);
    }
  }, [defaultEmail]);

  useEffect(() => {
    if (!orderId || !isOpen) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);
    setStatusMessage(null);

    previewVoucherEmail({ orderId })
      .then((res) => {
        if (isMounted && res.success) {
          setHtmlContent(res.html);
          if (!recipientEmail && res.recipientEmail) {
            setRecipientEmail(res.recipientEmail);
          }
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message || "Failed to load email preview.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [orderId, isOpen]);

  if (!isOpen || !orderId) return null;

  const handleResend = async () => {
    if (!recipientEmail || !recipientEmail.includes("@")) {
      setError("Please provide a valid recipient email address.");
      return;
    }

    setIsSending(true);
    setError(null);
    setStatusMessage(null);

    try {
      const res = await resendVoucherEmail({
        orderId,
        recipientEmail,
      });

      if (res.success) {
        setStatusMessage(
          `Voucher email successfully dispatched to ${res.recipientEmail} (${res.isSimulated ? "Simulated Delivery" : "Live via Resend API"}).`
        );
        setHtmlContent(res.html);
      }
    } catch (err: any) {
      setError(err.message || "Unable to dispatch voucher email.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl flex flex-col h-[88vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded border border-zinc-700 bg-zinc-800 flex items-center justify-center text-zinc-100">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-zinc-100">
                  Transactional Email Delivery
                </h3>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded border border-zinc-700 bg-zinc-800 text-zinc-300">
                  {brandName}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Responsive HTML template rendered with cryptographic voucher payload
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Viewport Switcher */}
            <div className="hidden sm:flex items-center border border-zinc-800 rounded-lg p-0.5 bg-zinc-900 font-mono text-xs">
              <button
                type="button"
                onClick={() => setViewMode("desktop")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors ${
                  viewMode === "desktop"
                    ? "bg-zinc-800 text-zinc-100 font-medium"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Desktop</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("mobile")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors ${
                  viewMode === "mobile"
                    ? "bg-zinc-800 text-zinc-100 font-medium"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Resend Action Strip */}
        <div className="p-3 border-b border-zinc-800 bg-zinc-900/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex-1 flex items-center gap-2">
            <span className="text-xs text-zinc-400 shrink-0 font-mono">Recipient:</span>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="recipient@example.com"
              className="w-full max-w-sm px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs font-mono text-zinc-100 focus:outline-none focus:border-zinc-600"
            />
            <button
              type="button"
              disabled={isSending || !recipientEmail}
              onClick={handleResend}
              className="px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-950 rounded text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0"
            >
              {isSending ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Dispatching...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Email</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />
            <span>DKIM & SPF Ready</span>
          </div>
        </div>

        {/* Feedback alerts */}
        {statusMessage && (
          <div className="mx-4 mt-3 p-2.5 rounded border border-zinc-700 bg-zinc-900 text-xs text-zinc-200 flex items-center gap-2 font-mono">
            <CheckCircle2 className="w-4 h-4 text-zinc-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {error && (
          <div className="mx-4 mt-3 p-2.5 rounded border border-zinc-700 bg-zinc-900 text-xs text-zinc-300 font-mono">
            {error}
          </div>
        )}

        {/* Preview Frame */}
        <div className="flex-1 bg-zinc-900/50 p-4 overflow-y-auto flex items-center justify-center">
          {isLoading ? (
            <div className="text-center space-y-2 font-mono text-xs text-zinc-500">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-zinc-400" />
              <p>Rendering secure template...</p>
            </div>
          ) : (
            <div
              className={`bg-white rounded-lg shadow-lg border border-zinc-300 overflow-hidden transition-all duration-200 h-full w-full ${
                viewMode === "mobile" ? "max-w-[390px]" : "max-w-2xl"
              }`}
            >
              <iframe
                title="Email Preview"
                srcDoc={htmlContent}
                className="w-full h-full border-none"
                sandbox="allow-same-origin allow-popups"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

