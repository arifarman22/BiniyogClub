/**
 * investment-certificate.ts
 *
 * Tamper-evident investment receipt using pdfkit + QR code.
 *
 * Security model:
 *  - A HMAC-SHA256 hash is computed over immutable investment fields
 *    (receiptNumber, investmentId, amountBdt, activatedAt, investorEmail)
 *    and stored in the Document.verificationHash column.
 *  - The receipt number doubles as the public verification code.
 *  - A QR code pointing to /verify/[receiptNumber] is embedded in the PDF.
 *  - Anyone can visit that URL to confirm the receipt is genuine — the server
 *    recomputes the hash and compares it against the stored value.
 *  - Editing any field in the PDF does NOT change the DB record, so
 *    verification will always show the original, unaltered values.
 */

import PDFDocument from "pdfkit";
import * as QRCode from "qrcode";

export interface InvestmentCertificateData {
  receiptNumber: string;
  investmentId: string;
  generatedAt: string;
  verificationUrl: string; // e.g. https://biniyogclub.com/verify/BC-XXXXX
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

// ── Palette ──────────────────────────────────────────────────────────────────
const GREEN   = "#16a34a";
const DARK    = "#0f172a";
const MUTED   = "#64748b";
const BORDER  = "#e2e8f0";
const BG      = "#f8fafc";
const GREEN_BG = "#f0fdf4";
const GREEN_BD = "#bbf7d0";
const AMBER   = "#d97706";
const AMBER_BG = "#fffbeb";
const AMBER_BD = "#fde68a";

const RETURN_LABELS: Record<string, string> = {
  FIXED_RETURN: "Fixed Return",
  PROFIT_SHARE: "Profit Share",
  HYBRID:       "Hybrid",
};

function rgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function fmtBdt(n: number): string {
  return `BDT ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
}

export async function renderInvestmentCertificate(
  data: InvestmentCertificateData,
): Promise<Buffer> {
  // Generate QR code as PNG buffer before opening the PDF stream
  const qrBuffer = await QRCode.toBuffer(data.verificationUrl, {
    type: "png",
    width: 120,
    margin: 1,
    color: { dark: "#0f172a", light: "#ffffff" },
  });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 48,
      info: {
        Title: `Investment Certificate — ${data.receiptNumber}`,
        Author: "Biniyog Club",
        Subject: "Investment Certificate",
        Keywords: `receipt,investment,${data.receiptNumber}`,
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = doc.page.width - 96;
    const L = 48;

    // ── Header bar ───────────────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 88).fillColor(rgb(DARK)).fill();

    doc.fillColor(rgb(GREEN)).fontSize(22).font("Helvetica-Bold")
       .text("Biniyog Club", L, 22);
    doc.fillColor([255, 255, 255]).fontSize(8).font("Helvetica")
       .text("Agricultural Investment Platform", L, 46);

    // Receipt number top-right in header
    doc.fillColor([200, 200, 200]).fontSize(7).font("Helvetica")
       .text("CERTIFICATE NO.", L + W - 130, 22, { width: 130, align: "right" });
    doc.fillColor([255, 255, 255]).fontSize(12).font("Helvetica-Bold")
       .text(data.receiptNumber, L + W - 130, 34, { width: 130, align: "right" });
    doc.fillColor([180, 180, 180]).fontSize(7).font("Helvetica")
       .text(`Issued: ${fmtDate(data.generatedAt)}`, L + W - 130, 52, { width: 130, align: "right" });

    // ── Title ────────────────────────────────────────────────────────────────
    doc.fillColor(rgb(DARK)).fontSize(17).font("Helvetica-Bold")
       .text("Investment Certificate", L, 108, { width: W, align: "center" });
    doc.fillColor(rgb(MUTED)).fontSize(8.5).font("Helvetica")
       .text("This document confirms a verified investment on the Biniyog Club platform.", L, 130, { width: W, align: "center" });

    // ── Highlight box (3 key figures) ────────────────────────────────────────
    const hY = 152;
    doc.roundedRect(L, hY, W, 66, 6).fillColor(rgb(GREEN_BG)).fill();
    doc.roundedRect(L, hY, W, 66, 6).strokeColor(rgb(GREEN_BD)).lineWidth(1).stroke();

    const col = W / 3;
    const maturityDate = new Date(data.investment.activatedAt);
    maturityDate.setDate(maturityDate.getDate() + data.project.durationDays);

    const highlights = [
      { label: "AMOUNT INVESTED",  value: fmtBdt(data.investment.amountBdt),        sub: "Principal" },
      { label: "EXPECTED RETURN",  value: fmtBdt(data.investment.expectedReturnBdt), sub: `${data.project.expectedReturnPct}% of principal` },
      { label: "MATURITY DATE",    value: fmtDate(maturityDate.toISOString()),        sub: `${data.project.durationDays}-day term` },
    ];
    highlights.forEach((item, i) => {
      const x = L + col * i;
      doc.fillColor(rgb(MUTED)).fontSize(7).font("Helvetica")
         .text(item.label, x, hY + 10, { width: col, align: "center" });
      doc.fillColor(rgb(GREEN)).fontSize(12).font("Helvetica-Bold")
         .text(item.value, x, hY + 22, { width: col, align: "center" });
      doc.fillColor(rgb(MUTED)).fontSize(7).font("Helvetica")
         .text(item.sub, x, hY + 40, { width: col, align: "center" });
    });

    // ── Section helper ───────────────────────────────────────────────────────
    let y = hY + 82;

    function section(title: string, rows: { label: string; value: string }[]) {
      doc.fillColor(rgb(GREEN)).fontSize(7.5).font("Helvetica-Bold")
         .text(title.toUpperCase(), L, y, { characterSpacing: 0.8 });
      y += 13;

      const h = rows.length * 22 + 12;
      doc.roundedRect(L, y, W, h, 4).fillColor(rgb(BG)).fill();
      doc.roundedRect(L, y, W, h, 4).strokeColor(rgb(BORDER)).lineWidth(0.8).stroke();

      rows.forEach((row, i) => {
        const ry = y + 8 + i * 22;
        doc.fillColor(rgb(MUTED)).fontSize(9).font("Helvetica").text(row.label, L + 12, ry);
        doc.fillColor(rgb(DARK)).fontSize(9).font("Helvetica-Bold")
           .text(row.value, L + 12, ry, { width: W - 24, align: "right" });
        if (i < rows.length - 1) {
          doc.moveTo(L + 12, ry + 18).lineTo(L + W - 12, ry + 18)
             .strokeColor(rgb(BORDER)).lineWidth(0.5).stroke();
        }
      });

      y += h + 14;
    }

    // ── Investor Details ─────────────────────────────────────────────────────
    const investorRows: { label: string; value: string }[] = [
      { label: "Full Name",     value: data.investor.name },
      { label: "Email Address", value: data.investor.email },
    ];
    if (data.investor.phone) investorRows.push({ label: "Phone Number", value: data.investor.phone });
    section("Investor Details", investorRows);

    // ── Project Details ──────────────────────────────────────────────────────
    const projectRows: { label: string; value: string }[] = [
      { label: "Project Title", value: data.project.title },
    ];
    if (data.project.location) projectRows.push({ label: "Location", value: data.project.location });
    projectRows.push({ label: "Return Type", value: RETURN_LABELS[data.investment.returnType] ?? data.investment.returnType });
    section("Project Details", projectRows);

    // ── Investment Terms ─────────────────────────────────────────────────────
    section("Investment Terms", [
      { label: "Investment Date",                                        value: fmtDate(data.investment.activatedAt) },
      { label: "Maturity Date",                                          value: fmtDate(maturityDate.toISOString()) },
      { label: "Principal Amount",                                       value: fmtBdt(data.investment.amountBdt) },
      { label: `Expected Return (${data.project.expectedReturnPct}%)`,  value: fmtBdt(data.investment.expectedReturnBdt) },
      { label: "Total Expected Value",                                   value: fmtBdt(data.investment.amountBdt + data.investment.expectedReturnBdt) },
    ]);

    // ── Verification box ─────────────────────────────────────────────────────
    // This is the tamper-evidence section. The QR code links to the live
    // verification page which shows the original, uneditable DB record.
    const vBoxH = 90;
    doc.roundedRect(L, y, W, vBoxH, 6).fillColor(rgb(AMBER_BG)).fill();
    doc.roundedRect(L, y, W, vBoxH, 6).strokeColor(rgb(AMBER_BD)).lineWidth(1).stroke();

    // Left: text
    const textX = L + 12;
    const qrSize = 68;
    const qrX = L + W - qrSize - 12;

    doc.fillColor(rgb(AMBER)).fontSize(8).font("Helvetica-Bold")
       .text("🔒  VERIFY THIS CERTIFICATE", textX, y + 10, { characterSpacing: 0.5 });
    doc.fillColor(rgb(DARK)).fontSize(8).font("Helvetica")
       .text(
         "Scan the QR code or visit the URL below to confirm this certificate\n" +
         "is genuine. The verification page shows the original, uneditable\n" +
         "record from our database — any altered PDF will not match.",
         textX, y + 24,
         { width: qrX - textX - 12, lineGap: 2 },
       );

    // Verification URL
    doc.fillColor(rgb(GREEN)).fontSize(7.5).font("Helvetica-Bold")
       .text(data.verificationUrl, textX, y + 68, { width: qrX - textX - 12 });

    // Right: QR code image
    doc.image(qrBuffer, qrX, y + 11, { width: qrSize, height: qrSize });

    y += vBoxH + 16;

    // ── Footer ───────────────────────────────────────────────────────────────
    const fY = doc.page.height - 72;
    doc.moveTo(L, fY).lineTo(L + W, fY).strokeColor(rgb(BORDER)).lineWidth(0.8).stroke();

    doc.fillColor(rgb(GREEN)).fontSize(8).font("Helvetica-Bold").text("Biniyog Club", L, fY + 10);
    doc.fillColor(rgb(MUTED)).fontSize(7.5).font("Helvetica")
       .text("info@biniyogclub.com  |  www.biniyogclub.com", L, fY + 22)
       .text("This certificate is system-generated. Returns are projected and subject to project performance.", L, fY + 34);

    // CONFIRMED badge
    doc.roundedRect(L + W - 82, fY + 8, 82, 24, 4).fillColor(rgb(GREEN_BG)).fill();
    doc.roundedRect(L + W - 82, fY + 8, 82, 24, 4).strokeColor(rgb(GREEN_BD)).lineWidth(0.8).stroke();
    doc.fillColor(rgb(GREEN)).fontSize(8).font("Helvetica-Bold")
       .text("✓  CONFIRMED", L + W - 82, fY + 16, { width: 82, align: "center" });

    doc.end();
  });
}
