"use client";

import { Check, Circle, X } from "lucide-react";
import { PASSWORD_MAX_LENGTH, PASSWORD_RULES } from "@/validations/auth";

type Props = {
  password: string;
  /** Pass the confirm field to also show whether the two match. */
  confirmPassword?: string;
};

/** Live checklist of password rules, ticked off as the user types. */
export function PasswordRequirements({ password, confirmPassword }: Props) {
  const rules = PASSWORD_RULES.map((r) => ({ ...r, met: r.test(password) }));
  const tooLong = password.length > PASSWORD_MAX_LENGTH;
  const showMatch = confirmPassword !== undefined && confirmPassword.length > 0;
  const matches = showMatch && password === confirmPassword;

  return (
    <ul className="mt-2 grid grid-cols-1 gap-1.5 rounded-xl border border-border/70 bg-muted/30 px-3 py-2.5 sm:grid-cols-2" aria-live="polite">
      {rules.map((r) => (
        <Requirement key={r.id} met={r.met} label={r.label} />
      ))}
      {tooLong && <Requirement met={false} failed label={`At most ${PASSWORD_MAX_LENGTH} characters`} />}
      {showMatch && <Requirement met={matches} failed={!matches} label={matches ? "Passwords match" : "Passwords don't match"} />}
    </ul>
  );
}

function Requirement({ met, failed, label }: { met: boolean; failed?: boolean; label: string }) {
  const Icon = met ? Check : failed ? X : Circle;
  return (
    <li className={`flex items-center gap-2 text-xs transition-colors ${met ? "text-success" : failed ? "text-destructive" : "text-muted-foreground"}`}>
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
          met ? "bg-success/15" : failed ? "bg-destructive/10" : ""
        }`}
      >
        <Icon className={met || failed ? "h-3 w-3" : "h-2.5 w-2.5"} strokeWidth={met || failed ? 3 : 2} />
      </span>
      <span className={met ? "font-medium" : ""}>{label}</span>
      <span className="sr-only">{met ? "(met)" : "(not met)"}</span>
    </li>
  );
}
