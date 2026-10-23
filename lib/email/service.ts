import axios from "axios";

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const EMAIL_FROM = process.env.EMAIL_FROM || "Nougat Rewards <rewards@resend.dev>";

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  tags?: { name: string; value: string }[];
}

export interface EmailDispatchResult {
  id: string;
  to: string;
  subject: string;
  status: "DELIVERED" | "SIMULATED" | "FAILED";
  timestamp: string;
  isSimulated: boolean;
  error?: string;
}

// In-memory audit log for email dispatches during the server lifecycle
const emailAuditLogs: EmailDispatchResult[] = [];

export async function sendEmail(params: SendEmailParams): Promise<EmailDispatchResult> {
  const recipient = Array.isArray(params.to) ? params.to.join(", ") : params.to;
  const now = new Date().toISOString();

  // Production Resend API dispatch
  if (RESEND_API_KEY && !RESEND_API_KEY.startsWith("mock_") && !RESEND_API_KEY.startsWith("re_placeholder")) {
    try {
      const response = await axios.post(
        "https://api.resend.com/emails",
        {
          from: EMAIL_FROM,
          to: Array.isArray(params.to) ? params.to : [params.to],
          subject: params.subject,
          html: params.html,
          reply_to: params.replyTo,
          tags: params.tags,
        },
        {
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      const record: EmailDispatchResult = {
        id: response.data.id || `msg_${Date.now()}`,
        to: recipient,
        subject: params.subject,
        status: "DELIVERED",
        timestamp: now,
        isSimulated: false,
      };

      emailAuditLogs.unshift(record);
      if (emailAuditLogs.length > 100) emailAuditLogs.pop();

      return record;
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || "Resend API Error";
      console.error("[Email Service] Resend error:", errMsg);

      const failedRecord: EmailDispatchResult = {
        id: `msg_err_${Date.now()}`,
        to: recipient,
        subject: params.subject,
        status: "FAILED",
        timestamp: now,
        isSimulated: false,
        error: errMsg,
      };
      emailAuditLogs.unshift(failedRecord);
      throw new Error(`Email Dispatch Error: ${errMsg}`);
    }
  }

  // High-fidelity Simulator fallback for local testing & sandbox runs
  const simulatedId = `msg_sim_${Math.random().toString(36).substring(2, 11)}`;
  const simRecord: EmailDispatchResult = {
    id: simulatedId,
    to: recipient,
    subject: params.subject,
    status: "SIMULATED",
    timestamp: now,
    isSimulated: true,
  };

  console.log(`[Email Simulator] Dispatched to ${recipient} | Subject: "${params.subject}" [ID: ${simulatedId}]`);

  emailAuditLogs.unshift(simRecord);
  if (emailAuditLogs.length > 100) emailAuditLogs.pop();

  return simRecord;
}

export function getEmailAuditLogs(): EmailDispatchResult[] {
  return [...emailAuditLogs];
}

