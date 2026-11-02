import { CATEGORIES, type CategoryKey } from "./ratings";
import { DISTRICTS, STORES, type Store, storesInDistrict } from "./stores";

/** The fields of a visit the stats need; matches the Prisma Visit row. */
export type VisitLike = { storeId: string; visitedAt: Date; overall: number; photos?: unknown[] } & Record<
  CategoryKey,
  number | null
>;

export interface StoreScore {
  store: Store;
  visits: number;
  avg: number;
  categories: Partial<Record<CategoryKey, number>>;
  lastVisit: Date;
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

/** Per-store averages over a user's visits. */
export function scoreStores(visits: VisitLike[]): Map<string, StoreScore> {
  const grouped = new Map<string, VisitLike[]>();
  for (const v of visits) grouped.set(v.storeId, [...(grouped.get(v.storeId) ?? []), v]);

  const scores = new Map<string, StoreScore>();
  for (const [storeId, vs] of grouped) {
    const store = STORES.find((s) => s.id === storeId);
    if (!store) continue;
    const categories: StoreScore["categories"] = {};
    for (const { key } of CATEGORIES) {
      const xs = vs.map((v) => v[key]).filter((x): x is number => x != null);
      if (xs.length > 0) categories[key] = mean(xs);
    }
    scores.set(storeId, {
      store,
      visits: vs.length,
      avg: mean(vs.map((v) => v.overall)),
      categories,
      lastVisit: new Date(Math.max(...vs.map((v) => v.visitedAt.getTime()))),
    });
  }
  return scores;
}

const MONTH_LABEL = new Intl.DateTimeFormat("de-DE", { month: "short", year: "2-digit", timeZone: "UTC" });

export function computeStats(visits: VisitLike[], now = new Date()) {
  const scores = scoreStores(visits);
  const ranked = [...scores.values()].sort((a, b) => b.avg - a.avg || b.visits - a.visits);

  const districts = DISTRICTS.map((name) => ({
    name,
    total: storesInDistrict(name),
    visited: ranked.filter((s) => s.store.district === name).length,
  })).sort((a, b) => b.visited / b.total - a.visited / a.total || a.name.localeCompare(b.name, "de"));

  // Last 12 months including the current one, oldest first.
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11 + i, 1));
    const key = d.toISOString().slice(0, 7);
    const vs = visits.filter((v) => v.visitedAt.toISOString().slice(0, 7) === key);
    return {
      key,
      label: MONTH_LABEL.format(d),
      visits: vs.length,
      avg: vs.length ? Math.round(mean(vs.map((v) => v.overall)) * 10) / 10 : null,
    };
  });

  const mostVisited = [...scores.values()].sort((a, b) => b.visits - a.visits)[0];

  return {
    totalStores: STORES.length,
    visitedStores: scores.size,
    totalVisits: visits.length,
    totalPhotos: visits.reduce((n, v) => n + (v.photos?.length ?? 0), 0),
    avgRating: visits.length ? mean(visits.map((v) => v.overall)) : null,
    scores,
    ranked,
    districts,
    months,
    mostVisited: mostVisited && mostVisited.visits > 1 ? mostVisited : undefined,
  };
}

export type Stats = ReturnType<typeof computeStats>;
