"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { LogOut, User } from "lucide-react";
import { logoutAction } from "@/server/actions/auth.actions";
import Link from "next/link";

interface Props {
  initials: string;
  name: string;
  email: string;
}

export function AvatarMenu({ initials, name, email }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground focus:outline-none"
        aria-label="Account menu"
      >
        {initials}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-52 rounded-xl border border-border bg-popover shadow-lg">
          {/* User info */}
          <div className="border-b border-border px-4 py-3">
            <p className="text-xs font-semibold truncate">{name}</p>
            <p className="text-[10px] text-muted-foreground truncate">{email}</p>
          </div>

          {/* Menu items */}
          <div className="p-1.5 space-y-0.5">
            <Link
              href="/dashboard/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors"
            >
              <User className="h-3.5 w-3.5" />
              Profile
            </Link>

            <button
              onClick={() => startTransition(() => logoutAction())}
              disabled={isPending}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              {isPending ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
