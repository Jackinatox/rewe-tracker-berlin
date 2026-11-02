import { cva, type VariantProps } from "class-variance-authority";
import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-brand text-white hover:bg-brand-hover",
        secondary: "border border-line bg-surface text-ink hover:bg-surface-2",
        ghost: "text-ink-2 hover:bg-surface-2 hover:text-ink",
        danger: "border border-line bg-surface text-critical hover:bg-surface-2",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-11 px-4 text-sm",
        lg: "h-12 px-5 text-base",
        icon: "size-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonVariants = VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ComponentProps<"button"> & ButtonVariants) {
  return <button type="button" className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export function LinkButton({ className, variant, size, ...props }: ComponentProps<typeof Link> & ButtonVariants) {
  return <Link className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export function Card({ className, ...props }: ComponentProps<"section">) {
  return <section className={cn("rounded-xl border border-line bg-surface p-4 sm:p-5", className)} {...props} />;
}

export function CardTitle({ className, ...props }: ComponentProps<"h2">) {
  return <h2 className={cn("mb-3 text-base font-semibold", className)} {...props} />;
}

export const field =
  "w-full rounded-lg border border-line bg-surface px-3 text-base text-ink placeholder:text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20";

/** Floating panel for popovers (store picker, date picker). */
export const popoverContent =
  "z-50 rounded-xl border border-line bg-surface text-ink shadow-lg outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(field, "h-11", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(field, "h-11", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(field, "min-h-24 py-2", className)} {...props} />;
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  // biome-ignore lint/a11y/noLabelWithoutControl: callers pass htmlFor or wrap the control
  return <label className={cn("mb-1.5 block text-sm font-medium text-ink-2", className)} {...props} />;
}

export function Pill({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      className={cn("inline-flex items-center rounded-full bg-surface-2 px-2 py-0.5 text-xs text-ink-2", className)}
      {...props}
    />
  );
}

/** Thin horizontal progress bar; the value is always shown as text next to it by the caller. */
export function ProgressBar({ value, max, className }: { value: number; max: number; className?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-full bg-surface-2", className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div className="h-full rounded-full bg-series" style={{ width: `${pct}%` }} />
    </div>
  );
}
