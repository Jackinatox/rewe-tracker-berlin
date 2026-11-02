import "server-only";
import { cache } from "react";
import type { MapStore, StoreStatus } from "@/components/store-map";
import { db } from "./db";
import { scoreStores } from "./stats";
import { STORES } from "./stores";

/** Only what the map and list need, to keep the client payload small. */
export const MAP_STORES: MapStore[] = STORES.map(({ id, name, address, district, lat, lng }) => ({
  id,
  name,
  address,
  district,
  lat,
  lng,
}));

// cache(): generateMetadata and the page share one query per request.
export const getVisits = cache((userId: string) =>
  db.visit.findMany({
    where: { userId },
    include: { photos: { orderBy: { createdAt: "asc" } } },
    orderBy: [{ visitedAt: "desc" }, { createdAt: "desc" }],
  }),
);

export type VisitWithPhotos = Awaited<ReturnType<typeof getVisits>>[number];

export function toStatuses(visits: VisitWithPhotos[]): Record<string, StoreStatus> {
  return Object.fromEntries(
    [...scoreStores(visits).values()].map((s) => [s.store.id, { avg: s.avg, visits: s.visits }]),
  );
}

export const getUserByUsername = cache((username: string) =>
  db.user.findUnique({
    where: { username: username.toLowerCase() },
    select: { id: true, name: true, username: true, createdAt: true },
  }),
);
