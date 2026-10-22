"use client";

import React, { useState, useRef, useEffect } from "react";
import { useUser } from "./UserContext";
import { SUPPORTED_CURRENCIES, CurrencyCode } from "@/lib/currency/fx";
import { ChevronDown, Globe, Check } from "lucide-react";

export default function CurrencySelector() {
  const { currentCurrency, setCurrentCurrency } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeConfig = SUPPORTED_CURRENCIES[currentCurrency] || SUPPORTED_CURRENCIES.USD;

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const currencyList = Object.values(SUPPORTED_CURRENCIES);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 transition-colors text-xs font-semibold text-zinc-800 whitespace-nowrap shrink-0"
        title="Select currency"
      >
        <span className="font-mono text-[10px] font-bold text-zinc-500 bg-zinc-100 px-1 py-0.2 rounded">
          {activeConfig.countryCode}
        </span>
        <span>{activeConfig.code}</span>
        <span className="text-zinc-400 font-normal">({activeConfig.symbol})</span>
        <ChevronDown className="h-3 w-3 text-zinc-400 ml-0.5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-60 bg-white rounded-xl shadow-lg border border-zinc-200 py-1.5 z-50 animate-in fade-in duration-100">
          <div className="px-3 py-1.5 border-b border-zinc-100 flex items-center justify-between">
            <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <Globe className="h-3 w-3" /> Currency (FX)
            </span>
            <span className="text-[10px] text-zinc-500 font-medium">Live Rates</span>
          </div>

          <div className="max-h-60 overflow-y-auto py-1 divide-y divide-zinc-50">
            {currencyList.map((c) => {
              const isSelected = c.code === currentCurrency;
              return (
                <button
                  key={c.code}
                  onClick={() => {
                    setCurrentCurrency(c.code);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs transition-colors hover:bg-zinc-50 ${
                    isSelected ? "bg-zinc-50 text-zinc-950 font-semibold" : "text-zinc-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-zinc-500 bg-zinc-100 px-1 py-0.5 rounded">
                      {c.countryCode}
                    </span>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">{c.code}</span>
                        <span className="text-zinc-400 font-normal">({c.symbol})</span>
                      </div>
                      <span className="text-[10px] text-zinc-400 block font-normal leading-tight">
                        {c.name}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {c.code !== "USD" && (
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {c.rateAgainstUsd}x
                      </span>
                    )}
                    {isSelected && <Check className="h-3.5 w-3.5 text-zinc-900 shrink-0" />}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="px-3 py-1.5 bg-zinc-50/70 border-t border-zinc-100 text-[10px] text-zinc-400 text-center">
            Multi-currency FX conversions
          </div>
        </div>
      )}
    </div>
  );
}

