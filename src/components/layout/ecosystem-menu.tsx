"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { cn } from "cn";
import type { EcosystemSegment, SegmentKey } from "@/lib/ecosystem";

const STATUS: Record<string, { label: string; cls: string }> = {
  FUNDRAISING: { label: "Open", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  FUNDED: { label: "Funded", cls: "bg-sky-50 text-sky-700 border-sky-200" },
  ACTIVE: { label: "Running", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  COMPLETED: { label: "Completed", cls: "bg-slate-100 text-slate-600 border-slate-200" },
};

const fmtBdt = (n: number) =>
  n >= 100_000 ? `৳${(n / 100_000).toFixed(n % 100_000 ? 1 : 0)}L` : `৳${n.toLocaleString("en-BD")}`;

const MAX_PROJECTS = 4;

const FALLBACK_IMG = "/images/smart-agro-farm.jpg";

// ─── Desktop mega menu ────────────────────────────────────────────────────────

export function EcosystemMegaMenu({ segments }: { segments: EcosystemSegment[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [activeKey, setActiveKey] = useState<SegmentKey>(segments[0]?.key ?? "mariners");
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerType = useRef("");
  const rootRef = useRef<HTMLDivElement>(null);

  const isActiveRoute = pathname.startsWith("/groups");
  const active = segments.find((s) => s.key === activeKey) ?? segments[0];

  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const openNow = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const closeSoon = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  };
  const onTriggerClick = () => {
    if (pointerType.current === "mouse") setOpen(true);
    else setOpen((v) => !v);
    pointerType.current = "";
  };

  if (!active) return null;

  // Use the first project's cover as the segment hero image
  const segmentHeroImg = active.projects[0]?.coverImageUrl ?? FALLBACK_IMG;

  return (
    <div ref={rootRef} onPointerEnter={openNow} onPointerLeave={closeSoon}>
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="ecosystem-menu"
        onPointerDown={(e) => { pointerType.current = e.pointerType; }}
        onClick={onTriggerClick}
        className={cn(
          "inline-flex items-center gap-1 rounded-none px-3.5 py-1.5 text-xs font-medium transition-all duration-200 lg:text-sm",
          isActiveRoute || open
            ? "border border-emerald-200 bg-emerald-50 font-semibold text-emerald-700"
            : "text-slate-700 hover:bg-emerald-50 hover:text-emerald-700",
        )}
      >
        Ecosystem
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", open && "rotate-180")} />
      </button>

      {open && (
        <div
          id="ecosystem-menu"
          role="region"
          aria-label="Ecosystem"
          className="fixed inset-x-0 top-[100px] z-50 border-y border-gray-200 bg-white shadow-2xl shadow-slate-900/10 animate-in fade-in slide-in-from-top-1 duration-150"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-12 gap-0">

              {/* ── Col 1: Segment list ── */}
              <div className="col-span-4 border-r border-gray-100 py-6 pr-5">
                <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Business Segments
                </p>
                <ul className="space-y-0.5">
                  {segments.map((s) => {
                    const selected = s.key === active.key;
                    // Thumbnail: first project image or fallback
                    const thumb = s.projects[0]?.coverImageUrl ?? FALLBACK_IMG;
                    return (
                      <li key={s.key}>
                        <button
                          type="button"
                          onMouseEnter={() => setActiveKey(s.key)}
                          onFocus={() => setActiveKey(s.key)}
                          onClick={() => setActiveKey(s.key)}
                          className={cn(
                            "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-150",
                            selected ? "bg-emerald-50 ring-1 ring-emerald-100" : "hover:bg-slate-50",
                          )}
                        >
                          {/* Real project thumbnail */}
                          <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-md">
                            <Image
                              src={thumb}
                              alt={s.name}
                              fill
                              className="object-cover"
                              sizes="56px"
                            />
  
                          </div>
                          <span className="min-w-0 flex-1">
                            <span className={cn("block text-sm font-semibold leading-tight", selected ? "text-emerald-800" : "text-slate-800")}>
                              {s.name}
                            </span>
                            <span className="block truncate text-xs text-slate-500 leading-tight mt-0.5">{s.desc}</span>
                          </span>
                          {s.projects.length > 0 ? (
                            <span className={cn("shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold tabular-nums", selected ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500")}>
                              {s.projects.length}
                            </span>
                          ) : (
                            <span className="shrink-0 text-[10px] font-medium uppercase tracking-wider text-slate-400">Soon</span>
                          )}
                          <ChevronRight className={cn("h-3.5 w-3.5 shrink-0 transition-colors", selected ? "text-emerald-500" : "text-slate-300")} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* ── Col 2: Active segment projects ── */}
              <div className="col-span-8 py-6 pl-6">
                {/* Segment header */}
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {/* Hero image from first project */}
                    <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-lg">
                      <Image
                        src={segmentHeroImg}
                        alt={active.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />

                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{active.name}</p>
                      <p className="text-xs text-slate-500">{active.desc}</p>
                    </div>
                  </div>
                  {active.href && (
                    <Link
                      href={active.href}
                      className="group inline-flex shrink-0 items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
                    >
                      View all <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  )}
                </div>

                {/* Projects */}
                {active.projects.length > 0 ? (
                  <>
                    <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                      Open Opportunities
                    </p>
                    <ul className="grid grid-cols-2 gap-2.5">
                      {active.projects.slice(0, MAX_PROJECTS).map((p) => {
                        const st = STATUS[p.status] ?? { label: p.status.replace(/_/g, " ").toLowerCase(), cls: "bg-slate-100 text-slate-600 border-slate-200" };
                        return (
                          <li key={p.slug}>
                            <Link
                              href={`/projects/${p.slug}`}
                              className="group flex items-center gap-3 rounded-lg border border-gray-100 p-2.5 transition-all hover:border-emerald-200 hover:bg-emerald-50/60 hover:shadow-sm"
                            >
                              {/* Real project image */}
                              <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-md">
                                <Image
                                  src={p.coverImageUrl ?? FALLBACK_IMG}
                                  alt={p.title}
                                  fill
                                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                                  sizes="80px"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-1.5 mb-1">
                                  <span className="text-xs font-semibold text-slate-800 group-hover:text-emerald-800 leading-tight line-clamp-2">
                                    {p.title}
                                  </span>
                                  <span className={cn("shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold", st.cls)}>
                                    {st.label}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                                  <TrendingUp className="h-3 w-3 text-emerald-500 shrink-0" />
                                  <span>From {fmtBdt(p.minInvestmentBdt)}</span>
                                  {p.returnLabel && <span className="text-emerald-600 font-medium">· {p.returnLabel}</span>}
                                </div>
                              </div>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                    {active.projects.length > MAX_PROJECTS && active.href && (
                      <Link href={active.href} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline">
                        +{active.projects.length - MAX_PROJECTS} more in {active.name} <ArrowRight className="h-3 w-3" />
                      </Link>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-10 text-center">
                    <p className="text-sm font-medium text-slate-600">
                      {active.href ? "No open projects right now" : "Launching soon"}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">Browse all open projects in the meantime.</p>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Footer bar */}
          <div className="border-t border-gray-100 bg-slate-50">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 text-sm sm:px-6 lg:px-8">
              <p className="text-slate-500 text-xs">Real businesses · Real assets · Real opportunities</p>
              <div className="flex items-center gap-5">
                <Link href="/how-it-works" className="text-xs font-medium text-slate-600 hover:text-emerald-700">How it works</Link>
                <Link href="/projects" className="group inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800">
                  Browse all projects <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Mobile accordion ─────────────────────────────────────────────────────────

export function EcosystemMobileMenu({ segments, onNavigate }: { segments: EcosystemSegment[]; onNavigate: () => void }) {
  const [open, setOpen] = useState(false);
  const [openSegment, setOpenSegment] = useState<SegmentKey | null>(null);

  return (
    <div className="rounded-2xl">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
      >
        <span>Ecosystem</span>
        <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <ul className="ml-3 mt-1 space-y-1 border-l border-white/10 pl-3">
          {segments.map((s) => {
            const expanded = openSegment === s.key;
            const thumb = s.projects[0]?.coverImageUrl ?? FALLBACK_IMG;
            return (
              <li key={s.key}>
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => setOpenSegment(expanded ? null : s.key)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-200 transition-colors hover:bg-white/10"
                >
                  <div className="relative h-8 w-10 shrink-0 overflow-hidden rounded-md">
                    <Image src={thumb} alt={s.name} fill className="object-cover" sizes="40px" />

                  </div>
                  <span className="flex-1">{s.name}</span>
                  {s.projects.length > 0 && <span className="text-[10px] font-semibold text-slate-400">{s.projects.length}</span>}
                  <ChevronDown className={cn("h-3.5 w-3.5 text-slate-500 transition-transform", expanded && "rotate-180")} />
                </button>

                {expanded && (
                  <ul className="mb-2 ml-7 space-y-0.5">
                    {s.projects.slice(0, MAX_PROJECTS).map((p) => (
                      <li key={p.slug}>
                        <Link
                          href={`/projects/${p.slug}`}
                          onClick={onNavigate}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-slate-300 hover:bg-white/10 hover:text-white"
                        >
                          <div className="relative h-7 w-10 shrink-0 overflow-hidden rounded">
                            <Image src={p.coverImageUrl ?? FALLBACK_IMG} alt={p.title} fill className="object-cover" sizes="40px" />
                          </div>
                          <span className="truncate">{p.title}</span>
                        </Link>
                      </li>
                    ))}
                    {s.projects.length === 0 && (
                      <li className="px-3 py-2 text-xs text-slate-500">{s.href ? "No open projects right now" : "Launching soon"}</li>
                    )}
                    {s.href && (
                      <li>
                        <Link href={s.href} onClick={onNavigate} className="block px-3 py-2 text-xs font-semibold text-emerald-400">
                          View {s.name} →
                        </Link>
                      </li>
                    )}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
