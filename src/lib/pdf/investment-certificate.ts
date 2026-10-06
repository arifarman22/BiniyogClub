/**
 * investment-certificate.ts
 *
 * Server-side PDF generation using pdfkit — works reliably on Vercel serverless.
 * Replaces @react-pdf/renderer which fails due to @react-pdf/hyphenate export issues.
 */

import PDFDocument from "pdfkit";

export interface InvestmentCertificateData {
  receiptNumber: string;
  generatedAt: string;
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
    source?: string;
  };
}

const BRAND_GREEN  = "#16a34a";
const BRAND_DARK   = "#0f172a";
const MUTED        = "#64748b";
const BORDER       = "#e2e8f0";
const BG_LIGHT     = "#f8fafc";

const RETURN_TYPE_LABELS: Record<string, string> = {
  FIXED_RETURN: "Fixed Return",
  PROFIT_SHARE: "Profit Share",
  HYBRID:       "Hybrid",
};

function fmtBdt(n: number): string {
  return `BDT ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
}

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

export async function renderInvestmentCertificate(data: InvestmentCertificateData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 48, info: {
      Title: `Investment Certificate — ${data.receiptNumber}`,
      Author: "Biniyog Club",
      Subject: "Investment Certificate",
    }});

    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = doc.page.width - 96; // usable width
    const L = 48; // left margin

    // ── Header ──────────────────────────────────────────────────────────────
    doc.fillColor(hexToRgb(BRAND_GREEN)).fontSize(22).font("Helvetica-Bold").text("Biniyog Club", L, 48);
    doc.fillColor(hexToRgb(MUTED)).fontSize(8).font("Helvetica").text("Agricultural Investment Platform", L, 74);

    // Receipt number top-right
    doc.fillColor(hexToRgb(MUTED)).fontSize(8).text("CERTIFICATE NO.", L + W - 120, 48, { width: 120, align: "right" });
    doc.fillColor(hexToRgb(BRAND_DARK)).fontSize(11).font("Helvetica-Bold").text(data.receiptNumber, L + W - 120, 60, { width: 120, align: "right" });
    doc.fillColor(hexToRgb(MUTED)).fontSize(8).font("Helvetica").text(`Issued: ${fmtDate(data.generatedAt)}`, L + W - 120, 75, { width: 120, align: "right" });

    // Header divider
    doc.moveTo(L, 92).lineTo(L + W, 92).strokeColor(hexToRgb(BRAND_GREEN)).lineWidth(2).stroke();

    // ── Title ────────────────────────────────────────────────────────────────
    doc.fillColor(hexToRgb(BRAND_DARK)).fontSize(18).font("Helvetica-Bold")
       .text("Investment Certificate", L, 108, { width: W, align: "center" });
    doc.fillColor(hexToRgb(MUTED)).fontSize(9).font("Helvetica")
       .text("This document confirms a confirmed investment on the Biniyog Club platform", L, 130, { width: W, align: "center" });

    // ── Highlight box ────────────────────────────────────────────────────────
    const hY = 155;
    doc.roundedRect(L, hY, W, 64, 6).fillColor(hexToRgb("#f0fdf4")).fill();
    doc.roundedRect(L, hY, W, 64, 6).strokeColor(hexToRgb("#bbf7d0")).lineWidth(1).stroke();

    const col = W / 3;
    const items = [
      { label: "AMOUNT INVESTED",  value: fmtBdt(data.investment.amountBdt),         sub: "Principal" },
      { label: "EXPECTED RETURN",  value: fmtBdt(data.investment.expectedReturnBdt),  sub: `${data.project.expectedReturnPct}% of principal` },
      { label: "DURATION",         value: `${data.project.durationDays} Days`,        sub: "From activation" },
    ];
    items.forEach((item, i) => {
      const x = L + col * i;
      doc.fillColor(hexToRgb(MUTED)).fontSize(7).font("Helvetica").text(item.label, x, hY + 10, { width: col, align: "center" });
      doc.fillColor(hexToRgb(BRAND_GREEN)).fontSize(13).font("Helvetica-Bold").text(item.value, x, hY + 22, { width: col, align: "center" });
      doc.fillColor(hexToRgb(MUTED)).fontSize(7).font("Helvetica").text(item.sub, x, hY + 40, { width: col, align: "center" });
    });

    // ── Section helper ───────────────────────────────────────────────────────
    let y = hY + 80;

    function section(title: string, rows: { label: string; value: string }[]) {
      doc.fillColor(hexToRgb(BRAND_GREEN)).fontSize(8).font("Helvetica-Bold")
         .text(title.toUpperCase(), L, y, { characterSpacing: 0.8 });
      y += 14;

      doc.roundedRect(L, y, W, rows.length * 22 + 12, 4).fillColor(hexToRgb(BG_LIGHT)).fill();
      doc.roundedRect(L, y, W, rows.length * 22 + 12, 4).strokeColor(hexToRgb(BORDER)).lineWidth(1).stroke();

      rows.forEach((row, i) => {
        const ry = y + 8 + i * 22;
        doc.fillColor(hexToRgb(MUTED)).fontSize(9).font("Helvetica").text(row.label, L + 12, ry);
        doc.fillColor(hexToRgb(BRAND_DARK)).fontSize(9).font("Helvetica-Bold").text(row.value, L + 12, ry, { width: W - 24, align: "right" });
        if (i < rows.length - 1) {
          doc.moveTo(L + 12, ry + 18).lineTo(L + W - 12, ry + 18).strokeColor(hexToRgb(BORDER)).lineWidth(0.5).stroke();
        }
      });

      y += rows.length * 22 + 12 + 16;
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
    projectRows.push({ label: "Return Type", value: RETURN_TYPE_LABELS[data.investment.returnType] ?? data.investment.returnType });
    section("Project Details", projectRows);

    // ── Investment Terms ─────────────────────────────────────────────────────
    const maturityDate = new Date(data.investment.activatedAt);
    maturityDate.setDate(maturityDate.getDate() + data.project.durationDays);

    section("Investment Terms", [
      { label: "Investment Date",                              value: fmtDate(data.investment.activatedAt) },
      { label: "Maturity Date",                               value: fmtDate(maturityDate.toISOString()) },
      { label: "Principal Amount",                            value: fmtBdt(data.investment.amountBdt) },
      { label: `Expected Return (${data.project.expectedReturnPct}%)`, value: fmtBdt(data.investment.expectedReturnBdt) },
      { label: "Total Expected Value",                        value: fmtBdt(data.investment.amountBdt + data.investment.expectedReturnBdt) },
    ]);

    // ── Footer ───────────────────────────────────────────────────────────────
    const fY = doc.page.height - 80;
    doc.moveTo(L, fY).lineTo(L + W, fY).strokeColor(hexToRgb(BORDER)).lineWidth(1).stroke();

    doc.fillColor(hexToRgb(BRAND_GREEN)).fontSize(8).font("Helvetica-Bold").text("Biniyog Club", L, fY + 10);
    doc.fillColor(hexToRgb(MUTED)).fontSize(7.5).font("Helvetica")
       .text("info@biniyogclub.com  |  www.biniyogclub.com", L, fY + 22)
       .text("This certificate is system-generated and valid without a physical signature.", L, fY + 34)
       .text("Returns are projected and subject to project performance.", L, fY + 46);

    // CONFIRMED badge
    doc.roundedRect(L + W - 80, fY + 10, 80, 22, 4).fillColor(hexToRgb("#dcfce7")).fill();
    doc.fillColor(hexToRgb(BRAND_GREEN)).fontSize(8).font("Helvetica-Bold")
       .text("CONFIRMED", L + W - 80, fY + 17, { width: 80, align: "center" });

    doc.end();
  });
}
