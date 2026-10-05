/**
 * investment-certificate.tsx
 *
 * Server-side PDF generation for investment certificates.
 * Uses @react-pdf/renderer — runs only on the server (Node.js).
 */

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
  Font,
} from "@react-pdf/renderer";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Styles ───────────────────────────────────────────────────────────────────

const BRAND_GREEN = "#16a34a";
const BRAND_DARK = "#0f172a";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";
const BG_LIGHT = "#f8fafc";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 48,
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 32,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: BRAND_GREEN,
  },
  brandBlock: {
    flexDirection: "column",
  },
  brandName: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: BRAND_GREEN,
    letterSpacing: 0.5,
  },
  brandTagline: {
    fontSize: 8,
    color: MUTED,
    marginTop: 2,
    letterSpacing: 0.3,
  },
  receiptBlock: {
    alignItems: "flex-end",
  },
  receiptLabel: {
    fontSize: 8,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  receiptNumber: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: BRAND_DARK,
    marginTop: 2,
  },
  receiptDate: {
    fontSize: 8,
    color: MUTED,
    marginTop: 3,
  },
  // Title
  titleSection: {
    alignItems: "center",
    marginBottom: 28,
  },
  certificateTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: BRAND_DARK,
    letterSpacing: 0.5,
  },
  certificateSubtitle: {
    fontSize: 9,
    color: MUTED,
    marginTop: 4,
    letterSpacing: 0.3,
  },
  // Sections
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: BRAND_GREEN,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  card: {
    backgroundColor: BG_LIGHT,
    borderRadius: 6,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  rowLast: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  label: {
    fontSize: 9,
    color: MUTED,
    flex: 1,
  },
  value: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: BRAND_DARK,
    flex: 2,
    textAlign: "right",
  },
  // Highlight box
  highlightBox: {
    backgroundColor: "#f0fdf4",
    borderRadius: 6,
    padding: 16,
    borderWidth: 1,
    borderColor: "#bbf7d0",
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  highlightItem: {
    alignItems: "center",
  },
  highlightLabel: {
    fontSize: 8,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  highlightValue: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: BRAND_GREEN,
  },
  highlightSub: {
    fontSize: 8,
    color: MUTED,
    marginTop: 2,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    marginVertical: 16,
  },
  // Footer
  footer: {
    marginTop: 32,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  footerLeft: {
    flex: 1,
  },
  footerText: {
    fontSize: 7.5,
    color: MUTED,
    lineHeight: 1.5,
  },
  footerBrand: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: BRAND_GREEN,
    marginBottom: 3,
  },
  badge: {
    backgroundColor: "#dcfce7",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-end",
  },
  badgeText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: BRAND_GREEN,
  },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RETURN_TYPE_LABELS: Record<string, string> = {
  FIXED_RETURN: "Fixed Return",
  PROFIT_SHARE: "Profit Share",
  HYBRID: "Hybrid",
};

const CATEGORY_LABELS: Record<string, string> = {
  CROP_FARMING: "Crop Farming",
  LIVESTOCK: "Livestock",
  AQUACULTURE: "Aquaculture",
  POULTRY: "Poultry",
  DAIRY: "Dairy",
  HORTICULTURE: "Horticulture",
  AGRO_PROCESSING: "Agro Processing",
  OTHER: "Other",
};

function fmtBdt(n: number): string {
  return `BDT ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ─── PDF Document ─────────────────────────────────────────────────────────────

function InvestmentCertificateDocument({ data }: { data: InvestmentCertificateData }) {
  const maturityDate = new Date(data.investment.activatedAt);
  maturityDate.setDate(maturityDate.getDate() + data.project.durationDays);

  return (
    <Document
      title={`Investment Certificate — ${data.receiptNumber}`}
      author="Biniyog Club"
      subject="Investment Certificate"
      creator="Biniyog Club Platform"
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandBlock}>
            <Text style={styles.brandName}>Biniyog Club</Text>
            <Text style={styles.brandTagline}>Agricultural Investment Platform</Text>
          </View>
          <View style={styles.receiptBlock}>
            <Text style={styles.receiptLabel}>Certificate No.</Text>
            <Text style={styles.receiptNumber}>{data.receiptNumber}</Text>
            <Text style={styles.receiptDate}>Issued: {fmtDate(data.generatedAt)}</Text>
          </View>
        </View>

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.certificateTitle}>Investment Certificate</Text>
          <Text style={styles.certificateSubtitle}>
            This document confirms a confirmed investment on the Biniyog Club platform
          </Text>
        </View>

        {/* Highlight: key numbers */}
        <View style={styles.highlightBox}>
          <View style={styles.highlightItem}>
            <Text style={styles.highlightLabel}>Amount Invested</Text>
            <Text style={styles.highlightValue}>{fmtBdt(data.investment.amountBdt)}</Text>
            <Text style={styles.highlightSub}>Principal</Text>
          </View>
          <View style={styles.highlightItem}>
            <Text style={styles.highlightLabel}>Expected Return</Text>
            <Text style={styles.highlightValue}>{fmtBdt(data.investment.expectedReturnBdt)}</Text>
            <Text style={styles.highlightSub}>{data.project.expectedReturnPct}% of principal</Text>
          </View>
          <View style={styles.highlightItem}>
            <Text style={styles.highlightLabel}>Duration</Text>
            <Text style={styles.highlightValue}>{data.project.durationDays}</Text>
            <Text style={styles.highlightSub}>Days</Text>
          </View>
        </View>

        {/* Investor Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Investor Details</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>Full Name</Text>
              <Text style={styles.value}>{data.investor.name}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Email Address</Text>
              <Text style={styles.value}>{data.investor.email}</Text>
            </View>
            {data.investor.phone && (
              <View style={styles.rowLast}>
                <Text style={styles.label}>Phone Number</Text>
                <Text style={styles.value}>{data.investor.phone}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Project Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Project Details</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>Project Title</Text>
              <Text style={styles.value}>{data.project.title}</Text>
            </View>
            {data.project.category && (
              <View style={styles.row}>
                <Text style={styles.label}>Category</Text>
                <Text style={styles.value}>
                  {CATEGORY_LABELS[data.project.category] ?? data.project.category}
                </Text>
              </View>
            )}
            {data.project.location && (
              <View style={styles.row}>
                <Text style={styles.label}>Location</Text>
                <Text style={styles.value}>{data.project.location}</Text>
              </View>
            )}
            <View style={styles.rowLast}>
              <Text style={styles.label}>Return Type</Text>
              <Text style={styles.value}>
                {RETURN_TYPE_LABELS[data.investment.returnType] ?? data.investment.returnType}
              </Text>
            </View>
          </View>
        </View>

        {/* Investment Terms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Investment Terms</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>Investment Date</Text>
              <Text style={styles.value}>{fmtDate(data.investment.activatedAt)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Maturity Date</Text>
              <Text style={styles.value}>{fmtDate(maturityDate.toISOString())}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Principal Amount</Text>
              <Text style={styles.value}>{fmtBdt(data.investment.amountBdt)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Expected Return ({data.project.expectedReturnPct}%)</Text>
              <Text style={styles.value}>{fmtBdt(data.investment.expectedReturnBdt)}</Text>
            </View>
            <View style={styles.rowLast}>
              <Text style={styles.label}>Total Expected Value</Text>
              <Text style={styles.value}>
                {fmtBdt(data.investment.amountBdt + data.investment.expectedReturnBdt)}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <Text style={styles.footerBrand}>Biniyog Club</Text>
            <Text style={styles.footerText}>
              info@biniyogclub.com  |  www.biniyogclub.com
            </Text>
            <Text style={styles.footerText}>
              This certificate is system-generated and valid without a physical signature.
            </Text>
            <Text style={styles.footerText}>
              Returns are projected and subject to project performance.
            </Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>CONFIRMED</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

// ─── Export: render to Buffer ─────────────────────────────────────────────────

export async function renderInvestmentCertificate(
  data: InvestmentCertificateData,
): Promise<Buffer> {
  const buffer = await renderToBuffer(<InvestmentCertificateDocument data={data} />);
  return Buffer.from(buffer);
}
