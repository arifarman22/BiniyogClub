"use server";

import { sendEmail, buildContactInquiryEmail } from "@/lib/email/mailer";
import { contactSchema, type ContactInput } from "@/validations/contact";
import type { ActionResult } from "@/server/actions/auth.actions";

// Inquiries go to the public address shown on the contact page unless overridden.
const CONTACT_INBOX = process.env.CONTACT_INBOX_EMAIL ?? "info@biniyogclub.com";

export async function submitContactInquiryAction(input: ContactInput): Promise<ActionResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validation failed", fieldErrors };
  }

  const { website, ...inquiry } = parsed.data;
  // Silently accept bot submissions so they don't retry.
  if (website) return { success: true, data: undefined };

  try {
    await sendEmail({
      to: CONTACT_INBOX,
      replyTo: inquiry.email,
      subject: `[Contact] ${inquiry.inquiryType}${inquiry.subject ? ` — ${inquiry.subject}` : ""}`,
      html: buildContactInquiryEmail({
        ...inquiry,
        phone: inquiry.phone || undefined,
        subject: inquiry.subject || undefined,
      }),
    });
    return { success: true, data: undefined };
  } catch (error) {
    console.error("[contact] failed to send inquiry", error instanceof Error ? error.message : error);
    return {
      success: false,
      error: "We couldn't send your message right now. Please call or email us directly.",
    };
  }
}
