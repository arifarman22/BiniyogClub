/**
 * investment-certificate.ts
 *
 * Tamper-evident investment certificate — pdfkit + QR code.
 * Formal single-page A4 layout: framed border, certificate statement,
 * key figures, investor / investment details and a verification block.
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
    /** When both are set the project pays a range, not a fixed rate. */
    returnPctMin?: number | null;
    returnPctMax?: number | null;
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

// ── Palette (matches the site's deep-green brand) ─────────────────────────────
const C = {
  brand:     "#0d4a42",
  brandDark: "#082f2a",
  brandTint: "#eef6f4",
  gold:      "#b08d4a",
  goldSoft:  "#e9dcc0",
  ink:       "#111827",
  body:      "#374151",
  muted:     "#6b7280",
  rule:      "#e5e7eb",
  white:     "#ffffff",
};

const RETURN_LABELS: Record<string, string> = {
  FIXED_RETURN: "Fixed Return",
  PROFIT_SHARE: "Profit Share",
  HYBRID:       "Hybrid",
};

function fmtBdt(n: number): string {
  return `BDT ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtPct(n: number): string {
  return `${Number(n.toFixed(2))}%`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
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
  const qrBuffer = await QRCode.toBuffer(data.verificationUrl, {
    type: "png",
    width: 220,
    margin: 0,
    color: { dark: C.brandDark, light: "#ffffff" },
  });

  const logoPath = getLogoPath();

  // ── Derived figures ──────────────────────────────────────────────────────────
  const { amountBdt } = data.investment;
  const { returnPctMin, returnPctMax } = data.project;
  const isRange = returnPctMin != null && returnPctMax != null && returnPctMin > 0 && returnPctMax > 0;
  const retMin = isRange ? Math.round(amountBdt * returnPctMin!) / 100 : data.investment.expectedReturnBdt;
  const retMax = isRange ? Math.round(amountBdt * returnPctMax!) / 100 : null;
  const rateLabel = isRange ? `${fmtPct(returnPctMin!)} – ${fmtPct(returnPctMax!)}` : fmtPct(data.project.expectedReturnPct);
  const returnLabel = retMax != null ? `${fmtBdt(retMin)} – ${fmtBdt(retMax)}` : fmtBdt(retMin);
  const totalLabel = retMax != null
    ? `${fmtBdt(amountBdt + retMin)} – ${fmtBdt(amountBdt + retMax)}`
    : fmtBdt(amountBdt + retMin);

  const maturity = new Date(data.investment.activatedAt);
  maturity.setDate(maturity.getDate() + data.project.durationDays);

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
    const M  = 58;               // content margin
    const W  = PW - M * 2;

    const hRule = (y: number, color = C.rule, width = 0.6, x1 = M, x2 = M + W) =>
      doc.moveTo(x1, y).lineTo(x2, y).strokeColor(color).lineWidth(width).stroke();

    // ── Frame ─────────────────────────────────────────────────────────────────
    doc.rect(18, 18, PW - 36, PH - 36).lineWidth(2).strokeColor(C.brand).stroke();
    doc.rect(24, 24, PW - 48, PH - 48).lineWidth(0.6).strokeColor(C.gold).stroke();
    // Corner ornaments
    for (const [cx, cy] of [[24, 24], [PW - 24, 24], [24, PH - 24], [PW - 24, PH - 24]]) {
      doc.rect(cx - 3, cy - 3, 6, 6).fillColor(C.gold).fill();
    }

    // Watermark
    if (logoPath) {
      try {
        doc.save().opacity(0.035);
        doc.image(logoPath, PW / 2 - 150, PH / 2 - 130, { width: 300, height: 300 });
        doc.restore();
      } catch { /* skip watermark */ }
    }

    // ── Letterhead ────────────────────────────────────────────────────────────
    let y = 50;
    const LOGO = 38;
    let nameX = M;
    if (logoPath) {
      try {
        doc.image(logoPath, M, y, { width: LOGO, height: LOGO });
        nameX = M + LOGO + 10;
      } catch { /* text-only letterhead */ }
    }
    doc.fillColor(C.brand).font("Helvetica-Bold").fontSize(15)
       .text("BINIYOG CLUB", nameX, y + 6, { characterSpacing: 1.6, lineBreak: false });
    doc.fillColor(C.muted).font("Helvetica").fontSize(7.5)
       .text("A Mariners Group Investment Platform", nameX, y + 25, { characterSpacing: 0.4, lineBreak: false });

    const metaW = 190;
    const metaX = M + W - metaW;
    const metaRow = (label: string, value: string, ry: number) => {
      doc.fillColor(C.muted).font("Helvetica").fontSize(6.5)
         .text(label, metaX, ry, { width: metaW, align: "right", characterSpacing: 0.8 });
      doc.fillColor(C.ink).font("Helvetica-Bold").fontSize(8.5)
         .text(value, metaX, ry + 8, { width: metaW, align: "right" });
    };
    metaRow("CERTIFICATE NO.", data.receiptNumber, y + 1);
    metaRow("DATE OF ISSUE", fmtDate(data.generatedAt), y + 22);

    y += LOGO + 16;
    hRule(y, C.gold, 0.8);
    hRule(y + 2.5, C.gold, 0.3);

    // ── Title ─────────────────────────────────────────────────────────────────
    y += 26;
    doc.fillColor(C.gold).font("Helvetica-Bold").fontSize(8)
       .text("OFFICIAL RECORD", M, y, { width: W, align: "center", characterSpacing: 3 });
    y += 16;
    doc.fillColor(C.brandDark).font("Times-Bold").fontSize(30)
       .text("Certificate of Investment", M, y, { width: W, align: "center" });
    y += 44;

    // ── Statement ─────────────────────────────────────────────────────────────
    doc.fillColor(C.body).font("Times-Italic").fontSize(12)
       .text("This is to certify that", M, y, { width: W, align: "center" });
    y += 22;
    doc.fillColor(C.ink).font("Times-Bold").fontSize(24)
       .text(data.investor.name, M, y, { width: W, align: "center" });
    y += doc.heightOfString(data.investor.name, { width: W }) + 6;
    hRule(y, C.gold, 0.8, PW / 2 - 110, PW / 2 + 110);
    y += 14;

    const statement =
      `has invested ${fmtBdt(amountBdt)} in "${data.project.title}", ` +
      `a project administered through Biniyog Club, with effect from ${fmtDate(data.investment.activatedAt)} ` +
      `for a term of ${data.project.durationDays} days.`;
    doc.fillColor(C.body).font("Times-Roman").fontSize(11.5);
    doc.text(statement, M + 24, y, { width: W - 48, align: "center", lineGap: 3 });
    y += doc.heightOfString(statement, { width: W - 48, lineGap: 3 }) + 22;

    // ── Key figures ───────────────────────────────────────────────────────────
    const FIG_H = 74;
    doc.rect(M, y, W, FIG_H).fillColor(C.brandTint).fill();
    doc.rect(M, y, W, 2).fillColor(C.brand).fill();
    const col = W / 3;
    const figures = [
      { label: "PRINCIPAL", value: fmtBdt(amountBdt), sub: "Amount invested" },
      {
        label: "EXPECTED RETURN",
        value: retMax != null ? `${fmtBdt(retMin)} –\n${fmtBdt(retMax)}` : fmtBdt(retMin),
        sub: `${rateLabel} of principal`,
      },
      { label: "MATURITY DATE", value: fmtDate(maturity.toISOString()), sub: `${data.project.durationDays}-day term` },
    ];
    figures.forEach((f, i) => {
      const x = M + col * i;
      if (i > 0) {
        doc.moveTo(x, y + 14).lineTo(x, y + FIG_H - 12).strokeColor(C.goldSoft).lineWidth(0.8).stroke();
      }
      const multi = f.value.includes("\n");
      doc.fillColor(C.muted).font("Helvetica").fontSize(6.5)
         .text(f.label, x + 8, y + 13, { width: col - 16, align: "center", characterSpacing: 1 });
      doc.fillColor(C.brandDark).font("Helvetica-Bold").fontSize(multi ? 10 : 12.5)
         .text(f.value, x + 8, y + (multi ? 25 : 29), { width: col - 16, align: "center", lineGap: 1 });
      doc.fillColor(C.muted).font("Helvetica").fontSize(7)
         .text(f.sub, x + 8, y + FIG_H - 18, { width: col - 16, align: "center" });
    });
    y += FIG_H + 24;

    // ── Details (two columns) ─────────────────────────────────────────────────
    const GAP = 26;
    const colW = (W - GAP) / 2;

    function detailColumn(x: number, startY: number, title: string, rows: { label: string; value: string }[], labelW: number) {
      let cy = startY;
      doc.fillColor(C.brand).font("Helvetica-Bold").fontSize(7.5)
         .text(title.toUpperCase(), x, cy, { characterSpacing: 1.4, lineBreak: false });
      cy += 13;
      hRule(cy, C.brand, 0.8, x, x + colW);
      cy += 8;
      for (const row of rows) {
        const vw = colW - labelW;
        // Shrink unbreakable values (e.g. long emails) to fit instead of splitting mid-word.
        let size = 8;
        if (!/s/.test(row.value)) {
          while (size > 6 && doc.font("Helvetica-Bold").fontSize(size).widthOfString(row.value) > vw) size -= 0.25;
        }
        doc.fillColor(C.muted).font("Helvetica").fontSize(8)
           .text(row.label, x, cy, { width: labelW - 6 });
        doc.fillColor(C.ink).font("Helvetica-Bold").fontSize(size)
           .text(row.value, x + labelW, cy + (8 - size) / 2, { width: vw, align: "right" });
        const h = Math.max(
          doc.font("Helvetica-Bold").fontSize(size).heightOfString(row.value, { width: vw }),
          doc.font("Helvetica").fontSize(8).heightOfString(row.label, { width: labelW - 6 }),
        );
        cy += h + 6;
        hRule(cy - 3, C.rule, 0.4, x, x + colW);
      }
      return cy;
    }

    const investorRows = [
      { label: "Name", value: data.investor.name },
      { label: "Email", value: data.investor.email },
    ];
    if (data.investor.phone) investorRows.push({ label: "Phone", value: data.investor.phone });
    investorRows.push({ label: "Investment ID", value: data.investmentId.slice(0, 8).toUpperCase() });

    const investmentRows = [
      { label: "Project", value: data.project.title },
    ];
    if (data.project.location) investmentRows.push({ label: "Location", value: data.project.location });
    investmentRows.push(
      { label: "Return type", value: RETURN_LABELS[data.investment.returnType] ?? data.investment.returnType },
      { label: isRange ? "Return range" : "Return rate", value: rateLabel },
      { label: "Effective date", value: fmtDate(data.investment.activatedAt) },
      { label: "Maturity date", value: fmtDate(maturity.toISOString()) },
      { label: "Expected return", value: returnLabel },
      { label: "Total expected", value: totalLabel },
    );

    const leftEnd = detailColumn(M, y, "Investor", investorRows, 70);
    const rightEnd = detailColumn(M + colW + GAP, y, "Investment", investmentRows, 82);
    y = Math.max(leftEnd, rightEnd) + 18;

    // ── Verification + authorisation ──────────────────────────────────────────
    // Anchor the verification block just above the footer.
    y = Math.max(y, PH - 70 - 106);

    const QR = 70;
    doc.rect(M, y, QR + 10, QR + 10).lineWidth(0.6).strokeColor(C.rule).stroke();
    doc.image(qrBuffer, M + 5, y + 5, { width: QR, height: QR });

    const ax = M + W - 150;
    const vx = M + QR + 22;
    const vw = ax - vx - 20;
    doc.fillColor(C.brand).font("Helvetica-Bold").fontSize(7.5)
       .text("VERIFY AUTHENTICITY", vx, y + 4, { characterSpacing: 1.2 });
    doc.fillColor(C.body).font("Helvetica").fontSize(7.5)
       .text(
         "Scan the QR code or visit the address below. The verification page shows the original record held by Biniyog Club; an altered document will not match.",
         vx, y + 18, { width: vw, lineGap: 1.5 },
       );
    doc.fillColor(C.brand).font("Helvetica-Bold").fontSize(7.5)
       .text(data.verificationUrl, vx, y + 58, { width: vw });

    // Authorisation (right)
    doc.fillColor(C.brandDark).font("Times-BoldItalic").fontSize(14)
       .text("Biniyog Club", ax, y + 30, { width: 150, align: "center" });
    hRule(y + 50, C.ink, 0.6, ax, ax + 150);
    doc.fillColor(C.muted).font("Helvetica").fontSize(7)
       .text("Authorised on behalf of Biniyog Club", ax, y + 55, { width: 150, align: "center" })
       .text("Electronically issued — no signature required", ax, y + 65, { width: 150, align: "center" });

    // ── Footer ────────────────────────────────────────────────────────────────
    const FY = PH - 70;
    hRule(FY, C.gold, 0.5);
    doc.fillColor(C.muted).font("Helvetica").fontSize(6.5)
       .text(
         "Returns shown are projections based on the project's stated rate and are subject to project performance. " +
         "This certificate is system-generated and cryptographically signed; it is not a negotiable instrument.",
         M, FY + 8, { width: W, align: "center", lineGap: 1.5 },
       );
    doc.fillColor(C.brand).font("Helvetica-Bold").fontSize(7)
       .text("Biniyog Club  ·  Dhaka, Bangladesh  ·  info@biniyogclub.com  ·  www.biniyogclub.com", M, FY + 30, {
         width: W, align: "center", characterSpacing: 0.3,
       });

    doc.end();
  });
}
