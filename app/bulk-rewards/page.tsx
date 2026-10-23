"use client";

import React, { useState, useEffect, useRef } from "react";
import { useUser } from "@/components/UserContext";
import { getBrandCatalog } from "@/actions/catalog";
import { 
  executeBulkRewards, 
  exportBulkBatchCsvAction, 
  BulkRecipientItem 
} from "@/actions/bulkRewards";
import { requestBulkBatchOtp } from "@/actions/otp";
import { OtpVerificationModal } from "@/components/OtpVerificationModal";
import { formatPoints } from "@/lib/utils";
import { getUserTier } from "@/lib/loyalty/tiers";
import { 
  Users, 
  Plus, 
  Trash2, 
  CreditCard, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ExternalLink, 
  Lock,
  Building2,
  Gift,
  Upload,
  FileSpreadsheet,
  Check,
  RotateCcw,
  Layers,
  ShieldCheck
} from "lucide-react";
import confetti from "canvas-confetti";
import Link from "next/link";

function parseRecipientsCsv(csvText: string, availableBrands: any[]): BulkRecipientItem[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));

  if (lines.length < 2) {
    throw new Error("CSV file must contain a header row and at least one recipient row.");
  }

  // Header tokens
  const headerTokens = lines[0]
    .split(",")
    .map((t) => t.trim().toLowerCase().replace(/['"]/g, ""));

  const nameIdx = headerTokens.findIndex(
    (h) => h.includes("name") || h.includes("employee") || h.includes("recipient")
  );
  const emailIdx = headerTokens.findIndex(
    (h) => h.includes("email") || h.includes("mail")
  );
  const brandIdx = headerTokens.findIndex(
    (h) => h.includes("brand") || h.includes("merchant") || h.includes("card")
  );
  const amountIdx = headerTokens.findIndex(
    (h) => h.includes("amount") || h.includes("value") || h.includes("val") || h.includes("face")
  );
  const greetingIdx = headerTokens.findIndex(
    (h) => h.includes("greeting") || h.includes("message") || h.includes("note") || h.includes("reason")
  );

  if (nameIdx === -1 || emailIdx === -1) {
    throw new Error("CSV missing required 'name' and 'email' columns.");
  }

  const defaultBrandId = availableBrands[0]?.id || "prod_amazon_us";
  const parsed: BulkRecipientItem[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    // Regex CSV column parser respecting quotes
    const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
    const matches: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = regex.exec(row)) !== null) {
      let val = match[1] || "";
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1).replace(/""/g, '"');
      }
      matches.push(val.trim());
      if (regex.lastIndex >= row.length) break;
    }

    const name = matches[nameIdx] || "";
    const email = matches[emailIdx] || "";
    if (!name && !email) continue;

    // Brand matching
    let brandId = defaultBrandId;
    if (brandIdx !== -1 && matches[brandIdx]) {
      const brandInput = matches[brandIdx].toLowerCase();
      const matchedBrand = availableBrands.find(
        (b) =>
          b.id.toLowerCase() === brandInput ||
          b.name.toLowerCase().includes(brandInput)
      );
      if (matchedBrand) {
        brandId = matchedBrand.id;
      }
    }

    // Amount matching
    let faceValue = 25;
    if (amountIdx !== -1 && matches[amountIdx]) {
      const num = parseFloat(matches[amountIdx].replace(/[^0-9.]/g, ""));
      if (!isNaN(num) && num > 0) {
        faceValue = num;
      }
    }

    const greeting =
      greetingIdx !== -1 && matches[greetingIdx]
        ? matches[greetingIdx]
        : "Enterprise Recognition Award. Thank you for your contributions.";

    parsed.push({
      id: `csv-${Date.now()}-${i}`,
      name,
      email,
      brandId,
      faceValue,
      greeting,
    });
  }

  if (parsed.length === 0) {
    throw new Error("No valid recipient rows found in the CSV.");
  }

  return parsed;
}

export default function BulkRewardsPage() {
  const { currentUser, updateUserBalance, refreshUserData, isEnterprise, setPortalMode } = useUser();
  const [brands, setBrands] = useState<any[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(true);

  // File input ref for CSV upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Batch actions toolbar state
  const [batchBrand, setBatchBrand] = useState<string>("");
  const [batchAmount, setBatchAmount] = useState<string>("25");
  const [isDragging, setIsDragging] = useState(false);
  const [csvSuccessMessage, setCsvSuccessMessage] = useState<string | null>(null);

  // Recipient rows
  const [recipients, setRecipients] = useState<BulkRecipientItem[]>([
    {
      id: "1",
      name: "Alex Rivera",
      email: "alex.r@examplecorp.com",
      brandId: "prod_amazon_us",
      faceValue: 25,
      greeting: "Q3 Sprint Champion. Fantastic work on the release.",
    },
    {
      id: "2",
      name: "Maya Patel",
      email: "maya.p@examplecorp.com",
      brandId: "prod_starbucks_us",
      faceValue: 15,
      greeting: "Top Customer Support CSAT rating this month.",
    },
    {
      id: "3",
      name: "Liam Chen",
      email: "liam.c@examplecorp.com",
      brandId: "prod_apple_us",
      faceValue: 50,
      greeting: "Milestone Anniversary Reward. Thank you for 3 years.",
    },
    {
      id: "4",
      name: "Sarah Kim",
      email: "sarah.k@examplecorp.com",
      brandId: "prod_target_us",
      faceValue: 25,
      greeting: "Spot Recognition for flawless platform launch.",
    },
  ]);

  const [preferredProvider, setPreferredProvider] = useState<"AUTO_FAILOVER" | "TREMENDOUS" | "RELOADLY">("AUTO_FAILOVER");
  const [useCorpCardTopUp, setUseCorpCardTopUp] = useState(false);
  const [corpCardMask, setCorpCardMask] = useState("Corp Card (Mastercard •••• 9012)");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [batchResults, setBatchResults] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [exportingCsv, setExportingCsv] = useState(false);

  // 2FA Security Challenge state for high-value batches ($500+)
  const [otpChallenge, setOtpChallenge] = useState<{
    challengeId: string;
    expiresAt: number;
    maskedEmail: string;
    previewCode?: string;
  } | null>(null);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);

  useEffect(() => {
    async function loadBrands() {
      try {
        const data = await getBrandCatalog({ onlyActive: true });
        setBrands(data);
        if (data.length > 0 && !batchBrand) {
          setBatchBrand(data[0].id);
        }
      } catch (err) {
        console.error("Failed to load catalog:", err);
      } finally {
        setLoadingBrands(false);
      }
    }
    loadBrands();
  }, []);

  const userBalance = currentUser?.pointBalance ?? 0;
  const userTier = getUserTier(userBalance);

  // Real-time calculation
  const totalFaceValue = recipients.reduce((sum, r) => sum + (Number(r.faceValue) || 0), 0);
  const rawPoints = Math.round(totalFaceValue * 100);
  const tierDiscount = userTier.discountPercentage > 0 
    ? Math.round((rawPoints * userTier.discountPercentage) / 100) 
    : 0;
  const totalPointsRequired = Math.max(0, rawPoints - tierDiscount);

  const canAfford = userBalance >= totalPointsRequired;
  const shortfallPoints = Math.max(0, totalPointsRequired - userBalance);
  const shortfallCash = shortfallPoints / 100;

  const handleAddRow = () => {
    const defaultBrand = brands[0]?.id || "prod_amazon_us";
    setRecipients([
      ...recipients,
      {
        id: String(Date.now()),
        name: "",
        email: "",
        brandId: defaultBrand,
        faceValue: 25,
        greeting: "Spot Recognition Award. Enjoy your reward.",
      },
    ]);
  };

  const handleRemoveRow = (id: string) => {
    if (recipients.length <= 1) return;
    setRecipients(recipients.filter((r) => r.id !== id));
  };

  const handleUpdateRow = (id: string, field: keyof BulkRecipientItem, value: any) => {
    setRecipients(
      recipients.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const handleLoadDemoTeam = () => {
    setRecipients([
      {
        id: "1",
        name: "Alex Rivera",
        email: "alex.r@examplecorp.com",
        brandId: "prod_amazon_us",
        faceValue: 25,
        greeting: "Q3 Sprint Champion. Fantastic work on the release.",
      },
      {
        id: "2",
        name: "Maya Patel",
        email: "maya.p@examplecorp.com",
        brandId: "prod_starbucks_us",
        faceValue: 15,
        greeting: "Top Customer Support CSAT rating this month.",
      },
      {
        id: "3",
        name: "Liam Chen",
        email: "liam.c@examplecorp.com",
        brandId: "prod_apple_us",
        faceValue: 50,
        greeting: "Milestone Anniversary Reward. Thank you for 3 years.",
      },
      {
        id: "4",
        name: "Sarah Kim",
        email: "sarah.k@examplecorp.com",
        brandId: "prod_target_us",
        faceValue: 25,
        greeting: "Spot Recognition for flawless platform launch.",
      },
    ]);
    setErrorMessage(null);
    setCsvSuccessMessage("Loaded demo engineering & support team.");
    setTimeout(() => setCsvSuccessMessage(null), 4000);
  };

  const handleClearAll = () => {
    const defaultBrand = brands[0]?.id || "prod_amazon_us";
    setRecipients([
      {
        id: String(Date.now()),
        name: "",
        email: "",
        brandId: defaultBrand,
        faceValue: 25,
        greeting: "Spot Recognition Award. Enjoy your reward.",
      },
    ]);
    setCsvSuccessMessage(null);
  };

  // Batch actions
  const handleApplyBrandToAll = () => {
    if (!batchBrand) return;
    setRecipients(recipients.map((r) => ({ ...r, brandId: batchBrand })));
    const brandName = brands.find((b) => b.id === batchBrand)?.name || batchBrand;
    setCsvSuccessMessage(`Updated all ${recipients.length} recipients to ${brandName}.`);
    setTimeout(() => setCsvSuccessMessage(null), 4000);
  };

  const handleApplyAmountToAll = () => {
    const val = parseFloat(batchAmount);
    if (isNaN(val) || val <= 0) return;
    setRecipients(recipients.map((r) => ({ ...r, faceValue: val })));
    setCsvSuccessMessage(`Updated all ${recipients.length} recipients to $${val}.00.`);
    setTimeout(() => setCsvSuccessMessage(null), 4000);
  };

  // CSV download template
  const handleDownloadCsvTemplate = () => {
    const csvContent = [
      "name,email,brand,amount,greeting",
      "Alex Rivera,alex.r@examplecorp.com,Amazon,25,Q3 Sprint Champion. Fantastic work on the release.",
      "Maya Patel,maya.p@examplecorp.com,Starbucks,15,Top Customer Support CSAT rating this month.",
      "Liam Chen,liam.c@examplecorp.com,Apple,50,Milestone Anniversary Reward. Thank you for 3 years.",
      "Sarah Kim,sarah.k@examplecorp.com,Target,25,Spot Recognition for flawless platform launch.",
      "Jordan Lee,jordan.l@examplecorp.com,Uber Eats,20,Late night deployment dinner voucher."
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "nougat_bulk_rewards_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV upload handler
  const processCsvContent = (content: string) => {
    try {
      const parsed = parseRecipientsCsv(content, brands);
      setRecipients(parsed);
      setErrorMessage(null);
      setCsvSuccessMessage(`Successfully imported ${parsed.length} recipients from CSV.`);
      setTimeout(() => setCsvSuccessMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to parse CSV file.");
    }
  };

  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        processCsvContent(text);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith(".csv") || file.type === "text/csv")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          processCsvContent(text);
        }
      };
      reader.readAsText(file);
    } else {
      setErrorMessage("Please drop a valid .csv spreadsheet file.");
    }
  };

  const handleExecuteBatch = async () => {
    if (!currentUser) return;
    setErrorMessage(null);

    // Basic frontend check
    for (let i = 0; i < recipients.length; i++) {
      const r = recipients[i];
      if (!r.name.trim() || !r.email.trim() || !r.faceValue) {
        setErrorMessage(`Please complete recipient details for row #${i + 1}.`);
        return;
      }
    }

    if (!canAfford && !useCorpCardTopUp) {
      setUseCorpCardTopUp(true);
      return;
    }

    // High-value corporate bulk batch ($500+) requires 2FA authorization
    if (totalFaceValue >= 500) {
      try {
        setIsSubmitting(true);
        const challenge = await requestBulkBatchOtp({
          userId: currentUser.id,
          totalAmount: totalFaceValue,
          recipientCount: recipients.length,
        });
        setOtpChallenge(challenge);
        setIsOtpModalOpen(true);
        return;
      } catch (err: any) {
        setErrorMessage(err.message || "Failed to initiate security authorization.");
        return;
      } finally {
        setIsSubmitting(false);
      }
    }

    await executeAuthorizedBatch();
  };

  const executeAuthorizedBatch = async (otpToken?: string, otpChallengeId?: string) => {
    if (!currentUser) return;

    try {
      setIsSubmitting(true);
      const res = await executeBulkRewards({
        userId: currentUser.id,
        recipients,
        preferredProvider,
        useCorporateCardTopUp: useCorpCardTopUp,
        corporateCardMask: corpCardMask,
        otpChallengeId,
        otpVerificationToken: otpToken,
      });

      setBatchResults(res);
      updateUserBalance(userBalance - res.totalPointsSpent);
      refreshUserData();
      setIsOtpModalOpen(false);

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.5 },
        });
      } catch (e) {}
    } catch (err: any) {
      setErrorMessage(err.message || "Bulk batch execution failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadCsvReport = async () => {
    if (!batchResults?.results) return;
    try {
      setExportingCsv(true);
      const csv = await exportBulkBatchCsvAction(batchResults.results);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `bulk_rewards_batch_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Export error:", e);
    } finally {
      setExportingCsv(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Mode Differentiation Banner */}
      {!isEnterprise ? (
        <div className="p-4 rounded-xl bg-zinc-100 border border-zinc-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <Building2 className="h-4 w-4 text-zinc-700 shrink-0" />
            <div>
              <span className="font-semibold text-zinc-950 block">Personal Mode Active</span>
              <span className="text-zinc-600">
                You are currently viewing Corporate Bulk Rewards in Personal Member mode. Switch to Enterprise Workspace to access corporate credit lines and company-wide billing.
              </span>
            </div>
          </div>
          <button
            onClick={() => setPortalMode("ENTERPRISE")}
            className="px-3.5 py-1.5 rounded-lg bg-zinc-950 text-white text-xs font-semibold hover:bg-zinc-800 transition-colors whitespace-nowrap self-start sm:self-auto"
          >
            Switch to Enterprise Workspace
          </button>
        </div>
      ) : (
        <div className="p-3.5 rounded-xl bg-zinc-950 text-white text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs font-mono">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-white block">Enterprise Workspace: Acme Corp [ORG-8821]</span>
              <span className="text-zinc-400 text-[11px]">
                Authorized Corporate Co-Pay: $25,000.00 • Direct Tremendous API Settlement Active
              </span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-300 border border-zinc-700 self-start sm:self-auto">
            Corporate Admin Access
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-800 text-xs font-mono mb-2">
            <Building2 className="h-3.5 w-3.5 text-zinc-600" />
            Enterprise Rewards Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-950 tracking-tight flex items-center gap-2.5">
            <Users className="h-6 w-6 text-zinc-800" />
            Corporate & Bulk Employee Rewards
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-2xl">
            Distribute spot bonuses, performance incentives, and milestone awards to multiple team members simultaneously with double-entry auditing and automatic failover.
          </p>
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleCsvFileUpload}
            accept=".csv"
            className="hidden"
          />

          <button
            onClick={handleDownloadCsvTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-medium transition-colors shadow-xs"
            title="Download CSV spreadsheet template"
          >
            <Download className="h-3.5 w-3.5 text-zinc-500" />
            <span>CSV Template</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-medium transition-colors shadow-xs"
            title="Upload CSV spreadsheet"
          >
            <Upload className="h-3.5 w-3.5 text-zinc-500" />
            <span>Upload CSV</span>
          </button>

          <button
            onClick={handleLoadDemoTeam}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-medium transition-colors shadow-xs"
          >
            <span>Sample Team</span>
          </button>

          <button
            onClick={handleAddRow}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-medium transition-colors shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Row</span>
          </button>
        </div>
      </div>

      {/* CSV Success Toast / Notification */}
      {csvSuccessMessage && (
        <div className="p-3.5 rounded-xl bg-zinc-950 text-white text-xs flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>{csvSuccessMessage}</span>
          </div>
          <button
            onClick={() => setCsvSuccessMessage(null)}
            className="text-zinc-400 hover:text-white text-xs font-mono"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Error alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-zinc-100 border border-zinc-300 text-zinc-900 text-xs flex items-start gap-3 shadow-xs">
          <AlertCircle className="h-4 w-4 text-zinc-700 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold block font-mono">Batch Configuration Alert</strong>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Main Grid: Recipients Table + Budget Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recipients Table */}
        <div className="lg:col-span-2 space-y-4">
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`bg-white rounded-xl border shadow-xs overflow-hidden transition-colors ${
              isDragging ? "border-zinc-950 bg-zinc-50 ring-2 ring-zinc-950" : "border-zinc-200"
            }`}
          >
            {/* Table Header & Controls Bar */}
            <div className="p-3.5 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-medium text-zinc-700 uppercase tracking-wider">
                  Recipients List ({recipients.length})
                </span>
                <span className="text-[11px] text-zinc-400 font-mono hidden sm:inline">
                  • Drag & drop .csv anywhere on this card
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearAll}
                  className="text-[11px] font-mono text-zinc-500 hover:text-zinc-950 transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Batch Quick-Actions Strip */}
            <div className="p-3 bg-zinc-100/70 border-b border-zinc-200 flex items-center justify-between gap-3 flex-wrap text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mr-1 flex items-center gap-1">
                  <Layers className="h-3 w-3" />
                  Batch Fill:
                </span>

                {/* Apply Brand to All */}
                <select
                  value={batchBrand}
                  onChange={(e) => setBatchBrand(e.target.value)}
                  className="px-2 py-1 bg-white border border-zinc-200 rounded text-xs font-medium text-zinc-800 focus:outline-none"
                >
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleApplyBrandToAll}
                  className="px-2 py-1 bg-white hover:bg-zinc-50 border border-zinc-200 rounded text-[11px] font-medium text-zinc-700 transition-colors"
                >
                  Set Brand for All
                </button>

                <div className="h-4 w-px bg-zinc-300 mx-1 hidden sm:block" />

                {/* Apply Amount to All */}
                <select
                  value={batchAmount}
                  onChange={(e) => setBatchAmount(e.target.value)}
                  className="px-2 py-1 bg-white border border-zinc-200 rounded text-xs font-mono text-zinc-800 focus:outline-none"
                >
                  <option value="10">$10.00</option>
                  <option value="15">$15.00</option>
                  <option value="25">$25.00</option>
                  <option value="50">$50.00</option>
                  <option value="100">$100.00</option>
                </select>
                <button
                  onClick={handleApplyAmountToAll}
                  className="px-2 py-1 bg-white hover:bg-zinc-50 border border-zinc-200 rounded text-[11px] font-medium text-zinc-700 transition-colors"
                >
                  Set Value for All
                </button>
              </div>
            </div>

            <div className="divide-y divide-zinc-100">
              {recipients.map((r, index) => (
                <div key={r.id} className="p-4 space-y-3 hover:bg-zinc-50/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-700 text-[10px] font-mono">
                      #{index + 1}
                    </span>
                    <button
                      onClick={() => handleRemoveRow(r.id)}
                      disabled={recipients.length <= 1}
                      className="p-1 text-zinc-400 hover:text-zinc-800 disabled:opacity-30 transition-colors"
                      title="Remove Recipient"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-mono text-zinc-500 mb-1">
                        Employee / Recipient Name
                      </label>
                      <input
                        type="text"
                        value={r.name}
                        onChange={(e) => handleUpdateRow(r.id, "name", e.target.value)}
                        placeholder="e.g. Alex Rivera"
                        className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-md text-xs font-medium focus:border-zinc-400 focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-mono text-zinc-500 mb-1">
                        Work Email
                      </label>
                      <input
                        type="email"
                        value={r.email}
                        onChange={(e) => handleUpdateRow(r.id, "email", e.target.value)}
                        placeholder="e.g. alex.r@examplecorp.com"
                        className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-md text-xs font-medium focus:border-zinc-400 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] uppercase font-mono text-zinc-500 mb-1">
                        Brand Selection
                      </label>
                      <select
                        value={r.brandId}
                        onChange={(e) => handleUpdateRow(r.id, "brandId", e.target.value)}
                        className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-md text-xs font-medium focus:border-zinc-400 focus:bg-white focus:outline-none"
                      >
                        {brands.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({b.category})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-mono text-zinc-500 mb-1">
                        Value (USD)
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="1000"
                        step="5"
                        value={r.faceValue}
                        onChange={(e) =>
                          handleUpdateRow(r.id, "faceValue", parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-md text-xs font-mono font-bold focus:border-zinc-400 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-mono text-zinc-500 mb-1">
                      Personalized Greeting / Award Note
                    </label>
                    <input
                      type="text"
                      value={r.greeting || ""}
                      onChange={(e) => handleUpdateRow(r.id, "greeting", e.target.value)}
                      placeholder="e.g. Q3 Sprint Champion. Fantastic work on the release."
                      className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-md text-xs text-zinc-700 focus:border-zinc-400 focus:bg-white focus:outline-none font-sans"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
              <button
                onClick={handleAddRow}
                className="text-xs font-medium text-zinc-700 hover:text-zinc-950 flex items-center gap-1.5 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Another Recipient</span>
              </button>

              <span className="text-[11px] font-mono text-zinc-400">
                Total Face Value: ${totalFaceValue.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Financial Summary & Settlement Authorization */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-zinc-200 shadow-xs p-5 space-y-4">
            <h3 className="font-semibold text-sm text-zinc-950 flex items-center justify-between">
              <span>Settlement Summary</span>
              <span className="text-xs font-mono font-normal text-zinc-500">
                {recipients.length} Recipient{recipients.length === 1 ? "" : "s"}
              </span>
            </h3>

            <div className="space-y-2.5 text-xs font-mono pt-1">
              <div className="flex justify-between text-zinc-600">
                <span>Subtotal Face Value:</span>
                <span className="font-semibold text-zinc-950">${totalFaceValue.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-zinc-600">
                <span>Base Points Cost:</span>
                <span>{formatPoints(rawPoints)} pts</span>
              </div>

              {tierDiscount > 0 && (
                <div className="flex justify-between text-zinc-950 font-medium bg-zinc-50 p-2 rounded-lg border border-zinc-200">
                  <span>Tier Discount ({userTier.displayName} -{userTier.discountPercentage}%):</span>
                  <span>-{formatPoints(tierDiscount)} pts</span>
                </div>
              )}

              <div className="pt-2.5 border-t border-zinc-200 flex justify-between text-sm font-bold text-zinc-950">
                <span className="font-sans">Required Points:</span>
                <span>{formatPoints(totalPointsRequired)} pts</span>
              </div>

              <div className="flex justify-between text-zinc-500 text-[11px]">
                <span>Your Available Balance:</span>
                <span>{formatPoints(userBalance)} pts</span>
              </div>
            </div>

            {/* Split-Tender Corporate Card Top-up */}
            {!canAfford && (
              <div className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-900">Insufficient Loyalty Points</span>
                  <span className="text-[10px] font-mono bg-zinc-200 text-zinc-700 px-1.5 py-0.5 rounded">
                    Short {formatPoints(shortfallPoints)} pts
                  </span>
                </div>
                <p className="text-zinc-600 text-[11px] leading-relaxed">
                  Split settlement enabled: Your remaining {formatPoints(userBalance)} points will be exhausted, and the remaining ${shortfallCash.toFixed(2)} will be settled via Corporate Credit Card.
                </p>

                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useCorpCardTopUp}
                      onChange={(e) => setUseCorpCardTopUp(e.target.checked)}
                      className="rounded border-zinc-300 text-zinc-950 focus:ring-0"
                    />
                    <span className="text-xs font-medium text-zinc-900">
                      Charge ${shortfallCash.toFixed(2)} to {corpCardMask}
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Provider Failover Routing */}
            <div className="pt-2 border-t border-zinc-100 space-y-2">
              <label className="block text-[10px] uppercase font-mono text-zinc-500">
                Fulfillment Gateway
              </label>
              <select
                value={preferredProvider}
                onChange={(e) => setPreferredProvider(e.target.value as any)}
                className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-mono text-zinc-800 focus:border-zinc-400 focus:outline-none"
              >
                <option value="AUTO_FAILOVER">Auto Failover (Tremendous Primary + Reloadly Failover)</option>
                <option value="TREMENDOUS">Tremendous Direct Only</option>
                <option value="RELOADLY">Reloadly Sandbox Direct Only</option>
              </select>
            </div>

            {/* Submit Batch Authorization */}
            <button
              onClick={handleExecuteBatch}
              disabled={isSubmitting || (!canAfford && !useCorpCardTopUp)}
              className="w-full py-2.5 px-4 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-medium shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Settling {recipients.length} Vouchers...</span>
                </>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Authorize & Discard Bulk Batch</span>
                </>
              )}
            </button>

            <div className="pt-2 text-[11px] text-zinc-500 font-mono text-center flex items-center justify-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-zinc-600" />
              <span>Policy &gt; $250 routed to</span>
              <Link href="/admin" className="underline hover:text-zinc-950 font-medium">
                Cost Center Approvals
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Batch Completion Results Modal */}
      {batchResults && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-zinc-200 overflow-hidden">
            <div className="bg-zinc-950 text-white p-6 border-b border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-zinc-100" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold">Batch Fulfillment Complete</h3>
                    <p className="text-xs text-zinc-400 font-mono mt-0.5">
                      Dispatched {batchResults.successCount} of {batchResults.totalRecipients} digital reward vouchers.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setBatchResults(null)}
                  className="px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-xs font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 max-h-[420px] overflow-y-auto">
              <div className="grid grid-cols-3 gap-3 text-center font-mono">
                <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200">
                  <span className="text-[10px] uppercase text-zinc-500 block">Fulfilled</span>
                  <span className="text-lg font-bold text-zinc-950">{batchResults.successCount}</span>
                </div>
                <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200">
                  <span className="text-[10px] uppercase text-zinc-500 block">Points Deducted</span>
                  <span className="text-lg font-bold text-zinc-950">{formatPoints(batchResults.totalPointsSpent)}</span>
                </div>
                <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200">
                  <span className="text-[10px] uppercase text-zinc-500 block">Corp Card Charged</span>
                  <span className="text-lg font-bold text-zinc-950">${batchResults.totalCashSpent.toFixed(2)}</span>
                </div>
              </div>

              <div className="border border-zinc-200 rounded-xl overflow-hidden divide-y divide-zinc-100 text-xs">
                {batchResults.results.map((r: any, idx: number) => (
                  <div key={idx} className="p-3 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-zinc-900 block">{r.recipientName}</span>
                      <span className="text-zinc-400 text-[11px] font-mono">{r.recipientEmail}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-zinc-950 block">
                        ${r.faceValue} {r.brandName}
                      </span>
                      {r.cardCode && (
                        <span className="font-mono text-[10px] text-zinc-500 block">
                          Code: {r.cardCode}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between">
              <button
                onClick={handleDownloadCsvReport}
                disabled={exportingCsv}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-800 text-xs font-medium transition-colors"
              >
                <Download className="h-3.5 w-3.5 text-zinc-500" />
                <span>{exportingCsv ? "Generating Report..." : "Download Batch Audit CSV"}</span>
              </button>

              <Link
                href="/orders"
                onClick={() => setBatchResults(null)}
                className="inline-flex items-center gap-1 text-xs font-medium text-zinc-950 hover:underline"
              >
                <span>View Order Audit Logs</span>
                <ExternalLink className="h-3.5 w-3.5 text-zinc-400" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 2FA OTP Security Challenge Modal for High-Value Bulk Batches */}
      {otpChallenge && (
        <OtpVerificationModal
          isOpen={isOtpModalOpen}
          onClose={() => setIsOtpModalOpen(false)}
          onSuccess={(token, challengeId) => {
            executeAuthorizedBatch(token, challengeId);
          }}
          challengeId={otpChallenge.challengeId}
          maskedEmail={otpChallenge.maskedEmail}
          transactionSummary={`Corporate Batch: ${recipients.length} rewards ($${totalFaceValue.toFixed(2)} USD)`}
          previewCode={otpChallenge.previewCode}
          onResendOtp={async () => {
            if (!currentUser) return;
            const fresh = await requestBulkBatchOtp({
              userId: currentUser.id,
              totalAmount: totalFaceValue,
              recipientCount: recipients.length,
            });
            setOtpChallenge(fresh);
          }}
        />
      )}
    </div>
  );
}
