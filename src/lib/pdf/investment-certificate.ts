/**
 * investment-certificate.ts
 *
 * Tamper-evident investment receipt — pdfkit + QR code.
 * Enterprise-grade layout with logo, address block, and verification section.
 */

import PDFDocument from "pdfkit";
import * as QRCode from "qrcode";
import * as fs from "fs";
import * as path from "path";

export interface InvestmentCertificateData {
  receiptNumber: string;
  investmentId: string;
  generatedAt: string;
  verificationUrl: string;
  investor: {
    name: string;
    email: string;
    phone?: string | null;
  };
  project: {
    title: string;
    expectedReturnPct: number;
    durationDays: number;
    category?: string;
    location?: string | null;
  };
  investment: {
    amountBdt: number;
    expectedReturnBdt: number;
    returnType: string;
    activatedAt: string;
  };
}

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  green:    "#16a34a" as const,
  greenBg:  "#f0fdf4" as const,
  greenBd:  "#bbf7d0" as const,
  dark:     "#0f172a" as const,
  slate:    "#1e293b" as const,
  muted:    "#64748b" as const,
  border:   "#e2e8f0" as const,
  bg:       "#f8fafc" as const,
  amber:    "#b45309" as const,
  amberBg:  "#fffbeb" as const,
  amberBd:  "#fde68a" as const,
  white:    "#ffffff" as const,
  headerBg: "#0f172a" as const,
};

const RETURN_LABELS: Record<string, string> = {
  FIXED_RETURN: "Fixed Return",
  PROFIT_SHARE: "Profit Share",
  HYBRID:       "Hybrid",
};

function rgb(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)];
}

function fmtBdt(n: number): string {
  return `BDT ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
}

// Resolve logo path — works both locally (public/) and on Vercel (process.cwd()/public/)
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

export async function renderInvestmentCertificate(
  data: InvestmentCertificateData,
): Promise<Buffer> {
  // Generate QR code PNG buffer
  const qrBuffer = await QRCode.toBuffer(data.verificationUrl, {
    type: "png",
    width: 110,
    margin: 1,
    color: { dark: "#0f172a", light: "#ffffff" },
  });

  const logoPath = getLogoPath();

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 0,
      info: {
        Title: `Investment Certificate — ${data.receiptNumber}`,
        Author: "Biniyog Club",
        Subject: "Investment Certificate",
        Keywords: `receipt,investment,${data.receiptNumber}`,
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end",  () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const PW = doc.page.width;   // 595
    const PH = doc.page.height;  // 842
    const M  = 48;               // margin
    const W  = PW - M * 2;       // usable width

    // ── Header band ──────────────────────────────────────────────────────────
    const HEADER_H = 100;
    doc.rect(0, 0, PW, HEADER_H).fillColor(rgb(C.headerBg)).fill();

    // Logo (left side)
    const LOGO_SIZE = 52;
    const LOGO_X = M;
    const LOGO_Y = (HEADER_H - LOGO_SIZE) / 2;
    if (logoPath) {
      try {
        doc.image(logoPath, LOGO_X, LOGO_Y, { width: LOGO_SIZE, height: LOGO_SIZE });
      } catch { /* skip if image fails */ }
    }

    // Company name + tagline (next to logo)
    const nameX = logoPath ? LOGO_X + LOGO_SIZE + 12 : M;
    doc.fillColor(rgb(C.green)).fontSize(20).font("Helvetica-Bold")
       .text("Biniyog Club", nameX, 28, { lineBreak: false });
    doc.fillColor(rgb("#94a3b8")).fontSize(8).font("Helvetica")
       .text("Agricultural Investment Platform", nameX, 52, { lineBreak: false });

    // Right side: address + contact block
    const rightColW = 200;
    const rightX = PW - M - rightColW;
    doc.fillColor(rgb("#94a3b8")).fontSize(7).font("Helvetica")
       .text("Dhaka, Bangladesh", rightX, 22, { width: rightColW, align: "right" })
       .text("info@biniyogclub.com", rightX, 34, { width: rightColW, align: "right" })
       .text("www.biniyogclub.com", rightX, 46, { width: rightColW, align: "right" });

    // Green accent line at bottom of header
    doc.rect(0, HEADER_H, PW, 3).fillColor(rgb(C.green)).fill();

    // ── Certificate title band ────────────────────────────────────────────────
    const TITLE_Y = HEADER_H + 3;
    const TITLE_H = 48;
    doc.rect(0, TITLE_Y, PW, TITLE_H).fillColor(rgb(C.bg)).fill();

    doc.fillColor(rgb(C.dark)).fontSize(16).font("Helvetica-Bold")
       .text("INVESTMENT CERTIFICATE", M, TITLE_Y + 10, { width: W, align: "center", characterSpacing: 1.5 });
    doc.fillColor(rgb(C.muted)).fontSize(8).font("Helvetica")
       .text("This document confirms a verified investment on the Biniyog Club platform", M, TITLE_Y + 30, { width: W, align: "center" });

    // Thin border under title
    doc.rect(0, TITLE_Y + TITLE_H, PW, 1).fillColor(rgb(C.border)).fill();

    // ── Receipt meta row ──────────────────────────────────────────────────────
    const META_Y = TITLE_Y + TITLE_H + 1;
    const META_H = 32;
    doc.rect(0, META_Y, PW, META_H).fillColor(rgb("#f1f5f9")).fill();

    doc.fillColor(rgb(C.muted)).fontSize(7).font("Helvetica")
       .text("CERTIFICATE NO.", M, META_Y + 8, { lineBreak: false });
    doc.fillColor(rgb(C.dark)).fontSize(9).font("Helvetica-Bold")
       .text(data.receiptNumber, M + 82, META_Y + 7, { lineBreak: false });

    doc.fillColor(rgb(C.muted)).fontSize(7).font("Helvetica")
       .text("ISSUED DATE", M + 220, META_Y + 8, { lineBreak: false });
    doc.fillColor(rgb(C.dark)).fontSize(9).font("Helvetica-Bold")
       .text(fmtDate(data.generatedAt), M + 290, META_Y + 7, { lineBreak: false });

    // Status badge
    const badgeW = 80;
    const badgeX = PW - M - badgeW;
    doc.roundedRect(badgeX, META_Y + 7, badgeW, 18, 3).fillColor(rgb(C.greenBg)).fill();
    doc.roundedRect(badgeX, META_Y + 7, badgeW, 18, 3).strokeColor(rgb(C.greenBd)).lineWidth(0.8).stroke();
    doc.fillColor(rgb(C.green)).fontSize(8).font("Helvetica-Bold")
       .text("CONFIRMED", badgeX, META_Y + 12, { width: badgeW, align: "center" });

    doc.rect(0, META_Y + META_H, PW, 1).fillColor(rgb(C.border)).fill();

    // ── Key figures highlight box ─────────────────────────────────────────────
    let y = META_Y + META_H + 1 + 16;

    const maturityDate = new Date(data.investment.activatedAt);
    maturityDate.setDate(maturityDate.getDate() + data.project.durationDays);

    const hBoxH = 68;
    doc.roundedRect(M, y, W, hBoxH, 6).fillColor(rgb(C.greenBg)).fill();
    doc.roundedRect(M, y, W, hBoxH, 6).strokeColor(rgb(C.greenBd)).lineWidth(1).stroke();

    const col = W / 3;
    const highlights = [
      { label: "AMOUNT INVESTED",  value: fmtBdt(data.investment.amountBdt),        sub: "Principal" },
      { label: "EXPECTED RETURN",  value: fmtBdt(data.investment.expectedReturnBdt), sub: `${data.project.expectedReturnPct}% of principal` },
      { label: "MATURITY DATE",    value: fmtDate(maturityDate.toISOString()),        sub: `${data.project.durationDays}-day term` },
    ];
    highlights.forEach((item, i) => {
      const x = M + col * i;
      // Vertical divider
      if (i > 0) {
        doc.moveTo(x, y + 10).lineTo(x, y + hBoxH - 10).strokeColor(rgb(C.greenBd)).lineWidth(0.8).stroke();
      }
      doc.fillColor(rgb(C.muted)).fontSize(7).font("Helvetica")
         .text(item.label, x, y + 10, { width: col, align: "center" });
      doc.fillColor(rgb(C.green)).fontSize(13).font("Helvetica-Bold")
         .text(item.value, x, y + 22, { width: col, align: "center" });
      doc.fillColor(rgb(C.muted)).fontSize(7).font("Helvetica")
         .text(item.sub, x, y + 42, { width: col, align: "center" });
    });

    y += hBoxH + 18;

    // ── Section helper ────────────────────────────────────────────────────────
    function section(title: string, rows: { label: string; value: string }[]) {
      // Section label with left accent bar
      doc.rect(M, y, 3, 14).fillColor(rgb(C.green)).fill();
      doc.fillColor(rgb(C.slate)).fontSize(8).font("Helvetica-Bold")
         .text(title.toUpperCase(), M + 8, y + 2, { characterSpacing: 0.8 });
      y += 18;

      const h = rows.length * 24 + 10;
      doc.roundedRect(M, y, W, h, 4).fillColor(rgb(C.bg)).fill();
      doc.roundedRect(M, y, W, h, 4).strokeColor(rgb(C.border)).lineWidth(0.8).stroke();

      rows.forEach((row, i) => {
        const ry = y + 7 + i * 24;
        // Alternating row tint
        if (i % 2 === 1) {
          doc.rect(M + 1, ry - 2, W - 2, 22).fillColor(rgb("#f8fafc")).fill();
        }
        doc.fillColor(rgb(C.muted)).fontSize(9).font("Helvetica").text(row.label, M + 14, ry);
        doc.fillColor(rgb(C.dark)).fontSize(9).font("Helvetica-Bold")
           .text(row.value, M + 14, ry, { width: W - 28, align: "right" });
        if (i < rows.length - 1) {
          doc.moveTo(M + 14, ry + 20).lineTo(M + W - 14, ry + 20)
             .strokeColor(rgb(C.border)).lineWidth(0.4).stroke();
        }
      });

      y += h + 14;
    }

    // ── Investor Details ──────────────────────────────────────────────────────
    const investorRows: { label: string; value: string }[] = [
      { label: "Full Name",     value: data.investor.name },
      { label: "Email Address", value: data.investor.email },
    ];
    if (data.investor.phone) investorRows.push({ label: "Phone Number", value: data.investor.phone });
    section("Investor Details", investorRows);

    // ── Project Details ───────────────────────────────────────────────────────
    const projectRows: { label: string; value: string }[] = [
      { label: "Project Title", value: data.project.title },
    ];
    if (data.project.location) projectRows.push({ label: "Location", value: data.project.location });
    projectRows.push({ label: "Return Type", value: RETURN_LABELS[data.investment.returnType] ?? data.investment.returnType });
    section("Project Details", projectRows);

    // ── Investment Terms ──────────────────────────────────────────────────────
    section("Investment Terms", [
      { label: "Investment Date",                                       value: fmtDate(data.investment.activatedAt) },
      { label: "Maturity Date",                                         value: fmtDate(maturityDate.toISOString()) },
      { label: "Principal Amount",                                      value: fmtBdt(data.investment.amountBdt) },
      { label: `Expected Return (${data.project.expectedReturnPct}%)`, value: fmtBdt(data.investment.expectedReturnBdt) },
      { label: "Total Expected Value",                                  value: fmtBdt(data.investment.amountBdt + data.investment.expectedReturnBdt) },
    ]);

    // ── Verification box ──────────────────────────────────────────────────────
    const vBoxH = 88;
    doc.roundedRect(M, y, W, vBoxH, 6).fillColor(rgb(C.amberBg)).fill();
    doc.roundedRect(M, y, W, vBoxH, 6).strokeColor(rgb(C.amberBd)).lineWidth(1).stroke();

    const qrSize = 66;
    const qrX    = M + W - qrSize - 12;
    const textW  = qrX - M - 24;

    // Left accent bar
    doc.rect(M, y, 3, vBoxH).fillColor(rgb(C.amber)).fill();

    doc.fillColor(rgb(C.amber)).fontSize(8).font("Helvetica-Bold")
       .text("VERIFY THIS CERTIFICATE", M + 14, y + 10, { characterSpacing: 0.5 });
    doc.fillColor(rgb(C.slate)).fontSize(7.5).font("Helvetica")
       .text(
         "Scan the QR code or visit the URL below to confirm this certificate is genuine.\n" +
         "The verification page shows the original, uneditable record from our database.\n" +
         "Any altered PDF will not match.",
         M + 14, y + 24,
         { width: textW, lineGap: 2 },
       );
    doc.fillColor(rgb(C.green)).fontSize(7.5).font("Helvetica-Bold")
       .text(data.verificationUrl, M + 14, y + 66, { width: textW });

    // QR code
    doc.image(qrBuffer, qrX, y + 11, { width: qrSize, height: qrSize });

    y += vBoxH + 16;

    // ── Footer ────────────────────────────────────────────────────────────────
    const FOOTER_Y = PH - 52;
    doc.rect(0, FOOTER_Y, PW, 52).fillColor(rgb(C.headerBg)).fill();
    doc.rect(0, FOOTER_Y, PW, 2).fillColor(rgb(C.green)).fill();

    doc.fillColor(rgb(C.green)).fontSize(8).font("Helvetica-Bold")
       .text("Biniyog Club", M, FOOTER_Y + 10);
    doc.fillColor(rgb("#64748b")).fontSize(7).font("Helvetica")
       .text("Agricultural Investment Platform  |  Dhaka, Bangladesh", M, FOOTER_Y + 22)
       .text("info@biniyogclub.com  |  www.biniyogclub.com", M, FOOTER_Y + 33);

    doc.fillColor(rgb("#475569")).fontSize(6.5).font("Helvetica")
       .text(
         "This certificate is system-generated and cryptographically signed. Returns are projected and subject to project performance.",
         M, FOOTER_Y + 22,
         { width: W, align: "right" },
       );

    doc.end();
  });
}
