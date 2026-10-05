import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Image from "next/image";
import { getSession } from "@/lib/auth/session";
import { isStaff } from "@/lib/authz";
import { AdminLoginForm } from "@/components/auth/admin-login-form";
import { Shield, Lock, Activity } from "lucide-react";

export const metadata: Metadata = { title: "Admin Access — Biniyog Club" };

export default async function AdminLoginPage() {
  const session = await getSession();
  if (session && isStaff(session.role)) redirect("/admin");

  return (
    <div className="relative flex min-h-screen w-full overflow-hidden bg-[#080c10]">

      {/* Background grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Glow blobs */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-20 h-[400px] w-[400px] rounded-full bg-teal-500/8 blur-[100px]" />

      {/* ── Left panel — branding ── */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between p-14 border-r border-white/5">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative h-9 w-32">
            <Image src="/logo.png" alt="Biniyog Club" fill className="object-contain object-left brightness-0 invert opacity-90" />
          </div>
        </div>

        {/* Center content */}
        <div className="space-y-10">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Secure Admin Portal
            </div>
            <h1 className="text-4xl font-light leading-tight text-white">
              Biniyog Club<br />
              <span className="text-emerald-400">Control Center</span>
            </h1>
            <p className="text-sm leading-relaxed text-slate-400 max-w-sm">
              Manage investments, review KYC applications, oversee projects, and monitor platform activity — all from one place.
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Shield, label: "Role-Based Access", desc: "Granular permissions per staff role" },
              { icon: Lock, label: "Encrypted Sessions", desc: "HttpOnly cookie-based auth" },
              { icon: Activity, label: "Audit Logging", desc: "Every action is recorded" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="rounded-xl border border-white/5 bg-white/3 p-4 space-y-2">
                <Icon className="h-4 w-4 text-emerald-400" />
                <p className="text-xs font-semibold text-white">{label}</p>
                <p className="text-[11px] text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs text-slate-600">
          © {new Date().getFullYear()} Biniyog Club Ltd. · Restricted access only.
        </p>
      </div>

      {/* ── Right panel — login form ── */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-sm space-y-8">

          {/* Mobile logo */}
          <div className="flex justify-center lg:hidden">
            <div className="relative h-8 w-28">
              <Image src="/logo.png" alt="Biniyog Club" fill className="object-contain brightness-0 invert opacity-80" />
            </div>
          </div>

          {/* Header */}
          <div className="space-y-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10">
              <Shield className="h-5 w-5 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-semibold text-white">Staff Sign In</h2>
            <p className="text-sm text-slate-400">
              Authorized personnel only. All access is logged.
            </p>
          </div>

          {/* Form */}
          <AdminLoginForm />

          {/* Divider */}
          <div className="border-t border-white/5 pt-4">
            <p className="text-center text-xs text-slate-600">
              Not a staff member?{" "}
              <a href="/auth/login" className="text-slate-400 hover:text-white transition-colors">
                Investor login →
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
