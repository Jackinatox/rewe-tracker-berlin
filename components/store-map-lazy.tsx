"use client";

import dynamic from "next/dynamic";

/** Leaflet touches `window`, so the map only renders on the client. */
export const StoreMap = dynamic(() => import("./store-map"), {
  ssr: false,
  loading: () => <div className="h-[40vh] min-h-64 animate-pulse rounded-xl border border-line bg-surface-2" />,
});

export type { MapStore, StoreStatus } from "./store-map";
