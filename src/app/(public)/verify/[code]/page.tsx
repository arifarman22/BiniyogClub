import { db } from "@/lib/db/prisma";
import { verifyReceipt } from "@/lib/pdf/verify";
import { CheckCircle, XCircle, ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ code: string }>;
}

async function getVerificationResult(code: string) {
  // Find the investment by receipt number
  const investment = await db.investment.findUnique({
    where: { receiptNumber: code },
    select: {
      id: true,
      amountBdt: true,
      expectedReturnBdt: true,
      returnType: true,
      activatedAt: true,
      createdAt: true,
      receiptNumber: true,
      status: true,
      project: {
        select: { title: true, expectedReturnPct: true, durationDays: true, location: true },
      },
      investorProfile: {
        select: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  if (!investment) return { valid: false, reason: "not_found" as const };
  if (investment.status !== "ACTIVE" && investment.status !== "MATURED" && investment.status !== "COMPLETED") {
    return { valid: false, reason: "not_active" as const };
  }

  // Find the document with the stored hash
  const doc = await db.document.findFirst({
    where: {
      category: "INVESTMENT_RECEIPT",
      ownerUserId: investment.investorProfile.user.id,
      deletedAt: null,
    },
    select: { verificationHash: true, generatedAt: true },
  });

  if (!doc?.verificationHash) return { valid: false, reason: "no_hash" as const };

  const activatedAt = (investment.activatedAt ?? investment.createdAt).toISOString();
  const isValid = verifyReceipt(
    {
      receiptNumber:  investment.receiptNumber!,
      investmentId:   investment.id,
      amountBdt:      Number(investment.amountBdt),
      activatedAt,
      investorEmail:  investment.investorProfile.user.email,
    },
    doc.verificationHash,
  );

  if (!isValid) return { valid: false, reason: "hash_mismatch" as const };

  const maturityDate = new Date(activatedAt);
  maturityDate.setDate(maturityDate.getDate() + investment.project.durationDays);

  return {
    valid: true,
    generatedAt: doc.generatedAt?.toISOString(),
    data: {
      receiptNumber:     investment.receiptNumber!,
      investorName:      investment.investorProfile.user.name ?? "—",
      projectTitle:      investment.project.title,
      location:          investment.project.location,
      amountBdt:         Number(investment.amountBdt),
      expectedReturnBdt: Number(investment.expectedReturnBdt),
      returnPct:         Number(investment.project.expectedReturnPct),
      activatedAt,
      maturityDate:      maturityDate.toISOString(),
      status:            investment.status,
    },
  };
}

function fmtBdt(n: number) {
  return `BDT ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
}

export default async function VerifyPage({ params }: Props) {
  const { code } = await params;
  const result = await getVerificationResult(code.toUpperCase());

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-sm text-slate-500 font-medium tracking-wide uppercase">Biniyog Club</p>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Certificate Verification</h1>
          <p className="text-sm text-slate-500 mt-1">
            Verifying: <span className="font-mono font-semibold text-slate-700">{code.toUpperCase()}</span>
          </p>
        </div>

        {result.valid ? (
          <div className="bg-white rounded-2xl border border-green-200 shadow-sm overflow-hidden">
            {/* Valid banner */}
            <div className="bg-green-50 border-b border-green-200 px-6 py-4 flex items-center gap-3">
              <CheckCircle className="text-green-600 shrink-0" size={24} />
              <div>
                <p className="font-semibold text-green-800">Certificate Verified</p>
                <p className="text-xs text-green-600 mt-0.5">
                  This certificate is authentic and matches our database records.
                </p>
              </div>
            </div>

            {/* Data */}
            <div className="px-6 py-5 space-y-3">
              {[
                { label: "Receipt Number",    value: result.data!.receiptNumber },
                { label: "Investor Name",     value: result.data!.investorName },
                { label: "Project",           value: result.data!.projectTitle },
                ...(result.data!.location ? [{ label: "Location", value: result.data!.location }] : []),
                { label: "Amount Invested",   value: fmtBdt(result.data!.amountBdt) },
                { label: `Expected Return (${result.data!.returnPct}%)`, value: fmtBdt(result.data!.expectedReturnBdt) },
                { label: "Total Expected",    value: fmtBdt(result.data!.amountBdt + result.data!.expectedReturnBdt) },
                { label: "Investment Date",   value: fmtDate(result.data!.activatedAt) },
                { label: "Maturity Date",     value: fmtDate(result.data!.maturityDate) },
                { label: "Status",            value: result.data!.status },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-start gap-4 py-2 border-b border-slate-100 last:border-0">
                  <span className="text-sm text-slate-500 shrink-0">{label}</span>
                  <span className="text-sm font-semibold text-slate-900 text-right">{value}</span>
                </div>
              ))}
            </div>

            {result.generatedAt && (
              <div className="px-6 pb-4">
                <p className="text-xs text-slate-400 text-center">
                  Certificate generated on {fmtDate(result.generatedAt)}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden">
            <div className="bg-red-50 border-b border-red-200 px-6 py-4 flex items-center gap-3">
              {result.reason === "hash_mismatch" ? (
                <ShieldAlert className="text-red-600 shrink-0" size={24} />
              ) : (
                <XCircle className="text-red-600 shrink-0" size={24} />
              )}
              <div>
                <p className="font-semibold text-red-800">
                  {result.reason === "hash_mismatch"
                    ? "Certificate Tampered"
                    : result.reason === "not_found"
                      ? "Certificate Not Found"
                      : "Certificate Invalid"}
                </p>
                <p className="text-xs text-red-600 mt-0.5">
                  {result.reason === "hash_mismatch"
                    ? "The data in this PDF does not match our records. This certificate may have been altered."
                    : result.reason === "not_found"
                      ? "No investment certificate exists for this code."
                      : "This investment is not in an active state."}
                </p>
              </div>
            </div>
            <div className="px-6 py-5 text-sm text-slate-600">
              If you believe this is an error, please contact{" "}
              <a href="mailto:info@biniyogclub.com" className="text-green-600 font-medium underline">
                info@biniyogclub.com
              </a>{" "}
              with the certificate code.
            </div>
          </div>
        )}

        <p className="text-center text-xs text-slate-400 mt-6">
          © {new Date().getFullYear()} Biniyog Club · Agricultural Investment Platform
        </p>
      </div>
    </div>
  );
}
