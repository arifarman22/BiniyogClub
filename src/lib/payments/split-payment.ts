/**
 * Shared (client + server) rules for manual payments.
 *
 * An investor picks one of six payment options. Single options (bank, cheque,
 * cash) are one part; combined options (bank + cash, bank + cheque, cheque +
 * cash) are two parts with their own amounts. All parts of one submission share
 * a batchId and finance reviews the batch as a whole.
 */

export const PAYMENT_METHODS = ["BANK_TRANSFER", "CHECK", "CASH"] as const;
export type ManualPaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_OPTIONS = [
  { value: "BANK", label: "Bank Transfer", methods: ["BANK_TRANSFER"] },
  { value: "CHECK", label: "Cheque", methods: ["CHECK"] },
  { value: "CASH", label: "Cash", methods: ["CASH"] },
  { value: "BANK_CASH", label: "Bank + Cash", methods: ["BANK_TRANSFER", "CASH"] },
  { value: "BANK_CHECK", label: "Bank + Cheque", methods: ["BANK_TRANSFER", "CHECK"] },
  { value: "CHECK_CASH", label: "Cheque + Cash", methods: ["CHECK", "CASH"] },
] as const satisfies readonly { value: string; label: string; methods: readonly ManualPaymentMethod[] }[];

export type PaymentOption = (typeof PAYMENT_OPTIONS)[number]["value"];

export const MAX_PAYMENT_PARTS = 2;

/** Who can receive a cash payment. */
export const CASH_RECEIVERS = [
  { value: "CEO", label: "CEO" },
  { value: "MD", label: "Managing Director (MD)" },
  { value: "CHAIRMAN", label: "Chairman" },
  { value: "FINANCE_TEAM", label: "Finance Team" },
] as const;
export type CashReceiver = (typeof CASH_RECEIVERS)[number]["value"];

export const cashReceiverLabel = (v: string | null | undefined) =>
  CASH_RECEIVERS.find((r) => r.value === v)?.label ?? v ?? "—";

/** Labels and field wording per method, so each part asks for the right thing. */
export const METHOD_META: Record<string, { label: string; refLabel: string; refPlaceholder: string; refRequired: boolean; proofLabel: string; proofRequired: boolean; notesPlaceholder: string }> = {
  BANK_TRANSFER: {
    label: "Bank Transfer",
    refLabel: "Transaction reference / TxID",
    refPlaceholder: "e.g. TXN123456789 (if you have one)",
    refRequired: false,
    proofLabel: "Transfer receipt or screenshot",
    proofRequired: true,
    notesPlaceholder: "Anything the reviewer should know",
  },
  CHECK: {
    label: "Cheque",
    refLabel: "Cheque number",
    refPlaceholder: "e.g. 0045821",
    refRequired: true,
    proofLabel: "Photo of the cheque or deposit slip",
    proofRequired: true,
    notesPlaceholder: "Bank and branch the cheque is drawn on",
  },
  CASH: {
    label: "Cash",
    refLabel: "Money receipt number",
    refPlaceholder: "If you were given one",
    refRequired: false,
    proofLabel: "Photo of the money receipt",
    proofRequired: false,
    notesPlaceholder: "Date and place of the handover",
  },
  // Legacy single-method submissions
  MOBILE_BANKING: {
    label: "Mobile Banking", refLabel: "Transaction ID", refPlaceholder: "", refRequired: true,
    proofLabel: "Screenshot", proofRequired: true, notesPlaceholder: "",
  },
  OTHER: {
    label: "Other", refLabel: "Reference", refPlaceholder: "", refRequired: true,
    proofLabel: "Proof of payment", proofRequired: true, notesPlaceholder: "",
  },
};

export const methodLabel = (m: string) => METHOD_META[m]?.label ?? m;

/** Rounds to paisa so float sums compare reliably. */
export const toPaisa = (n: number) => Math.round(n * 100);

/**
 * The inbound Payment record only knows BANK_TRANSFER / MOBILE_BANKING /
 * CARD / WALLET, so manual payments are recorded as BANK_TRANSFER.
 */
export function ledgerPaymentMethod() {
  return "BANK_TRANSFER" as const;
}
