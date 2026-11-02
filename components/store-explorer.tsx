"use client";

import { Check, LocateFixed, Navigation, Search } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { formatDistance, haversineKm, type LatLng } from "@/lib/geo";
import { formatRating } from "@/lib/ratings";
import { cn, matchesQuery } from "@/lib/utils";
import { type MapStore, StoreMap, type StoreStatus } from "./store-map-lazy";
import { Button, Card, Input, LinkButton, Select } from "./ui";

type Filter = "all" | "visited" | "open";

export function StoreExplorer({
  stores,
  districts,
  statuses,
  loggedIn,
}: {
  stores: MapStore[];
  districts: string[];
  statuses: Record<string, StoreStatus>;
  loggedIn: boolean;
}) {
  const [query, setQuery] = useState("");
  const [district, setDistrict] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
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

  const nearest = position
    ? withDistance.filter((s) => !statuses[s.id]).sort((a, b) => (a.km ?? 0) - (b.km ?? 0))[0]
    : undefined;

  function locate() {
    if (!navigator.geolocation) return toast.error("Dein Browser unterstützt keine Standortabfrage.");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const here = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPosition(here);
        const next = stores
          .filter((s) => !statuses[s.id])
          .sort((a, b) => haversineKm(here, a) - haversineKm(here, b))[0];
        if (next) setFocusId(next.id);
      },
      () => {
        setLocating(false);
        toast.error("Standort nicht verfügbar. Bitte Standortfreigabe erlauben.");
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={locate} disabled={locating} className="grow sm:grow-0">
          <LocateFixed />
          {locating ? "Suche Standort…" : loggedIn ? "Nächster neuer Rewe" : "Nächster Rewe"}
        </Button>
      </div>

      {nearest && nearest.km != null && (
        <Card className="flex flex-wrap items-center justify-between gap-3 border-brand/30 bg-brand-soft">
          <div>
            <div className="text-xs font-medium tracking-wide text-ink-2 uppercase">
              {loggedIn ? "Nächster Rewe, in dem du noch nicht warst" : "Nächster Rewe"}
            </div>
            <div className="font-semibold">{nearest.name}</div>
            <div className="text-sm text-ink-2">
              {nearest.address} · {formatDistance(nearest.km)} entfernt
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${nearest.lat},${nearest.lng}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand px-3 text-sm font-medium text-white hover:bg-brand-hover"
            >
              <Navigation className="size-4" /> Route
            </a>
            <LinkButton href={`/markt/${nearest.id}` as Route} variant="secondary" size="sm">
              Details
            </LinkButton>
          </div>
        </Card>
      )}

      <StoreMap stores={stores} statuses={statuses} focusId={focusId} userPosition={position} canLog={loggedIn} />

      <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Straße, Bezirk…"
            className="pl-9"
            aria-label="Märkte durchsuchen"
          />
        </div>
        <Select value={district} onChange={(e) => setDistrict(e.target.value)} aria-label="Bezirk">
          <option value="">Alle Bezirke</option>
          {districts.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </Select>
        {loggedIn && (
          <Select value={filter} onChange={(e) => setFilter(e.target.value as Filter)} aria-label="Status">
            <option value="all">Alle Märkte</option>
            <option value="visited">Besucht</option>
            <option value="open">Noch nicht besucht</option>
          </Select>
        )}
      </div>

      <div className="text-sm text-ink-2">
        {visible.length} {visible.length === 1 ? "Markt" : "Märkte"}
        {position && " · nach Entfernung sortiert"}
      </div>

      <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
        {visible.map((s) => {
          const status = statuses[s.id];
          return (
            <li key={s.id} className="flex items-center gap-3 px-4 py-3">
              <button
                type="button"
                onClick={() => {
                  setFocusId(s.id);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border-2",
                  status ? "border-series bg-series text-white" : "border-baseline text-muted",
                )}
                aria-label={`${s.name} auf der Karte zeigen`}
              >
                {status && <Check className="size-4" />}
              </button>
              <Link href={`/markt/${s.id}`} className="min-w-0 grow">
                <div className="truncate font-medium">{s.name}</div>
                <div className="truncate text-sm text-ink-2">
                  {s.address} · {s.district}
                  {s.km != null && ` · ${formatDistance(s.km)}`}
                </div>
              </Link>
              {status && (
                <div className="shrink-0 text-right text-sm">
                  <div className="font-medium tabular-nums">{formatRating(status.avg)} ★</div>
                  <div className="text-xs text-muted">
                    {status.visits} {status.visits === 1 ? "Besuch" : "Besuche"}
                  </div>
                </div>
              )}
            </li>
          );
        })}
        {visible.length === 0 && <li className="px-4 py-8 text-center text-sm text-ink-2">Keine Märkte gefunden.</li>}
      </ul>
    </div>
  );
}
