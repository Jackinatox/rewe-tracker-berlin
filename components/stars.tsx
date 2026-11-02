"use client";

import { Star } from "lucide-react";
import { formatRating } from "@/lib/ratings";
import { cn } from "@/lib/utils";

/** Read-only stars for an average; fractional values partially fill a star. */
export function Stars({ value, size = 16, showValue = true }: { value: number; size?: number; showValue?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5" title={`${formatRating(value)} von 5`}>
      <span className="relative inline-flex" aria-hidden>
        <span className="flex text-line">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} size={size} fill="currentColor" strokeWidth={0} />
          ))}
        </span>
        <span className="absolute inset-0 flex overflow-hidden text-star" style={{ width: `${(value / 5) * 100}%` }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} size={size} fill="currentColor" strokeWidth={0} className="shrink-0" />
          ))}
        </span>
      </span>
      {showValue && <span className="text-sm font-medium tabular-nums">{formatRating(value)}</span>}
      <span className="sr-only">{formatRating(value)} von 5 Sternen</span>
    </span>
  );
}

/** Tap-to-rate. Optional ratings can be cleared by tapping the selected star again. */
export function StarInput({
  value,
  onChange,
  label,
  size = "md",
  clearable = false,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  label: string;
  size?: "md" | "lg";
  clearable?: boolean;
}) {
  const px = size === "lg" ? 36 : 26;
  return (
    <div role="radiogroup" aria-label={label} className="flex">
      {[1, 2, 3, 4, 5].map((n) => {
        const active = value != null && n <= value;
        return (
          // biome-ignore lint/a11y/useSemanticElements: star buttons act as a radio group but must be clearable
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} ${n === 1 ? "Stern" : "Sterne"}`}
            onClick={() => onChange(clearable && value === n ? null : n)}
            className={cn(
              "flex items-center justify-center rounded-md transition-transform active:scale-90 focus-visible:outline-2 focus-visible:outline-brand",
              size === "lg" ? "size-12" : "size-10",
              active ? "text-star" : "text-line hover:text-star/50",
            )}
          >
            <Star size={px} fill="currentColor" strokeWidth={0} />
          </button>
        );
      })}
    </div>
  );
}
