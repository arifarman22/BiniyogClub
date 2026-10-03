"use client";

import { approveInvestmentAdminAction, cancelInvestmentAdminAction } from "@/server/actions/admin.actions";
import { AdminActionButton } from "./admin-action-button";

interface Props {
  investmentId: string;
  status: string;
  amountLabel: string;
  investorName: string;
}

export function InvestmentActionButtons({ investmentId, status, amountLabel, investorName }: Props) {
  return (
    <div className="flex items-center justify-end gap-2">
      {status === "PENDING" && (
        <AdminActionButton
          label="Approve"
          confirmTitle="Approve Investment"
          confirmDescription={`Approve this investment of ${amountLabel} by ${investorName}? It will become ACTIVE and visible on their dashboard.`}
          onConfirm={() => approveInvestmentAdminAction(investmentId)}
          variant="default"
        />
      )}
      {["PENDING", "PAYMENT_PENDING", "ACTIVE"].includes(status) && (
        <AdminActionButton
          label="Cancel"
          confirmTitle="Cancel Investment"
          confirmDescription={`Cancel this investment of ${amountLabel} by ${investorName}?`}
          onConfirm={(reason) => cancelInvestmentAdminAction(investmentId, reason ?? "")}
          requireReason
          reasonPlaceholder="Reason for cancellation..."
          variant="destructive"
        />
      )}
    </div>
  );
}
