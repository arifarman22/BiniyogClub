import nodemailer from "nodemailer";
import { env } from "@/config/env";

// ─── Transport ────────────────────────────────────────────────────────────────

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
});

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<void> {
  await transporter.sendMail({ from: env.SMTP_FROM, to, subject, html });
}

// ─── Layout ───────────────────────────────────────────────────────────────────

function emailLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Biniyog Club</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f3;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
        <!-- Header -->
        <tr>
          <td style="background:#1a4731;border-radius:12px 12px 0 0;padding:24px 32px;">
            <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">🌿 Biniyog Club</span>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none;">
            ${content}
            <hr style="border:none;border-top:1px solid #f0f0f0;margin:28px 0;" />
            <p style="color:#9ca3af;font-size:12px;margin:0;line-height:1.6;">
              This email was sent by Biniyog Club. If you did not request this, you can safely ignore it.<br />
              &copy; ${new Date().getFullYear()} Biniyog Club. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function ctaButton(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:#1a6b3c;color:#ffffff;font-size:15px;font-weight:600;padding:13px 28px;border-radius:8px;text-decoration:none;margin:20px 0;">${label}</a>`;
}

// ─── Templates ────────────────────────────────────────────────────────────────

export function buildVerificationEmail(name: string, verificationUrl: string): string {
  return emailLayout(`
    <h2 style="color:#111827;font-size:22px;font-weight:700;margin:0 0 8px;">Verify your email address</h2>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">Hi ${escapeHtml(name)},</p>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 4px;">
      Welcome to Biniyog Club! Click the button below to verify your email address and activate your account.
    </p>
    ${ctaButton(verificationUrl, "Verify Email Address")}
    <p style="color:#6b7280;font-size:13px;margin:8px 0 0;">
      This link expires in <strong>24 hours</strong>. If you didn't create an account, you can ignore this email.
    </p>
    <p style="color:#9ca3af;font-size:12px;margin:12px 0 0;word-break:break-all;">
      Or copy this link: ${verificationUrl}
    </p>
  `);
}

export function buildPasswordResetEmail(name: string, resetUrl: string): string {
  return emailLayout(`
    <h2 style="color:#111827;font-size:22px;font-weight:700;margin:0 0 8px;">Reset your password</h2>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">Hi ${escapeHtml(name)},</p>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 4px;">
      We received a request to reset your Biniyog Club password. Click the button below to choose a new password.
    </p>
    ${ctaButton(resetUrl, "Reset Password")}
    <p style="color:#6b7280;font-size:13px;margin:8px 0 0;">
      This link expires in <strong>1 hour</strong>. If you didn't request a password reset, no action is needed — your account is safe.
    </p>
    <p style="color:#9ca3af;font-size:12px;margin:12px 0 0;word-break:break-all;">
      Or copy this link: ${resetUrl}
    </p>
  `);
}

export function buildOtpEmail(name: string, otp: string): string {
  return emailLayout(`
    <h2 style="color:#111827;font-size:22px;font-weight:700;margin:0 0 8px;">Your verification code</h2>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">Hi ${escapeHtml(name)},</p>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">
      Use the code below to complete your verification:
    </p>
    <div style="background:#f0fdf4;border:2px solid #bbf7d0;border-radius:10px;padding:20px;text-align:center;margin:0 0 16px;">
      <span style="font-size:36px;font-weight:800;letter-spacing:12px;color:#15803d;font-family:monospace;">${otp}</span>
    </div>
    <p style="color:#6b7280;font-size:13px;margin:0;">
      This code expires in <strong>10 minutes</strong>. Do not share it with anyone.
    </p>
  `);
}

export function buildPasswordChangedEmail(name: string): string {
  return emailLayout(`
    <h2 style="color:#111827;font-size:22px;font-weight:700;margin:0 0 8px;">Password changed</h2>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">Hi ${escapeHtml(name)},</p>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">
      Your Biniyog Club password was successfully changed.
    </p>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0;">
      If you did not make this change, please <a href="${env.NEXT_PUBLIC_APP_URL}/auth/forgot-password" style="color:#1a6b3c;font-weight:600;">reset your password immediately</a> and contact our support team.
    </p>
  `);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
