"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import type { LatLng } from "@/lib/geo";
import { formatRating, RATING_RAMP, ratingColor, UNVISITED_COLOR } from "@/lib/ratings";

export interface MapStore {
  id: string;
  name: string;
  address: string;
  district: string;
  lat: number;
  lng: number;
}

/** The viewer's own result for a store, when logged in. */
export interface StoreStatus {
  avg: number;
  visits: number;
}

export interface StoreMapProps {
  stores: MapStore[];
  statuses?: Record<string, StoreStatus>;
  focusId?: string | null;
  userPosition?: LatLng | null;
  showLegend?: boolean;
  canLog?: boolean;
  className?: string;
}

const BERLIN: [number, number] = [52.515, 13.405];
// Canvas with a hit tolerance gives the small pins a finger-sized click target.
const renderer = typeof window === "undefined" ? undefined : L.canvas({ tolerance: 8 });

function FocusStore({ store, markers }: { store?: MapStore; markers: Map<string, L.CircleMarker> }) {
  const map = useMap();
  useEffect(() => {
    if (!store) return;
    map.flyTo([store.lat, store.lng], Math.max(map.getZoom(), 14), { duration: 0.6 });
    const t = setTimeout(() => markers.get(store.id)?.openPopup(), 650);
    return () => clearTimeout(t);
  }, [map, store, markers]);
  return null;
}

export default function StoreMap({
  stores,
  statuses = {},
  focusId,
  userPosition,
  showLegend = true,
  canLog = false,
  className,
}: StoreMapProps) {
  const markers = useRef(new Map<string, L.CircleMarker>()).current;
  const focus = focusId ? stores.find((s) => s.id === focusId) : undefined;
  // Draw visited pins last so they sit on top of the hollow ones.
  const ordered = [...stores].sort((a, b) => Number(!!statuses[a.id]) - Number(!!statuses[b.id]));

  return (
    <div className={`relative overflow-hidden rounded-xl border border-line ${className ?? "h-[55vh]"}`}>
      <MapContainer
        center={BERLIN}
        zoom={11}
        minZoom={10}
        scrollWheelZoom
        className="h-full w-full"
        renderer={renderer}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {ordered.map((store) => {
          const status = statuses[store.id];
          return (
            <CircleMarker
              key={store.id}
              center={[store.lat, store.lng]}
              ref={(m) => {
                if (m) markers.set(store.id, m);
                else markers.delete(store.id);
              }}
              radius={status ? 8 : 6}
              pathOptions={
                status
                  ? { color: "#ffffff", weight: 2, fillColor: ratingColor(status.avg), fillOpacity: 1 }
                  : { color: UNVISITED_COLOR, weight: 2, fillColor: "#ffffff", fillOpacity: 0.9 }
              }
            >
              <Tooltip direction="top" offset={[0, -6]}>
                {store.name}
              </Tooltip>
              <Popup>
                <div className="min-w-44 space-y-1">
                  <div className="font-semibold">{store.name}</div>
                  <div className="text-xs text-ink-2">
                    {store.address} · {store.district}
                  </div>
                  <div className="text-xs">
                    {status
                      ? `Wertung: ${formatRating(status.avg)} ★ · ${status.visits} ${status.visits === 1 ? "Besuch" : "Besuche"}`
                      : "Noch nicht besucht"}
                  </div>
                  <div className="flex gap-3 pt-1 text-sm font-medium">
                    <Link href={`/markt/${store.id}`} className="text-brand!">
                      Details
                    </Link>
                    {canLog && (
                      <Link href={`/besuch/neu?markt=${store.id}`} className="text-brand!">
                        Besuch eintragen
                      </Link>
                    )}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
        {userPosition && (
          <CircleMarker
            center={[userPosition.lat, userPosition.lng]}
            radius={7}
            pathOptions={{ color: "#ffffff", weight: 3, fillColor: "#cc071e", fillOpacity: 1 }}
          >
            <Tooltip permanent direction="top" offset={[0, -8]}>
              Du
            </Tooltip>
          </CircleMarker>
        )}
        <FocusStore store={focus} markers={markers} />
      </MapContainer>
      {showLegend && <MapLegend withRatings={Object.keys(statuses).length > 0} />}
    </div>
  );
}

function MapLegend({ withRatings }: { withRatings: boolean }) {
  return (
    <div className="pointer-events-none absolute bottom-2 left-2 z-[400] rounded-lg border border-line bg-surface/95 px-2.5 py-1.5 text-[11px] text-ink-2 shadow-sm">
      <div className="flex items-center gap-1.5">
        <span
          className="inline-block size-2.5 rounded-full border-2 bg-white"
          style={{ borderColor: UNVISITED_COLOR }}
        />
        Nicht besucht
      </div>
      {withRatings && (
        <div className="mt-1 flex items-center gap-1">
          <span>1★</span>
          {RATING_RAMP.map((c) => (
            <span key={c} className="inline-block size-2.5 rounded-full" style={{ background: c }} />
          ))}
          <span>5★</span>
          <span className="ml-1 text-muted">Ø-Wertung</span>
        </div>
      )}
    </div>
  );
}
