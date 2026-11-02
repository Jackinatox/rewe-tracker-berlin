"use client";

import { LayoutDashboard, Map as MapIcon, Plus, UserRound } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavProps {
  username: string | null;
}

function items(username: string | null) {
  return [
    { href: "/" as Route, label: "Karte", icon: MapIcon, match: (p: string) => p === "/" || p.startsWith("/markt") },
    {
      href: (username ? `/besuch/neu` : "/anmelden") as Route,
      label: "Besuch",
      icon: Plus,
      match: (p: string) => p.startsWith("/besuch"),
      primary: true,
    },
    {
      href: (username ? `/u/${username}` : "/anmelden") as Route,
      label: "Dashboard",
      icon: LayoutDashboard,
      match: (p: string) => !!username && p === `/u/${username}`,
    },
    {
      href: (username ? "/einstellungen" : "/anmelden") as Route,
      label: username ? "Konto" : "Anmelden",
      icon: UserRound,
      match: (p: string) => p === "/einstellungen" || p === "/anmelden" || p === "/registrieren",
    },
  ];
}

export function DesktopNav({ username }: NavProps) {
  const pathname = usePathname();
  return (
    <nav className="hidden items-center gap-1 sm:flex">
      {items(username).map(({ href, label, icon: Icon, match, primary }) => (
        <Link
          key={label}
          href={href}
          className={cn(
            "flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors",
            primary
              ? "ml-1 bg-brand text-white hover:bg-brand-hover"
              : match(pathname)
                ? "bg-surface-2 text-ink"
                : "text-ink-2 hover:bg-surface-2 hover:text-ink",
          )}
        >
          <Icon className="size-4" />
          {primary ? "Besuch eintragen" : label}
        </Link>
      ))}
    </nav>
  );
}

/** Tab bar for phones, where the app is mostly used (in the store). */
export function MobileNav({ username }: NavProps) {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden">
      <div className="grid grid-cols-4">
        {items(username).map(({ href, label, icon: Icon, match, primary }) => (
          <Link
            key={label}
            href={href}
            className={cn(
              "flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium",
              match(pathname) ? "text-brand" : "text-ink-2",
            )}
          >
            <span
              className={cn("flex items-center justify-center", primary && "size-7 rounded-full bg-brand text-white")}
            >
              <Icon className={primary ? "size-4" : "size-5"} />
            </span>
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
