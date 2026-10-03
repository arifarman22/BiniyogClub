"use client";

import { AdminActionButton } from "./admin-action-button";
import { suspendUserAction, activateUserAction, deleteUserAction } from "@/server/actions/admin.actions";

export function SuspendUserButton({ userId, userName }: { userId: string; userName: string }) {
  return (
    <AdminActionButton
      label="Suspend"
      confirmTitle="Suspend User"
      confirmDescription={`Suspend ${userName}? They will not be able to log in.`}
      onConfirm={() => suspendUserAction(userId)}
      variant="destructive"
    />
  );
}

export function ActivateUserButton({ userId, userName }: { userId: string; userName: string }) {
  return (
    <AdminActionButton
      label="Activate"
      confirmTitle="Activate User"
      confirmDescription={`Reactivate ${userName}'s account?`}
      onConfirm={() => activateUserAction(userId)}
    />
  );
}

export function DeleteUserButton({ userId, userName }: { userId: string; userName: string }) {
  return (
    <AdminActionButton
      label="Delete"
      confirmTitle="Delete User"
      confirmDescription={`Permanently delete ${userName}? This will soft-delete their account and deactivate it. This cannot be undone.`}
      onConfirm={() => deleteUserAction(userId)}
      variant="destructive"
    />
  );
}
