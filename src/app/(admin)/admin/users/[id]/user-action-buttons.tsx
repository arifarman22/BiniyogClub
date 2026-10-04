"use client";

import { AdminActionButton } from "@/components/admin/admin-action-button";
import { suspendUserAction, activateUserAction, deleteUserAction } from "@/server/actions/admin.actions";

interface Props {
  userId: string;
  userName: string;
  userStatus: string;
  isSuperAdmin: boolean;
}

export function UserActionButtons({ userId, userName, userStatus, isSuperAdmin }: Props) {
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

      {isSuperAdmin && (
        <AdminActionButton
          label="Delete User"
          confirmTitle="Delete User"
          confirmDescription={`Permanently soft-delete ${userName}? This cannot be undone.`}
          onConfirm={() => deleteUserAction(userId)}
          variant="destructive"
          size="sm"
        />
      )}
    </div>
  );
}
