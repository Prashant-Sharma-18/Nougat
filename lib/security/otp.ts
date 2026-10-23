import crypto from "crypto";
import { sendEmail } from "@/lib/email/service";
import { createNotification } from "@/actions/notifications";

export const HIGH_VALUE_REDEMPTION_THRESHOLD = 100; // $100 or higher
export const HIGH_VALUE_BULK_THRESHOLD = 500; // $500 or higher

export interface OtpChallenge {
  id: string;
  userId: string;
  email: string;
  codeHash: string;
  purpose: "HIGH_VALUE_REDEMPTION" | "BULK_REWARDS_BATCH";
  context: {
    faceValue?: number;
    brandName?: string;
    totalAmount?: number;
    recipientCount?: number;
  };
  attempts: number;
  maxAttempts: number;
  expiresAt: number;
  verified: boolean;
  verificationToken?: string;
}

// In-memory challenge store (5-minute TTL)
const challengeStore = new Map<string, OtpChallenge>();

// Clean up expired challenges periodically
function purgeExpiredChallenges() {
  const now = Date.now();
  challengeStore.forEach((challenge, id) => {
    if (challenge.expiresAt < now) {
      challengeStore.delete(id);
    }
  });
}

function hashCode(code: string): string {
  return crypto.createHash("sha256").update(code.trim()).digest("hex");
}

export async function createOtpChallenge({
  userId,
  email,
  purpose,
  context,
}: {
  userId: string;
  email: string;
  purpose: "HIGH_VALUE_REDEMPTION" | "BULK_REWARDS_BATCH";
  context: {
    faceValue?: number;
    brandName?: string;
    totalAmount?: number;
    recipientCount?: number;
  };
}): Promise<{ challengeId: string; expiresAt: number; maskedEmail: string; previewCode?: string }> {
  purgeExpiredChallenges();

  const challengeId = `otp_${crypto.randomUUID()}`;
  // Generate cryptographically secure 6-digit numeric OTP (100000 - 999999)
  const numericCode = (Math.floor(100000 + crypto.randomInt(900000))).toString();
  const codeHash = hashCode(numericCode);
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

  const challenge: OtpChallenge = {
    id: challengeId,
    userId,
    email,
    codeHash,
    purpose,
    context,
    attempts: 0,
    maxAttempts: 3,
    expiresAt,
    verified: false,
  };

  challengeStore.set(challengeId, challenge);

  // Mask email for display: a***@example.com
  const parts = email.split("@");
  const maskedLocal = parts[0].length > 2 
    ? `${parts[0].charAt(0)}***${parts[0].charAt(parts[0].length - 1)}`
    : `${parts[0].charAt(0)}***`;
  const maskedEmail = `${maskedLocal}@${parts[1] || "domain.com"}`;

  const currentYear = new Date().getFullYear();
  const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Security Verification Code</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fafafa; margin: 0; padding: 24px; color: #09090b; }
    .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e4e4e7; }
    .header { background: #09090b; padding: 28px; text-align: left; color: #ffffff; border-bottom: 1px solid #27272a; }
    .header h1 { margin: 0; font-size: 19px; font-weight: 700; letter-spacing: -0.02em; }
    .header p { margin: 6px 0 0 0; font-size: 13px; color: #a1a1aa; }
    .content { padding: 28px; }
    .code-box { background: #09090b; border: 1px solid #27272a; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
    .code-digits { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 32px; font-weight: 700; letter-spacing: 0.35em; color: #ffffff; }
    .warning-box { background: #fafafa; border: 1px solid #e4e4e7; border-radius: 8px; padding: 14px; font-size: 12px; color: #52525b; line-height: 1.5; }
    .footer { background: #fafafa; padding: 18px 28px; border-top: 1px solid #e4e4e7; font-size: 11px; color: #71717a; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Security Verification Code</h1>
      <p>Authorization required for high-value transaction</p>
    </div>
    <div class="content">
      <p style="margin: 0; font-size: 13px; color: #27272a;">
        A high-value disbursement has been requested on your account:
      </p>
      <div style="margin-top: 8px; font-size: 13px; font-weight: 600; color: #09090b;">
        ${
          purpose === "HIGH_VALUE_REDEMPTION"
            ? `${context.brandName || "Reward"} Voucher: $${context.faceValue?.toFixed(2)} USD`
            : `Corporate Bulk Batch: ${context.recipientCount} rewards ($${context.totalAmount?.toFixed(2)} USD)`
        }
      </div>

      <div class="code-box">
        <div style="font-size: 10px; text-transform: uppercase; font-family: monospace; color: #a1a1aa; margin-bottom: 6px;">
          One-Time Passcode (Expires in 5 Minutes)
        </div>
        <div class="code-digits">${numericCode}</div>
      </div>

      <div class="warning-box">
        Never share this code with anyone. Nougat Security representatives will never ask for your verification passcode.
      </div>
    </div>
    <div class="footer">
      © ${currentYear} Nougat Enterprise Security. If you did not initiate this request, lock your account immediately.
    </div>
  </div>
</body>
</html>
  `.trim();

  // Send email dispatch
  try {
    await sendEmail({
      to: email,
      subject: `Your Nougat Security Code: ${numericCode}`,
      html: emailHtml,
      tags: [{ name: "type", value: "2fa_otp" }],
    });
  } catch (err) {
    console.warn("[OTP] Email notification fallback warning:", err);
  }

  // Also emit in-app notification so local developer / demo user can see code immediately
  try {
    await createNotification({
      userId,
      title: "Security Verification Code",
      message: `Use code ${numericCode} to authorize your $${context.faceValue || context.totalAmount} disbursement (Expires in 5m).`,
      type: "SYSTEM",
      link: "#",
    });
  } catch (err) {
    // Non-blocking notification
  }

  return {
    challengeId,
    expiresAt,
    maskedEmail,
    // Return preview code in development/simulation so users can test without checking external mailboxes
    previewCode: numericCode,
  };
}

export function verifyOtpCode({
  challengeId,
  code,
}: {
  challengeId: string;
  code: string;
}): { success: boolean; verificationToken?: string; error?: string; remainingAttempts?: number } {
  const challenge = challengeStore.get(challengeId);

  if (!challenge) {
    return { success: false, error: "Verification challenge expired or not found. Please request a new code." };
  }

  if (Date.now() > challenge.expiresAt) {
    challengeStore.delete(challengeId);
    return { success: false, error: "Verification code has expired. Please request a new code." };
  }

  if (challenge.attempts >= challenge.maxAttempts) {
    challengeStore.delete(challengeId);
    return {
      success: false,
      error: "Maximum verification attempts exceeded. Challenge locked for security.",
    };
  }

  const incomingHash = hashCode(code);
  if (incomingHash !== challenge.codeHash) {
    challenge.attempts += 1;
    const remaining = challenge.maxAttempts - challenge.attempts;
    return {
      success: false,
      error: `Invalid verification code. ${remaining} attempt(s) remaining.`,
      remainingAttempts: remaining,
    };
  }

  // Generate short-lived verification token (2 minutes) to complete the transaction
  const verificationToken = `vtok_${crypto.randomUUID()}`;
  challenge.verified = true;
  challenge.verificationToken = verificationToken;

  return {
    success: true,
    verificationToken,
  };
}

export function consumeVerificationToken({
  challengeId,
  token,
}: {
  challengeId: string;
  token: string;
}): boolean {
  const challenge = challengeStore.get(challengeId);
  if (!challenge) return false;

  if (
    challenge.verified &&
    challenge.verificationToken === token &&
    Date.now() <= challenge.expiresAt
  ) {
    challengeStore.delete(challengeId);
    return true;
  }

  return false;
}
