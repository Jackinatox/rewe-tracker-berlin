"use client";

import * as Popover from "@radix-ui/react-popover";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { DayPicker } from "react-day-picker";
import { de } from "react-day-picker/locale";
import { cn } from "@/lib/utils";
import { Button, field, popoverContent } from "./ui";

// Dates travel as YYYY-MM-DD strings; Date objects here are local midnight, only for the calendar.
const toDate = (iso: string) => {
  const [y = 0, m = 1, d = 1] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const toIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const shift = (iso: string, days: number) => {
  const d = toDate(iso);
  d.setDate(d.getDate() + days);
  return toIso(d);
};

const LONG = new Intl.DateTimeFormat("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

export function DatePicker({
  id,
  value,
  max,
  onChange,
}: {
  id?: string;
  value: string;
  /** Latest selectable day (YYYY-MM-DD), also used as "today" for the shortcuts. */
  max: string;
  onChange: (iso: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = toDate(value);
  const latest = toDate(max);
  const yesterday = shift(max, -1);
  const relative = value === max ? "Heute" : value === yesterday ? "Gestern" : null;

  function pick(iso: string) {
    onChange(iso);
    setOpen(false);
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        id={id}
        className={cn(field, "flex h-11 items-center gap-2 text-left", open && "border-brand ring-2 ring-brand/20")}
      >
        <CalendarDays className="size-4 shrink-0 text-muted" />
        <span className="grow truncate">{LONG.format(selected)}</span>
        {relative && <span className="text-sm text-muted">{relative}</span>}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="start" sideOffset={6} collisionPadding={12} className={cn(popoverContent, "p-3")}>
          <DayPicker
            mode="single"
            required
            locale={de}
            selected={selected}
            defaultMonth={selected}
            onSelect={(d) => pick(toIso(d))}
            disabled={{ after: latest }}
            endMonth={latest}
            autoFocus
            showOutsideDays
            classNames={{
              root: "relative",
              months: "relative",
              month: "space-y-2",
              month_caption: "flex h-9 items-center px-1",
              caption_label: "text-sm font-semibold",
              nav: "absolute top-0 right-0 z-10 flex gap-1",
              button_previous: navButton,
              button_next: navButton,
              chevron: "size-4",
              month_grid: "border-collapse",
              weekdays: "flex",
              weekday: "w-10 pb-1 text-xs font-medium text-muted",
              week: "flex",
              day: "size-10 p-0.5 text-center text-sm",
              day_button:
                "size-full rounded-lg transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-brand disabled:pointer-events-none",
              today: "font-semibold text-brand",
              selected: "[&>button]:bg-brand [&>button]:text-white [&>button]:hover:bg-brand-hover",
              outside: "text-muted opacity-60",
              disabled: "text-muted opacity-40",
              hidden: "invisible",
            }}
            components={{
              Chevron: ({ orientation, className }) =>
                orientation === "left" ? <ChevronLeft className={className} /> : <ChevronRight className={className} />,
            }}
          />
          <div className="mt-2 flex gap-2 border-t border-line pt-3">
            <Button size="sm" variant="secondary" className="grow" onClick={() => pick(max)}>
              Heute
            </Button>
            <Button size="sm" variant="secondary" className="grow" onClick={() => pick(yesterday)}>
              Gestern
            </Button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

const navButton =
  "flex size-9 items-center justify-center rounded-lg text-ink-2 hover:bg-surface-2 hover:text-ink aria-disabled:pointer-events-none aria-disabled:opacity-40";
