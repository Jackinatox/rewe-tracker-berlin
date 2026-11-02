"use client";

import * as Popover from "@radix-ui/react-popover";
import { Command } from "cmdk";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { cn, matchesQuery } from "@/lib/utils";
import type { MapStore } from "./store-map";
import { field, popoverContent } from "./ui";

/** Searchable store picker. All ~150 stores are already on the client, so filtering happens locally. */
export function StorePicker({
  id,
  stores,
  districts,
  value,
  onChange,
}: {
  id?: string;
  stores: MapStore[];
  districts: string[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = stores.find((s) => s.id === value);

  const groups = useMemo(() => {
    const matches = matchesQuery(query);
    const hits = stores.filter((s) => matches(s.name, s.address, s.postcode, s.district));
    return districts
      .map((district) => ({
        district,
        stores: hits.filter((s) => s.district === district).sort((a, b) => a.name.localeCompare(b.name, "de")),
      }))
      .filter((g) => g.stores.length > 0);
  }, [stores, districts, query]);

  function pick(storeId: string) {
    onChange(storeId);
    setOpen(false);
    setQuery("");
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        id={id}
        className={cn(
          field,
          "flex min-h-11 items-center gap-2 py-1.5 text-left",
          open && "border-brand ring-2 ring-brand/20",
        )}
      >
        {selected ? (
          <span className="min-w-0 grow">
            <span className="block truncate font-medium">{selected.name}</span>
            <span className="block truncate text-xs text-muted">
              {selected.address}, {selected.postcode} · {selected.district}
            </span>
          </span>
        ) : (
          <span className="grow text-muted">Markt auswählen…</span>
        )}
        <ChevronsUpDown className="size-4 shrink-0 text-muted" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          collisionPadding={12}
          className={cn(popoverContent, "w-(--radix-popover-trigger-width) overflow-hidden")}
        >
          <Command shouldFilter={false} loop>
            <div className="flex items-center gap-2 border-b border-line px-3">
              <Search className="size-4 shrink-0 text-muted" />
              <Command.Input
                value={query}
                onValueChange={setQuery}
                placeholder="Name, Straße, PLZ oder Bezirk…"
                className="h-11 w-full bg-transparent text-base text-ink placeholder:text-muted focus:outline-none"
              />
            </div>
            <Command.List className="max-h-[min(22rem,var(--radix-popover-content-available-height)-3rem)] overflow-y-auto overscroll-contain p-1">
              <Command.Empty className="px-3 py-6 text-center text-sm text-muted">Kein Markt gefunden.</Command.Empty>
              {groups.map((g) => (
                <Command.Group
                  key={g.district}
                  heading={g.district}
                  className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted"
                >
                  {g.stores.map((s) => (
                    <Command.Item
                      key={s.id}
                      value={s.id}
                      onSelect={() => pick(s.id)}
                      className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 data-[selected=true]:bg-surface-2"
                    >
                      <span className="min-w-0 grow">
                        <span className="block truncate text-sm font-medium">{s.name}</span>
                        <span className="block truncate text-xs text-muted">
                          {s.address}, {s.postcode}
                        </span>
                      </span>
                      {s.id === value && <Check className="size-4 shrink-0 text-brand" />}
                    </Command.Item>
                  ))}
                </Command.Group>
              ))}
            </Command.List>
          </Command>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
