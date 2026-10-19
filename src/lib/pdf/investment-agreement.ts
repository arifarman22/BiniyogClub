/**
 * investment-agreement.ts
 *
 * Investment Agreement PDF — pdfkit, multi-page, same brand palette as the
 * certificate. Issued when an investment becomes active.
 *
 * NOTE: the clause wording below is a standard template. It should be
 * reviewed by Biniyog Club's legal counsel before being relied upon.
 */

import PDFDocument from "pdfkit";
import * as QRCode from "qrcode";
import * as fs from "fs";
import * as path from "path";
import { getMaturityDate } from "@/lib/financial/maturity-date";

export interface InvestmentAgreementData {
  agreementNumber: string;   // same as the investment receipt number
  investmentId: string;
  issuedAt: string;          // ISO
  verificationUrl: string;
  investor: {
    name: string;
    email: string;
    phone?: string | null;
    nationalId?: string | null;
    address?: string | null;
    nomineeName?: string | null;
    nomineeNationalId?: string | null;
  };
  project: {
    title: string;
    category?: string | null;
    location?: string | null;
    durationDays: number;
  };
  investment: {
    amountBdt: number;
    returnLabel: string;       // "20% – 30%" or "15%"
    expectedReturnLabel: string; // "BDT 40,000.00 – BDT 60,000.00"
    returnType: string;
    activatedAt: string;       // ISO
  };
  payments: { method: string; amountBdt: number; reference?: string | null; detail?: string | null }[];
}

const C = {
  brand: "#0d4a42",
  brandDark: "#082f2a",
  brandTint: "#eef6f4",
  gold: "#b08d4a",
  ink: "#111827",
  body: "#374151",
  muted: "#6b7280",
  rule: "#e5e7eb",
};

const RETURN_LABELS: Record<string, string> = {
  FIXED_RETURN: "Fixed Return",
  PROFIT_SHARE: "Profit Share",
  HYBRID: "Hybrid",
};

const fmtBdt = (n: number) => `BDT ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

function getLogoPath(): string | null {
  const candidates = [
    path.join(process.cwd(), "public", "Biniyog Club Logo Icon PNG.png"),
    path.join(process.cwd(), "public", "favicon.png"),
    path.join(process.cwd(), "public", "logo.png"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(/*turbopackIgnore: true*/ p)) return p;
  }
  return null;
}

function clauses(d: InvestmentAgreementData, maturity: string): { title: string; body: string }[] {
  return [
    {
      title: "Investment",
      body: `The Investor has invested ${fmtBdt(d.investment.amountBdt)} (the "Principal") in "${d.project.title}" (the "Project") through Biniyog Club (the "Platform"). The investment takes effect on ${fmtDate(d.investment.activatedAt)} after the Platform verified receipt of the full Principal.`,
    },
    {
      title: "Term",
      body: `The investment runs for ${d.project.durationDays} days and matures on ${maturity}, unless extended or ended earlier under these terms or the Platform's Terms of Service.`,
    },
    {
      title: "Returns",
      body: `The expected return is ${d.investment.returnLabel} of the Principal (${d.investment.expectedReturnLabel}) on a ${RETURN_LABELS[d.investment.returnType] ?? d.investment.returnType} basis. Expected returns are projections based on the Project's business plan and are not guaranteed. Returns, if any, are distributed to the Investor after maturity or as scheduled by the Platform.`,
    },
    {
      title: "Use of funds",
      body: "The Platform shall apply the Principal to the Project's stated operations, keep records of the Project's performance and make periodic updates available to the Investor through the Investor's dashboard.",
    },
    {
      title: "Risk acknowledgement",
      body: "The Investor understands that all investments carry risk, including partial or total loss of the Principal, delays in returns and changes in market conditions. Past performance does not guarantee future results. The Investor confirms that the funds invested are the Investor's own lawful funds.",
    },
    {
      title: "Nominee",
      body: d.investor.nomineeName
        ? `In the event of the Investor's death or incapacity, the Investor's rights under this Agreement pass to the nominee, ${d.investor.nomineeName}${d.investor.nomineeNationalId ? ` (NID ${d.investor.nomineeNationalId})` : ""}, subject to applicable law and verification by the Platform.`
        : "No nominee is recorded. The Investor may add a nominee by contacting the Platform; until then, the Investor's rights pass to legal heirs under applicable law.",
    },
    {
      title: "Transfer and early exit",
      body: "The Investor may not assign or transfer this investment, or withdraw the Principal before maturity, without the Platform's prior written consent.",
    },
    {
      title: "Governing terms and law",
      body: "This Agreement is subject to the Platform's Terms of Service and Privacy Policy as published on biniyogclub.com, and is governed by the laws of the People's Republic of Bangladesh. Disputes shall first be resolved through good-faith discussion and, failing that, by the competent courts of Dhaka.",
    },
  ];
}

export async function renderInvestmentAgreement(data: InvestmentAgreementData): Promise<Buffer> {
  const qrBuffer = await QRCode.toBuffer(data.verificationUrl, {
    type: "png",
    width: 200,
    margin: 0,
    color: { dark: C.brandDark, light: "#ffffff" },
  });
  const logoPath = getLogoPath();

  const maturityDate = getMaturityDate(data.investment.activatedAt, data.project.durationDays);
  const maturity = fmtDate(maturityDate.toISOString());

  return new Promise((resolve, reject) => {
    const M = 58;
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: M, bottom: 70, left: M, right: M },
      bufferPages: true,
      info: {
        Title: `Investment Agreement — ${data.agreementNumber}`,
        Author: "Biniyog Club",
        Subject: "Investment Agreement",
        Keywords: `agreement,investment,${data.agreementNumber}`,
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = doc.page.width - M * 2;
    const rule = (color = C.rule, width = 0.6) => {
      const y = doc.y;
      doc.moveTo(M, y).lineTo(M + W, y).strokeColor(color).lineWidth(width).stroke();
    };
    const heading = (text: string) => {
      if (doc.y > doc.page.height - 160) doc.addPage();
      doc.moveDown(0.8);
      doc.fillColor(C.brand).font("Helvetica-Bold").fontSize(9).text(text.toUpperCase(), M, doc.y, { characterSpacing: 1.4 });
      doc.moveDown(0.3);
      rule(C.brand, 0.8);
      doc.moveDown(0.5);
    };
    const row = (label: string, value: string) => {
      const y = doc.y;
      doc.fillColor(C.muted).font("Helvetica").fontSize(8.5).text(label, M, y, { width: 150 });
      doc.fillColor(C.ink).font("Helvetica-Bold").fontSize(8.5).text(value, M + 150, y, { width: W - 150 });
      doc.moveDown(0.35);
    };

    // ── Letterhead ────────────────────────────────────────────────────────────
    let y = M - 8;
    let nameX = M;
    if (logoPath) {
      try { doc.image(logoPath, M, y, { width: 34, height: 34 }); nameX = M + 44; } catch { /* text-only */ }
    }
    doc.fillColor(C.brand).font("Helvetica-Bold").fontSize(14).text("BINIYOG CLUB", nameX, y + 5, { characterSpacing: 1.6, lineBreak: false });
    doc.fillColor(C.muted).font("Helvetica").fontSize(7.5).text("A Mariners Group Investment Platform", nameX, y + 22, { lineBreak: false });
    doc.fillColor(C.muted).font("Helvetica").fontSize(6.5).text("AGREEMENT NO.", M, y + 2, { width: W, align: "right", characterSpacing: 0.8 });
    doc.fillColor(C.ink).font("Helvetica-Bold").fontSize(8.5).text(data.agreementNumber, M, y + 10, { width: W, align: "right" });
    doc.fillColor(C.muted).font("Helvetica").fontSize(6.5).text("DATE", M, y + 23, { width: W, align: "right", characterSpacing: 0.8 });
    doc.fillColor(C.ink).font("Helvetica-Bold").fontSize(8.5).text(fmtDate(data.issuedAt), M, y + 31, { width: W, align: "right" });

    y += 50;
    doc.y = y;
    rule(C.gold, 0.8);

    // ── Title ─────────────────────────────────────────────────────────────────
    doc.moveDown(1.4);
    doc.fillColor(C.brandDark).font("Times-Bold").fontSize(24).text("Investment Agreement", M, doc.y, { width: W, align: "center" });
    doc.moveDown(0.3);
    doc.fillColor(C.body).font("Times-Italic").fontSize(11)
      .text(`This Agreement is made on ${fmtDate(data.issuedAt)} between the parties named below.`, M, doc.y, { width: W, align: "center" });

    // ── Parties ───────────────────────────────────────────────────────────────
    heading("1. Parties");
    doc.fillColor(C.ink).font("Helvetica-Bold").fontSize(9).text("Biniyog Club (the \"Platform\")", M, doc.y);
    doc.fillColor(C.body).font("Helvetica").fontSize(8.5).text("MG SAM Center, 12 Mohakhali C/A, Dhaka-1212, Bangladesh · info@biniyogclub.com", M, doc.y);
    doc.moveDown(0.6);
    doc.fillColor(C.ink).font("Helvetica-Bold").fontSize(9).text(`${data.investor.name} (the "Investor")`, M, doc.y);
    doc.moveDown(0.3);
    row("NID number", data.investor.nationalId ?? "—");
    row("Email", data.investor.email);
    row("Phone", data.investor.phone ?? "—");
    row("Address", data.investor.address ?? "—");
    row("Nominee", data.investor.nomineeName
      ? `${data.investor.nomineeName}${data.investor.nomineeNationalId ? ` (NID ${data.investor.nomineeNationalId})` : ""}`
      : "Not recorded");

    // ── Investment details ───────────────────────────────────────────────────
    heading("2. Investment details");
    row("Project", data.project.title);
    if (data.project.category) row("Category", data.project.category);
    if (data.project.location) row("Location", data.project.location);
    row("Principal", fmtBdt(data.investment.amountBdt));
    row("Expected return", `${data.investment.returnLabel} (${data.investment.expectedReturnLabel})`);
    row("Return type", RETURN_LABELS[data.investment.returnType] ?? data.investment.returnType);
    row("Term", `${data.project.durationDays} days`);
    row("Effective date", fmtDate(data.investment.activatedAt));
    row("Maturity date", maturity);
    row("Investment ID", data.investmentId.slice(0, 8).toUpperCase());

    // ── Payment ──────────────────────────────────────────────────────────────
    if (data.payments.length > 0) {
      heading("3. Payment received");
      for (const p of data.payments) {
        row(p.method, [fmtBdt(p.amountBdt), p.reference, p.detail].filter(Boolean).join(" · "));
      }
      row("Total", fmtBdt(data.payments.reduce((s, p) => s + p.amountBdt, 0)));
    }

    // ── Terms ────────────────────────────────────────────────────────────────
    heading(`${data.payments.length > 0 ? 4 : 3}. Terms`);
    clauses(data, maturity).forEach((c, i) => {
      if (doc.y > doc.page.height - 130) doc.addPage();
      doc.fillColor(C.ink).font("Helvetica-Bold").fontSize(9).text(`${i + 1}. ${c.title}`, M, doc.y);
      doc.moveDown(0.15);
      doc.fillColor(C.body).font("Helvetica").fontSize(8.5).text(c.body, M, doc.y, { width: W, align: "justify", lineGap: 1.5 });
      doc.moveDown(0.55);
    });

    // ── Signatures + verification ────────────────────────────────────────────
    // Block below the clauses: QR on the right, signature lines level with its base.
    if (doc.y > doc.page.height - 220) doc.addPage();
    const blockTop = doc.y + 24;
    const QR = 80;
    const qrX = M + W - QR;
    doc.image(qrBuffer, qrX, blockTop, { width: QR, height: QR });
    doc.fillColor(C.muted).font("Helvetica").fontSize(6.5)
      .text("Scan to verify", qrX - 10, blockTop + QR + 4, { width: QR + 20, align: "center" });

    const sigY = blockTop + QR - 10;
    const colW = (W - QR - 40) / 2 - 10;
    for (const [i, label] of [["Investor", data.investor.name], ["For Biniyog Club", "Authorised signatory"]].entries()) {
      const x = M + i * (colW + 20);
      doc.moveTo(x, sigY).lineTo(x + colW, sigY).strokeColor(C.ink).lineWidth(0.6).stroke();
      doc.fillColor(C.ink).font("Helvetica-Bold").fontSize(8.5).text(label[0], x, sigY + 5, { width: colW });
      doc.fillColor(C.muted).font("Helvetica").fontSize(7.5).text(label[1], x, sigY + 17, { width: colW });
    }

    // ── Footer on every page ─────────────────────────────────────────────────
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      // Footer sits below the bottom margin — lift it so pdfkit doesn't add a page.
      doc.page.margins.bottom = 0;
      const fy = doc.page.height - 45;
      doc.moveTo(M, fy - 6).lineTo(M + W, fy - 6).strokeColor(C.rule).lineWidth(0.5).stroke();
      doc.fillColor(C.muted).font("Helvetica").fontSize(7)
        .text(`Investment Agreement ${data.agreementNumber}`, M, fy, { width: W / 2, lineBreak: false })
        .text(`Page ${i - range.start + 1} of ${range.count}`, M + W / 2, fy, { width: W / 2, align: "right", lineBreak: false });
    }

    doc.end();
  });
}
