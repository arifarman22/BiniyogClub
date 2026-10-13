"use client";

import { cancelGroupInvestmentAdminAction, completeGroupInvestmentAction } from "@/server/actions/group-investment.actions";
import { AdminActionButton } from "./admin-action-button";

interface Props {
  groupInvestmentId: string;
  status: string;
  amountLabel: string;
  investorName: string;
}

export function GroupInvestmentActionButtons({ groupInvestmentId, status, amountLabel, investorName }: Props) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {status === "ACTIVE" && (
        <AdminActionButton
          label="Complete"
          confirmTitle="Complete Investment"
          confirmDescription={`Mark this group investment of ${amountLabel} by ${investorName} as completed?`}
          onConfirm={() => completeGroupInvestmentAction(groupInvestmentId)}
          variant="default"
        />
      )}
      {!["CANCELLED", "COMPLETED"].includes(status) && (
        <AdminActionButton
          label="Cancel"
          confirmTitle="Cancel Investment"
          confirmDescription={`Cancel this group investment of ${amountLabel} by ${investorName}?`}
          onConfirm={(reason) => cancelGroupInvestmentAdminAction(groupInvestmentId, reason ?? "")}
          requireReason
          reasonPlaceholder="Reason for cancellation..."
          variant="destructive"
        />
      )}
    </div>
  );
}
