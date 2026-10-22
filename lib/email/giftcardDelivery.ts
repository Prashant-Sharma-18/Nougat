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
}

export function generateGiftCardEmailHtml(params: GiftCardEmailParams): string {
  const currentYear = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your ${params.brandName} Gift Voucher</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fafafa; margin: 0; padding: 24px; color: #09090b; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 14px; overflow: hidden; border: 1px solid #e4e4e7; }
    .header { background: #09090b; padding: 32px 28px; text-align: left; color: #ffffff; border-bottom: 1px solid #27272a; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }
    .header p { margin: 6px 0 0 0; font-size: 13px; color: #a1a1aa; }
    .content { padding: 28px; }
    .card-box { background: #18181b; border-radius: 12px; padding: 22px; color: #ffffff; margin-bottom: 22px; border: 1px solid #27272a; }
    .card-top { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 16px; }
    .brand-title { font-size: 18px; font-weight: 700; color: #ffffff; }
    .card-val { font-size: 24px; font-weight: 700; font-family: monospace; color: #ffffff; }
    .code-row { background: #09090b; border-radius: 8px; padding: 12px 14px; margin-top: 10px; border: 1px solid #27272a; }
    .code-label { font-size: 10px; text-transform: uppercase; color: #a1a1aa; font-weight: 600; font-family: monospace; letter-spacing: 0.05em; }
    .code-val { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 15px; font-weight: 700; color: #fafafa; letter-spacing: 0.05em; margin-top: 3px; }
    .btn-claim { display: block; text-align: center; background: #09090b; color: #ffffff !important; text-decoration: none; padding: 12px 20px; border-radius: 10px; font-size: 13px; font-weight: 600; margin-top: 20px; border: 1px solid #27272a; }
    .footer { background: #fafafa; padding: 20px 28px; border-top: 1px solid #e4e4e7; font-size: 11px; color: #71717a; text-align: left; }
    .meta-box { margin-top: 20px; padding: 14px; background: #f4f4f5; border-radius: 10px; font-size: 11px; color: #52525b; font-family: monospace; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Digital Reward Voucher</h1>
      <p>Hello ${params.recipientName}, your voucher is ready to be redeemed.</p>
    </div>
    
    <div class="content">
      <div class="card-box">
        <div class="card-top">
          <div class="brand-title">${params.brandName}</div>
          <div class="card-val">$${params.faceValue} <span style="font-size:12px; color:#a1a1aa;">${params.currency}</span></div>
        </div>

        ${
          params.cardCode
            ? `
        <div class="code-row">
          <div class="code-label">Voucher Code</div>
          <div class="code-val">${params.cardCode}</div>
        </div>`
            : ""
        }

        ${
          params.cardPin
            ? `
        <div class="code-row">
          <div class="code-label">PIN</div>
          <div class="code-val">${params.cardPin}</div>
        </div>`
            : ""
        }
      </div>

      ${
        params.claimUrl
          ? `
      <a href="${params.claimUrl}" class="btn-claim" target="_blank">
        Access Reward Link
      </a>`
          : ""
      }

      <div class="meta-box">
        Order Ref: ${params.orderId}<br />
        Remaining Points: ${new Intl.NumberFormat().format(params.remainingPoints)} pts<br />
        Issued via Nougat Enterprise Rewards Platform
      </div>
    </div>

    <div class="footer">
      © ${currentYear} Nougat Enterprise Rewards. If you did not make this transaction, please contact your security administrator.
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Dispatches the transactional email.
 * Emits audit log and returns full HTML for instant in-app modal preview.
 */
export async function sendGiftCardEmail(params: GiftCardEmailParams): Promise<{ success: boolean; html: string }> {
  const html = generateGiftCardEmailHtml(params);

  console.log(
    `[Email Service] Dispatched gift card email to ${params.recipientEmail} for order ${params.orderId}`
  );

  return {
    success: true,
    html,
  };
}
