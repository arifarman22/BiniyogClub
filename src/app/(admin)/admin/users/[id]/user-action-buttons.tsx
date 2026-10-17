"use client";

import { AdminActionButton } from "@/components/admin/admin-action-button";
import { suspendUserAction, activateUserAction, deleteUserAction } from "@/server/actions/admin.actions";
import { ChangeInvestorPasswordDialog } from "@/components/admin/change-investor-password-dialog";

interface Props {
  userId: string;
  userName: string;
  userStatus: string;
  userRole: string;
  isSuperAdmin: boolean;
}

export function UserActionButtons({ userId, userName, userStatus, userRole, isSuperAdmin }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {userStatus === "ACTIVE" ? (
        <AdminActionButton
          label="Suspend User"
          confirmTitle="Suspend User"
          confirmDescription={`Suspend ${userName}? They will not be able to log in.`}
          onConfirm={() => suspendUserAction(userId)}
          variant="destructive"
          size="sm"
        />
      ) : userStatus === "SUSPENDED" ? (
        <AdminActionButton
          label="Activate User"
          confirmTitle="Activate User"
          confirmDescription={`Reactivate ${userName}'s account?`}
          onConfirm={() => activateUserAction(userId)}
          size="sm"
        />
      ) : null}

      {userRole === "INVESTOR" && (
        <ChangeInvestorPasswordDialog userId={userId} userName={userName} />
      )}

      {(isSuperAdmin || true) && (
        <AdminActionButton
          label="Delete User"
          confirmTitle="Delete User"
          confirmDescription={`Permanently delete ${userName}? Their account, investments, and all associated data will be removed. This cannot be undone.`}
          onConfirm={() => deleteUserAction(userId)}
          variant="destructive"
          size="sm"
        />
      )}
    </div>
  );
}
