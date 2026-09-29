export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { getAllBankAccounts } from "@/server/data/manual-payment.data";
import { PageHeader } from "@/components/ui/page-header";
import { BankAccountManager } from "@/components/admin/bank-account-manager";

export const metadata: Metadata = { title: "Bank Accounts — Admin" };

export default async function BankAccountsPage() {
  const session = await requireSession();
  const accounts = await getAllBankAccounts(session);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Bank Accounts"
        description="Manage bank accounts shown to investors for manual transfers"
      />
      <BankAccountManager accounts={accounts} />
    </div>
  );
}
