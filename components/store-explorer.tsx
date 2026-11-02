"use client";

import { Check, LocateFixed, Navigation, Plus, Search } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { formatDistance, haversineKm, type LatLng } from "@/lib/geo";
import { formatRating } from "@/lib/ratings";
import { cn, matchesQuery } from "@/lib/utils";
import { type MapStore, StoreMap, type StoreStatus } from "./store-map-lazy";
import { Button, Card, Input, LinkButton, Select } from "./ui";

type Filter = "all" | "visited" | "open";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "Alle" },
  { value: "open", label: "Offen" },
  { value: "visited", label: "Besucht" },
];

/** Rows shown before "Alle anzeigen" while nothing is searched or filtered. */
const PREVIEW_ROWS = 5;

/**
 * Home page: nearest store, map and store list share the user's position and the map focus.
 * `summary` sits next to the nearest-store card on wide screens; `children` goes between the map and the list.
 */
export function StoreExplorer({
  stores,
  districts,
  statuses,
  loggedIn,
  summary,
  children,
}: {
  stores: MapStore[];
  districts: string[];
  statuses: Record<string, StoreStatus>;
  loggedIn: boolean;
  summary?: ReactNode;
  children?: ReactNode;
}) {
  const [query, setQuery] = useState("");
  const [district, setDistrict] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [expanded, setExpanded] = useState(false);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [position, setPosition] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);

  const withDistance = useMemo(
    () => stores.map((s) => ({ ...s, km: position ? haversineKm(position, s) : null })),
    [stores, position],
  );

  const visible = useMemo(() => {
    const matches = matchesQuery(query);
    return withDistance
      .filter((s) => !district || s.district === district)
      .filter((s) => filter === "all" || (filter === "visited") === !!statuses[s.id])
      .filter((s) => matches(s.name, s.address, s.postcode, s.district))
      .sort((a, b) =>
        a.km != null && b.km != null
          ? a.km - b.km
          : a.district.localeCompare(b.district, "de") || a.name.localeCompare(b.name, "de"),
      );
  }, [withDistance, query, district, filter, statuses]);

  // Closest stores the user hasn't been to yet (any store when logged out).
  const nearby = position ? withDistance.filter((s) => !statuses[s.id]).sort((a, b) => (a.km ?? 0) - (b.km ?? 0)) : [];
  const [nearest, ...next] = nearby;

  const narrowed = !!query.trim() || !!district || filter !== "all";
  const rows = expanded || narrowed ? visible : visible.slice(0, PREVIEW_ROWS);

  function locate(silent = false) {
    if (!navigator.geolocation) {
      if (!silent) toast.error("Dein Browser unterstützt keine Standortabfrage.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const here = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPosition(here);
        // Only fly the map there when the user asked; a silent locate on load shouldn't move it.
        if (silent) return;
        const first = stores
          .filter((s) => !statuses[s.id])
          .sort((a, b) => haversineKm(here, a) - haversineKm(here, b))[0];
        if (first) setFocusId(first.id);
      },
      () => {
        setLocating(false);
        if (!silent) toast.error("Standort nicht verfügbar. Bitte Standortfreigabe erlauben.");
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  // Locate right away if the user already allowed it; otherwise wait for the button, so we don't prompt on load.
  // biome-ignore lint/correctness/useExhaustiveDependencies: run once on mount
  useEffect(() => {
    navigator.permissions
      ?.query({ name: "geolocation" })
      .then((p) => p.state === "granted" && locate(true))
      .catch(() => {});
  }, []);

  function showOnMap(id: string) {
    setFocusId(id);
    document.getElementById("karte")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 [&>*]:min-w-0">
        {summary}
        <Card className={cn("space-y-3", nearest && "border-brand/30 bg-brand-soft", !summary && "md:col-span-2")}>
          {nearest && nearest.km != null ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <button type="button" onClick={() => showOnMap(nearest.id)} className="min-w-0 text-left">
                  <div className="text-xs font-medium tracking-wide text-ink-2 uppercase">
                    {loggedIn ? "Dein nächster neuer Rewe" : "Nächster Rewe"}
                  </div>
                  <div className="truncate font-semibold">{nearest.name}</div>
                  <div className="truncate text-sm text-ink-2">
                    {nearest.address} · {nearest.district}
                  </div>
                </button>
                <div className="shrink-0 text-right text-lg font-semibold tabular-nums">
                  {formatDistance(nearest.km)}
                </div>
              </div>
              <div className="flex gap-2">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${nearest.lat},${nearest.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 grow items-center justify-center gap-1.5 rounded-lg bg-brand px-3 text-sm font-medium text-white hover:bg-brand-hover sm:grow-0"
                >
                  <Navigation className="size-4" /> Route
                </a>
                <LinkButton
                  href={(loggedIn ? `/besuch/neu?markt=${nearest.id}` : `/markt/${nearest.id}`) as Route}
                  variant="secondary"
                  size="sm"
                  className="grow sm:grow-0"
                >
                  {loggedIn ? (
                    <>
                      <Plus /> Eintragen
                    </>
                  ) : (
                    "Details"
                  )}
                </LinkButton>
              </div>
              {next.length > 0 && (
                <div className="flex flex-wrap gap-x-3 gap-y-1 border-t border-brand/20 pt-2 text-xs text-ink-2">
                  <span className="text-muted">Danach:</span>
                  {next.slice(0, 2).map((s) => (
                    <button key={s.id} type="button" onClick={() => showOnMap(s.id)} className="hover:text-ink">
                      {s.name} <span className="tabular-nums">· {formatDistance(s.km ?? 0)}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : position ? (
            <div className="text-sm">
              <span className="font-semibold">Alle Rewes besucht.</span>{" "}
              <span className="text-ink-2">Berlin ist komplett, Respekt!</span>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 text-sm">
                <div className="font-semibold">
                  {loggedIn ? "Wo ist dein nächster neuer Rewe?" : "Wo ist der nächste Rewe?"}
                </div>
                <div className="text-ink-2">Mit deinem Standort zeigen wir Entfernungen.</div>
              </div>
              <Button size="sm" onClick={() => locate()} disabled={locating} className="shrink-0">
                <LocateFixed />
                {locating ? "Suche…" : "Orten"}
              </Button>
            </div>
          )}
        </Card>
      </div>

      <div id="karte" className="scroll-mt-20">
        <StoreMap stores={stores} statuses={statuses} focusId={focusId} userPosition={position} canLog={loggedIn} />
      </div>

      {children}

      <section className="space-y-2">
        <div className="flex items-baseline justify-between">
          <h2 className="font-semibold">Alle Märkte</h2>
          <span className="text-sm text-muted">
            {visible.length} {visible.length === 1 ? "Markt" : "Märkte"}
            {position && " · nach Entfernung"}
          </span>
        </div>
        <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name, Straße, PLZ, Bezirk…"
              className="pl-9"
              aria-label="Märkte durchsuchen"
            />
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-2 sm:contents">
            <Select value={district} onChange={(e) => setDistrict(e.target.value)} aria-label="Bezirk">
              <option value="">Alle Bezirke</option>
              {districts.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </Select>
            {loggedIn && (
              // biome-ignore lint/a11y/useSemanticElements: segmented control, not a form fieldset
              <div role="group" aria-label="Status" className="flex h-11 rounded-lg border border-line bg-surface p-1">
                {FILTERS.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setFilter(f.value)}
                    aria-pressed={filter === f.value}
                    className={cn(
                      "rounded-md px-2.5 text-sm font-medium transition-colors",
                      filter === f.value ? "bg-surface-2 text-ink" : "text-muted hover:text-ink",
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
          {rows.map((s) => {
            const status = statuses[s.id];
            return (
              <li key={s.id} className="flex items-center gap-3 px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => showOnMap(s.id)}
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full border-2",
                    status ? "border-series bg-series text-white" : "border-baseline text-muted",
                  )}
                  aria-label={`${s.name} auf der Karte zeigen`}
                >
                  {status && <Check className="size-3.5" />}
                </button>
                <Link href={`/markt/${s.id}`} className="min-w-0 grow">
                  <div className="truncate text-sm font-medium">{s.name}</div>
                  <div className="truncate text-xs text-ink-2">
                    {s.address} · {s.district}
                  </div>
                </Link>
                <div className="shrink-0 text-right text-xs text-ink-2 tabular-nums">
                  {status && <div className="text-sm font-medium text-ink">{formatRating(status.avg)} ★</div>}
                  {s.km != null && <div>{formatDistance(s.km)}</div>}
                </div>
              </li>
            );
          })}
          {visible.length === 0 && <li className="px-4 py-8 text-center text-sm text-ink-2">Keine Märkte gefunden.</li>}
        </ul>
        {rows.length < visible.length && (
          <Button variant="secondary" className="w-full" onClick={() => setExpanded(true)}>
            Alle {visible.length} anzeigen
          </Button>
        )}
      </section>
    </div>
  );
}
