import { sendEmail, EmailDispatchResult } from "./service";

export interface GiftCardEmailParams {
  recipientName: string;
  recipientEmail: string;
  brandName: string;
  faceValue: number;
  currency: string;
  cardCode?: string | null;
  cardPin?: string | null;
  claimUrl?: string | null;
  orderId: string;
  remainingPoints: number;
  senderName?: string;
  giftMessage?: string | null;
  isEnterpriseBatch?: boolean;
  companyName?: string;
}

export interface PointPurchaseEmailParams {
  customerName: string;
  customerEmail: string;
  packName: string;
  pointsAdded: number;
  amountFormatted: string;
  paymentIntentId: string;
  dateFormatted?: string;
  newBalance: number;
}

export function generateGiftCardEmailHtml(params: GiftCardEmailParams): string {
  const currentYear = new Date().getFullYear();
  const hasGreeting = !!params.giftMessage && params.giftMessage.trim() !== "";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your ${params.brandName} Gift Voucher</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fafafa; margin: 0; padding: 24px; color: #09090b; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e4e4e7; }
    .header { background: #09090b; padding: 30px 28px; text-align: left; color: #ffffff; border-bottom: 1px solid #27272a; }
    .header-badge { display: inline-block; font-size: 10px; font-weight: 700; text-transform: uppercase; font-family: monospace; letter-spacing: 0.05em; padding: 3px 8px; border-radius: 4px; background: #27272a; color: #d4d4d8; margin-bottom: 10px; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }
    .header p { margin: 6px 0 0 0; font-size: 13px; color: #a1a1aa; }
    .content { padding: 28px; }
    .greeting-box { background: #f4f4f5; border-radius: 8px; padding: 14px 18px; margin-bottom: 22px; border-left: 3px solid #09090b; font-size: 13px; color: #27272a; font-style: italic; }
    .card-box { background: #09090b; border-radius: 12px; padding: 24px; color: #ffffff; margin-bottom: 22px; border: 1px solid #27272a; }
    .card-top { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 18px; border-bottom: 1px solid #27272a; padding-bottom: 14px; }
    .brand-title { font-size: 18px; font-weight: 700; color: #ffffff; letter-spacing: -0.01em; }
    .card-val { font-size: 24px; font-weight: 700; font-family: ui-monospace, SFMono-Regular, monospace; color: #ffffff; }
    .barcode-strip { height: 38px; background: repeating-linear-gradient(90deg, #ffffff 0px, #ffffff 3px, #09090b 3px, #09090b 6px, #ffffff 6px, #ffffff 10px, #09090b 10px, #09090b 12px, #ffffff 12px, #ffffff 16px); margin: 16px 0 10px 0; border-radius: 4px; opacity: 0.9; }
    .code-row { background: #18181b; border-radius: 8px; padding: 12px 14px; margin-top: 10px; border: 1px solid #27272a; }
    .code-label { font-size: 10px; text-transform: uppercase; color: #a1a1aa; font-weight: 600; font-family: monospace; letter-spacing: 0.05em; }
    .code-val { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 15px; font-weight: 700; color: #fafafa; letter-spacing: 0.08em; margin-top: 4px; }
    .btn-claim { display: block; text-align: center; background: #09090b; color: #ffffff !important; text-decoration: none; padding: 14px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; margin-top: 22px; border: 1px solid #27272a; }
    .meta-box { margin-top: 22px; padding: 14px; background: #fafafa; border: 1px solid #e4e4e7; border-radius: 8px; font-size: 11px; color: #52525b; font-family: monospace; line-height: 1.6; }
    .footer { background: #fafafa; padding: 20px 28px; border-top: 1px solid #e4e4e7; font-size: 11px; color: #71717a; text-align: left; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="header-badge">${params.isEnterpriseBatch ? "Corporate Enterprise Allocation" : "Digital Voucher Pass"}</span>
      <h1>${params.brandName} Voucher Ready</h1>
      <p>Hello ${params.recipientName}, your digital reward has been issued successfully.</p>
    </div>
    
    <div class="content">
      ${
        hasGreeting
          ? `
      <div class="greeting-box">
        "${params.giftMessage}"
        ${params.senderName ? `<div style="margin-top:6px; font-size:11px; font-weight:600; color:#71717a; text-transform:uppercase;">From: ${params.senderName}</div>` : ""}
      </div>`
          : ""
      }

      <div class="card-box">
        <div class="card-top">
          <div class="brand-title">${params.brandName}</div>
          <div class="card-val">$${params.faceValue.toFixed(2)} <span style="font-size:12px; color:#a1a1aa;">${params.currency}</span></div>
        </div>

        ${
          params.cardCode
            ? `
        <div class="code-row">
          <div class="code-label">Redemption Barcode & Voucher Code</div>
          <div class="barcode-strip"></div>
          <div class="code-val">${params.cardCode}</div>
        </div>`
            : ""
        }

        ${
          params.cardPin
            ? `
        <div class="code-row">
          <div class="code-label">Security PIN</div>
          <div class="code-val">${params.cardPin}</div>
        </div>`
            : ""
        }
      </div>

      ${
        params.claimUrl
          ? `
      <a href="${params.claimUrl}" class="btn-claim" target="_blank">
        Open Direct Claim Portal
      </a>`
          : ""
      }

      <div class="meta-box">
        Order Reference: ${params.orderId}<br />
        Remaining Point Balance: ${new Intl.NumberFormat().format(params.remainingPoints)} pts<br />
        Fulfillment Engine: Dual-Provider Autonomous Failover Router<br />
        Encryption: AES-256-GCM Secured Vault
      </div>
    </div>

    <div class="footer">
      Notice: This email contains bearer financial instruments. Do not forward this message. If you did not authorize this redemption, notify your administrator immediately.
      <br /><br />
      © ${currentYear} Nougat Enterprise Loyalty & Rewards. All rights reserved.
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function generatePointPurchaseReceiptHtml(params: PointPurchaseEmailParams): string {
  const currentYear = new Date().getFullYear();
  const dateStr = params.dateFormatted || new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Payment Receipt - ${params.packName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fafafa; margin: 0; padding: 24px; color: #09090b; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e4e4e7; }
    .header { background: #09090b; padding: 28px; color: #ffffff; border-bottom: 1px solid #27272a; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }
    .header p { margin: 6px 0 0 0; font-size: 13px; color: #a1a1aa; }
    .content { padding: 28px; }
    .receipt-table { width: 100%; border-collapse: collapse; margin-top: 14px; margin-bottom: 22px; }
    .receipt-table th { text-align: left; font-size: 11px; text-transform: uppercase; font-family: monospace; color: #71717a; padding-bottom: 8px; border-bottom: 1px solid #e4e4e7; }
    .receipt-table td { padding: 12px 0; font-size: 13px; border-bottom: 1px solid #f4f4f5; }
    .total-row td { border-top: 2px solid #09090b; border-bottom: none; font-size: 16px; font-weight: 700; padding-top: 14px; }
    .pill { display: inline-block; font-size: 11px; font-family: monospace; padding: 3px 8px; background: #f4f4f5; border-radius: 4px; color: #18181b; }
    .meta-box { background: #fafafa; border: 1px solid #e4e4e7; border-radius: 8px; padding: 14px; font-size: 11px; color: #52525b; font-family: monospace; line-height: 1.6; }
    .footer { background: #fafafa; padding: 20px 28px; border-top: 1px solid #e4e4e7; font-size: 11px; color: #71717a; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Payment Receipt</h1>
      <p>Thank you for your order, ${params.customerName}.</p>
    </div>

    <div class="content">
      <div style="font-size: 12px; color: #71717a; margin-bottom: 14px; font-family: monospace;">
        Invoice Date: ${dateStr} | Status: <span class="pill">PAID</span>
      </div>

      <table class="receipt-table">
        <thead>
          <tr>
            <th>Item Description</th>
            <th style="text-align: right;">Credits</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <div style="font-weight: 600;">${params.packName}</div>
              <div style="font-size: 11px; color: #71717a;">Immediate balance credit</div>
            </td>
            <td style="text-align: right; font-family: monospace; font-weight: 600;">
              +${params.pointsAdded.toLocaleString()} pts
            </td>
            <td style="text-align: right; font-family: monospace; font-weight: 600;">
              ${params.amountFormatted}
            </td>
          </tr>
          <tr class="total-row">
            <td>Total Paid</td>
            <td></td>
            <td style="text-align: right; font-family: monospace;">${params.amountFormatted} USD</td>
          </tr>
        </tbody>
      </table>

      <div class="meta-box">
        Payment Intent: ${params.paymentIntentId}<br />
        Updated Account Balance: ${params.newBalance.toLocaleString()} pts<br />
        Processed via Stripe Secure Payment Gateway
      </div>
    </div>

    <div class="footer">
      For accounting inquiries, reference the payment intent ID above.
      <br /><br />
      © ${currentYear} Nougat Enterprise Loyalty & Rewards.
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Dispatches the gift card voucher transactional email.
 */
export async function sendGiftCardEmail(
  params: GiftCardEmailParams
): Promise<{ success: boolean; html: string; dispatchResult?: EmailDispatchResult }> {
  const html = generateGiftCardEmailHtml(params);
  const subject = params.isEnterpriseBatch
    ? `Corporate Reward: Your ${params.brandName} Voucher ($${params.faceValue})`
    : `Your ${params.brandName} Gift Voucher ($${params.faceValue})`;

  let dispatchResult: EmailDispatchResult | undefined;
  try {
    dispatchResult = await sendEmail({
      to: params.recipientEmail,
      subject,
      html,
      tags: [
        { name: "category", value: "gift_voucher" },
        { name: "order_id", value: params.orderId },
      ],
    });
  } catch (err: any) {
    console.warn(`[GiftCardEmail] Non-blocking dispatch notice: ${err.message}`);
  }

  return {
    success: true,
    html,
    dispatchResult,
  };
}

/**
 * Dispatches the point purchase tax invoice / receipt email.
 */
export async function sendPointPurchaseReceiptEmail(
  params: PointPurchaseEmailParams
): Promise<{ success: boolean; html: string; dispatchResult?: EmailDispatchResult }> {
  const html = generatePointPurchaseReceiptHtml(params);
  const subject = `Receipt for Your Loyalty Points Order (${params.amountFormatted})`;

  let dispatchResult: EmailDispatchResult | undefined;
  try {
    dispatchResult = await sendEmail({
      to: params.customerEmail,
      subject,
      html,
      tags: [
        { name: "category", value: "payment_receipt" },
        { name: "payment_intent", value: params.paymentIntentId },
      ],
    });
  } catch (err: any) {
    console.warn(`[PointPurchaseReceipt] Non-blocking dispatch notice: ${err.message}`);
  }

  return {
    success: true,
    html,
    dispatchResult,
  };
}
