"use client";

import React, { useState, useRef, useEffect } from "react";
import { verifyOtpChallenge } from "@/actions/otp";
import {
  ShieldAlert,
  Lock,
  ArrowRight,
  RefreshCw,
  X,
  AlertTriangle,
  KeyRound,
  CheckCircle2,
} from "lucide-react";

interface OtpVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (token: string, challengeId: string) => void;
  challengeId: string;
  maskedEmail: string;
  transactionSummary: string;
  previewCode?: string; // For testing and sandbox demonstration
  onResendOtp?: () => Promise<void>;
}

export function OtpVerificationModal({
  isOpen,
  onClose,
  onSuccess,
  challengeId,
  maskedEmail,
  transactionSummary,
  previewCode,
  onResendOtp,
}: OtpVerificationModalProps) {
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [isResending, setIsResending] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown
  useEffect(() => {
    if (!isOpen) return;
    setTimeLeft(300);
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, challengeId]);

  // Focus first input on modal open
  useEffect(() => {
    if (isOpen) {
      setDigits(["", "", "", "", "", ""]);
      setError(null);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDigitChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, "");
    if (!clean) {
      const copy = [...digits];
      copy[index] = "";
      setDigits(copy);
      return;
    }

    const copy = [...digits];
    copy[index] = clean.slice(-1); // Take single digit
    setDigits(copy);

    // Auto-advance
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const copy = [...digits];
    for (let i = 0; i < 6; i++) {
      copy[i] = pasted[i] || "";
    }
    setDigits(copy);

    const nextIndex = Math.min(pasted.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const fullCode = digits.join("");
  const isComplete = fullCode.length === 6;

  const handleSubmit = async () => {
    if (!isComplete) {
      setError("Please enter the complete 6-digit security code.");
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const res = await verifyOtpChallenge({
        challengeId,
        code: fullCode,
      });

      if (!res.success || !res.verificationToken) {
        setError(res.error || "Invalid security code. Please check and retry.");
        return;
      }

      onSuccess(res.verificationToken, challengeId);
    } catch (err: any) {
      setError(err.message || "Failed to verify security authorization.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!onResendOtp) return;
    setIsResending(true);
    setError(null);
    try {
      await onResendOtp();
      setDigits(["", "", "", "", "", ""]);
      setTimeLeft(300);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.message || "Failed to dispatch new security code.");
    } finally {
      setIsResending(false);
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded border border-zinc-700 bg-zinc-800 flex items-center justify-center text-zinc-100">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">Two-Factor Authorization</h3>
              <p className="text-[11px] text-zinc-400 font-mono">High-Value Security Protocol</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Transaction Summary Card */}
          <div className="p-3.5 rounded-lg border border-zinc-800 bg-zinc-900/60 space-y-1 text-xs">
            <div className="text-[10px] uppercase font-mono text-zinc-400 tracking-wider">
              Disbursement Authorization
            </div>
            <div className="font-semibold text-zinc-100 text-sm">
              {transactionSummary}
            </div>
            <div className="text-[11px] text-zinc-400 font-mono pt-1">
              Code dispatched to: <span className="text-zinc-200 font-medium">{maskedEmail}</span>
            </div>
          </div>

          {/* Sandbox helper hint for demo testing */}
          {previewCode && (
            <div className="p-2.5 rounded border border-zinc-800 bg-zinc-900 text-xs font-mono flex items-center justify-between text-zinc-400">
              <span>Sandbox Test Passcode:</span>
              <button
                type="button"
                onClick={() => {
                  const arr = previewCode.split("");
                  setDigits(arr);
                  inputRefs.current[5]?.focus();
                }}
                className="text-zinc-100 font-bold hover:underline"
              >
                {previewCode} (Click to Fill)
              </button>
            </div>
          )}

          {/* 6-Digit Code Input */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-300 uppercase tracking-wider block text-center">
              Enter 6-Digit Verification Code
            </label>

            <div className="flex items-center justify-center gap-2" onPaste={handlePaste}>
              {digits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className={`w-11 h-12 text-center text-lg font-bold font-mono bg-zinc-900 border rounded-lg focus:outline-none transition-colors ${
                    digit
                      ? "border-zinc-100 text-zinc-100 bg-zinc-800/80"
                      : "border-zinc-800 text-zinc-100 focus:border-zinc-500"
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-zinc-400 pt-1">
              <span>Expires in: <span className="text-zinc-200 font-semibold">{timeFormatted}</span></span>
              {onResendOtp && (
                <button
                  type="button"
                  disabled={isResending}
                  onClick={handleResend}
                  className="hover:text-zinc-200 transition-colors flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isResending ? "animate-spin" : ""}`} />
                  <span>Resend Code</span>
                </button>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded border border-zinc-700 bg-zinc-900 text-xs font-mono text-zinc-300">
              {error}
            </div>
          )}

          {/* Confirm Button */}
          <button
            type="button"
            disabled={!isComplete || isVerifying || timeLeft === 0}
            onClick={handleSubmit}
            className="w-full py-3 px-4 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-40 text-zinc-900 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isVerifying ? (
              <span>Verifying Cryptographic Passcode...</span>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Authorize & Execute Disbursement</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
