"use client";

import { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "cn";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Formats what's been typed as DD/MM/YYYY while typing:
 * slashes appear as soon as the day / month is complete, and a lone
 * digit that can only start a day (4–9) or month (2–9) gets its leading zero.
 */
export function maskDobTyping(next: string, prev: string): string {
  if (next.length < prev.length) return next; // deleting — leave the user's edit alone
  let digits = next.replace(/\D/g, "");
  if (digits.length >= 1 && digits[0] > "3") digits = "0" + digits;
  const dd = digits.slice(0, 2);
  if (dd.length < 2) return dd;

  let rest = digits.slice(2);
  if (rest.length >= 1 && rest[0] > "1") rest = "0" + rest;
  const mm = rest.slice(0, 2);
  if (mm.length < 2) return `${dd}/${mm}`;

  return `${dd}/${mm}/${rest.slice(2, 6)}`;
}

/** DD/MM/YYYY → Date, or null when incomplete/invalid. */
function parseDmy(v: string): Date | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v);
  if (!m) return null;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  return d.getDate() === Number(m[1]) && d.getMonth() === Number(m[2]) - 1 ? d : null;
}

const toDmy = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
const sameDay = (a: Date | null, b: Date) =>
  !!a && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

type Props = {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  /** Youngest allowed age; later dates are disabled in the calendar. */
  minAge?: number;
  invalid?: boolean;
  /** Classes for the text input (match the surrounding form). */
  inputClassName?: string;
  placeholder?: string;
};

/** Date-of-birth field: type DD/MM/YYYY with automatic slashes, or pick from a calendar. */
export function DobInput({ id, name, value, onChange, onBlur, minAge = 18, invalid, inputClassName, placeholder = "DD/MM/YYYY" }: Props) {
  const today = new Date();
  const maxDate = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
  const minYear = today.getFullYear() - 100;
  const selected = parseDmy(value);

  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => {
    const base = selected ?? new Date(maxDate.getFullYear() - 7, 0, 1);
    return { y: base.getFullYear(), m: base.getMonth() };
  });

  // Re-centre the calendar on the typed date each time it opens.
  function handleOpenChange(next: boolean) {
    if (next && selected) setView({ y: selected.getFullYear(), m: selected.getMonth() });
    setOpen(next);
  }

  function shiftMonth(delta: number) {
    setView(({ y, m }) => {
      const d = new Date(y, m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  }

  const firstWeekday = new Date(view.y, view.m, 1).getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(view.y, view.m, i + 1)),
  ];
  const years = Array.from({ length: maxDate.getFullYear() - minYear + 1 }, (_, i) => maxDate.getFullYear() - i);
  const canNext = new Date(view.y, view.m + 1, 1) <= maxDate;
  const canPrev = view.y > minYear || view.m > 0;
  const selectCls = "h-8 rounded-md border border-border bg-background px-2 text-sm font-medium outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20";

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type="text"
        inputMode="numeric"
        autoComplete="bday"
        placeholder={placeholder}
        maxLength={10}
        aria-invalid={invalid || undefined}
        value={value}
        onChange={(e) => onChange(maskDobTyping(e.target.value, value))}
        onBlur={onBlur}
        className={cn(
          "flex w-full border bg-background px-3 py-2 pr-11 text-sm outline-none transition-colors placeholder:text-muted-foreground/40 focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/20 aria-invalid:border-destructive",
          inputClassName,
        )}
      />

      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger
          aria-label="Open calendar"
          className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
        >
          <CalendarDays className="h-4 w-4" />
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[19rem] p-3">
          {/* Month / year jump + step arrows */}
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => shiftMonth(-1)} disabled={!canPrev} aria-label="Previous month"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md hover:bg-muted disabled:opacity-30">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <select aria-label="Month" value={view.m} onChange={(e) => setView((v) => ({ ...v, m: Number(e.target.value) }))} className={cn(selectCls, "flex-1")}>
              {MONTHS.map((name, i) => <option key={name} value={i}>{name}</option>)}
            </select>
            <select aria-label="Year" value={view.y} onChange={(e) => setView((v) => ({ ...v, y: Number(e.target.value) }))} className={cn(selectCls, "w-[5.5rem]")}>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <button type="button" onClick={() => shiftMonth(1)} disabled={!canNext} aria-label="Next month"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md hover:bg-muted disabled:opacity-30">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 text-center">
            {WEEKDAYS.map((d) => (
              <span key={d} className="py-1 text-[11px] font-semibold uppercase text-muted-foreground">{d}</span>
            ))}
            {cells.map((date, i) =>
              date ? (
                <button
                  key={i}
                  type="button"
                  disabled={date > maxDate}
                  onClick={() => { onChange(toDmy(date)); setOpen(false); }}
                  aria-pressed={sameDay(selected, date)}
                  className={cn(
                    "h-9 rounded-md text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-25",
                    sameDay(selected, date)
                      ? "bg-primary font-semibold text-primary-foreground"
                      : "hover:bg-primary/10 hover:text-primary",
                    sameDay(today, date) && !sameDay(selected, date) && "ring-1 ring-primary/40",
                  )}
                >
                  {date.getDate()}
                </button>
              ) : (
                <span key={i} />
              ),
            )}
          </div>

          <p className="text-center text-[11px] text-muted-foreground">
            Type it as DD/MM/YYYY, or pick it here. You must be {minAge} or older.
          </p>
        </PopoverContent>
      </Popover>
    </div>
  );
}
