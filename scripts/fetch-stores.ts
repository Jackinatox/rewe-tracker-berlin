/**
 * One-off: builds data/stores.json from the Google Places API (New), cross-checked against OpenStreetMap.
 *
 *   bun --env-file=<file with GOOGLE_MAPS_API_KEY> scripts/fetch-stores.ts <bezirksgrenzen.geojson>
 *
 * The GeoJSON is Berlin's district boundaries:
 * https://tsb-opendata.s3.eu-central-1.amazonaws.com/bezirksgrenzen/bezirksgrenzen.geojson
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { type Districts, districtAt, haversineKm } from "../lib/geo";
import type { Store } from "../lib/stores";

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
if (!API_KEY) throw new Error("GOOGLE_MAPS_API_KEY is not set");

const geojsonPath = process.argv[2];
if (!geojsonPath) throw new Error("Usage: fetch-stores.ts <bezirksgrenzen.geojson>");

const geojson = JSON.parse(readFileSync(geojsonPath, "utf8"));
const districts: Districts = geojson.features.map(
  (f: { properties: { Gemeinde_name: string }; geometry: { coordinates: number[][][][] } }) => ({
    name: f.properties.Gemeinde_name,
    polygons: f.geometry.coordinates,
  }),
);

// Berlin's bounding box, a bit padded.
const BERLIN = { south: 52.33, west: 13.08, north: 52.68, east: 13.77 };
const GRID = Number(process.env.GRID ?? 6);
const QUERIES = (process.env.QUERIES ?? "REWE").split(",");
const PAGE_CAP = 60; // Text Search returns at most 3 pages of 20

interface Rect {
  south: number;
  west: number;
  north: number;
  east: number;
}

interface Place {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  postalAddress?: { postalCode?: string; locality?: string; addressLines?: string[] };
  location: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  types?: string[];
  primaryType?: string;
  businessStatus?: string;
  regularOpeningHours?: { weekdayDescriptions?: string[] };
}

let requests = 0;

async function searchRect(rect: Rect, textQuery: string): Promise<{ places: Place[]; capped: boolean }> {
  const places: Place[] = [];
  let pageToken = "";
  do {
    requests++;
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": API_KEY as string,
        "X-Goog-FieldMask": [
          "places.id",
          "places.displayName",
          "places.formattedAddress",
          "places.postalAddress",
          "places.location",
          "places.rating",
          "places.userRatingCount",
          "places.googleMapsUri",
          "places.types",
          "places.primaryType",
          "places.businessStatus",
          "places.regularOpeningHours.weekdayDescriptions",
          "nextPageToken",
        ].join(","),
      },
      body: JSON.stringify({
        textQuery,
        languageCode: "de",
        regionCode: "DE",
        pageSize: 20,
        pageToken,
        locationRestriction: {
          rectangle: {
            low: { latitude: rect.south, longitude: rect.west },
            high: { latitude: rect.north, longitude: rect.east },
          },
        },
      }),
    });
    const body = (await res.json()) as { places?: Place[]; nextPageToken?: string; error?: unknown };
    if (!res.ok) throw new Error(`Places API ${res.status}: ${JSON.stringify(body.error)}`);
    places.push(...(body.places ?? []));
    pageToken = body.nextPageToken ?? "";
  } while (pageToken && places.length < PAGE_CAP);
  return { places, capped: places.length >= PAGE_CAP };
}

function split(rect: Rect, n: number): Rect[] {
  const dLat = (rect.north - rect.south) / n;
  const dLng = (rect.east - rect.west) / n;
  const tiles: Rect[] = [];
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++)
      tiles.push({
        south: rect.south + i * dLat,
        north: rect.south + (i + 1) * dLat,
        west: rect.west + j * dLng,
        east: rect.west + (j + 1) * dLng,
      });
  return tiles;
}

// Raw API results are cached so the filters below can be tweaked without paying for requests again.
const CACHE = "scripts/.cache/places.json";
const found = new Map<string, Place>();
if (process.argv.includes("--cached") && existsSync(CACHE)) {
  for (const p of JSON.parse(readFileSync(CACHE, "utf8")) as Place[]) found.set(p.id, p);
  console.log(`Google: ${found.size} places from cache`);
} else {
  for (const textQuery of QUERIES) {
    const queue = split(BERLIN, GRID);
    while (queue.length > 0) {
      const rect = queue.shift() as Rect;
      const { places, capped } = await searchRect(rect, textQuery);
      for (const p of places) found.set(p.id, p);
      if (capped) {
        console.log(`  tile capped at ${places.length}, splitting`);
        queue.push(...split(rect, 2));
      }
    }
  }
  mkdirSync("scripts/.cache", { recursive: true });
  writeFileSync(CACHE, JSON.stringify([...found.values()], null, 2));
  console.log(`Google: ${found.size} unique places from ${requests} requests`);
}

// --- Filter to REWE / REWE City / REWE Center supermarkets inside Berlin ---
const EXCLUDE =
  /to\s*go|getränke|abhol|liefer|bäcker|lager|zentrale|bistro|parkplatz|paket|drive|markthalle|reisen|kantine|büro|verwaltung|fulfillment|kein ladengeschäft|\bdeli\b|express/i;
/** Hand fixes for addresses Google gets wrong, by place id. */
const ADDRESS_OVERRIDES: Record<string, string> = {
  // Google: "Friedrichstr, Atrium 60" — the store is in the Atrium building, Friedrichstraße 60.
  ChIJ6_iV89BRqEcRCr5Ntbe5cLA: "Friedrichstraße 60",
};
const GROCERY_TYPES = new Set(["supermarket", "grocery_store", "food_store", "convenience_store"]);
const rejected: string[] = [];
const suspicious: string[] = [];
const stores: Store[] = [];
const usedIds = new Set<string>();

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

for (const p of found.values()) {
  const name = p.displayName?.text ?? "";
  const lat = p.location.latitude;
  const lng = p.location.longitude;
  const why = !/^rewe\b/i.test(name)
    ? "name"
    : EXCLUDE.test(name)
      ? "excluded name"
      : p.businessStatus === "CLOSED_PERMANENTLY"
        ? "closed"
        : !p.types?.some((t) => GROCERY_TYPES.has(t))
          ? `types ${p.types?.join("/")}`
          : null;
  const district = districtAt(districts, lat, lng);
  if (why || !district) {
    if (/rewe/i.test(name)) rejected.push(`${why ?? "outside Berlin"}: ${name} — ${p.formattedAddress}`);
    continue;
  }

  const format = /\bcity\b/i.test(name) ? "REWE City" : /\bcenter\b/i.test(name) ? "REWE Center" : "REWE";
  // Corner stores and malls have several address lines ("Forum Köp, Bahnhofstraße 33-38"); use the first one
  // with a house number.
  const lines = p.postalAddress?.addressLines ?? [p.formattedAddress?.split(",")[0] ?? ""];
  const street = ADDRESS_OVERRIDES[p.id] ?? lines.find((l) => /\d/.test(l)) ?? lines.at(-1) ?? "";

  if ((p.userRatingCount ?? 0) < 30 || !p.regularOpeningHours)
    suspicious.push(
      `${name} — ${street} (${p.primaryType}, ${p.userRatingCount ?? 0} ratings, ${p.regularOpeningHours?.weekdayDescriptions?.[0] ?? "no hours"}) ${p.id}`,
    );

  // Google sometimes lists one store twice (e.g. once under the operator's company name). Keep the better-known one.
  const twin = stores.findIndex((s) => haversineKm(s, { lat, lng }) < 0.03);
  if (twin >= 0) {
    const other = stores[twin] as Store;
    if ((other.googleRatingCount ?? 0) >= (p.userRatingCount ?? 0)) {
      rejected.push(`duplicate of ${other.address}: ${name} — ${p.formattedAddress}`);
      continue;
    }
    rejected.push(`duplicate of ${street}: ${other.name} — ${other.address}`);
    stores.splice(twin, 1);
  }

  stores.push({
    id: "",
    googlePlaceId: p.id,
    name: `${format} ${street.replace(/\s+\d+[\w\s\-/]*$/, "")}`.trim(),
    format,
    address: street,
    postcode: p.postalAddress?.postalCode ?? "",
    district,
    lat,
    lng,
    googleRating: p.rating ?? null,
    googleRatingCount: p.userRatingCount ?? null,
    googleMapsUri: p.googleMapsUri ?? `https://www.google.com/maps/place/?q=place_id:${p.id}`,
    openingHours: p.regularOpeningHours?.weekdayDescriptions ?? [],
  });
}

stores.sort(
  (a, b) =>
    a.district.localeCompare(b.district, "de") ||
    a.name.localeCompare(b.name, "de") ||
    a.address.localeCompare(b.address, "de"),
);
// Slug ids from format + street, e.g. "rewe-city-john-schehr-strasse-20"; postcode only to break ties.
for (const s of stores) {
  s.id = slugify(`${s.format} ${s.address}`);
  if (usedIds.has(s.id)) s.id = `${s.id}-${s.postcode}`;
  usedIds.add(s.id);
}

// --- Cross-check against OpenStreetMap ---
const overpass = `[out:json][timeout:90];
area["ISO3166-2"="DE-BE"]["admin_level"="4"]->.berlin;
(
  nwr["shop"="supermarket"]["brand"~"^REWE",i](area.berlin);
  nwr["shop"="supermarket"]["name"~"^REWE",i](area.berlin);
);
out center tags;`;
const osmRes = await fetch("https://overpass-api.de/api/interpreter", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "rewe-tracker/1.0" },
  body: new URLSearchParams({ data: overpass }),
});
const osm = (await osmRes.json()) as {
  elements: {
    type: string;
    id: number;
    lat?: number;
    lon?: number;
    center?: { lat: number; lon: number };
    tags: Record<string, string>;
  }[];
};
const osmStores = osm.elements
  .map((e) => ({
    label: `${e.tags.name ?? "?"} — ${e.tags["addr:street"] ?? "?"} ${e.tags["addr:housenumber"] ?? ""} (osm ${e.type}/${e.id})`,
    lat: e.lat ?? e.center?.lat ?? 0,
    lng: e.lon ?? e.center?.lon ?? 0,
    name: e.tags.name ?? "",
  }))
  .filter((o) => !EXCLUDE.test(o.name));

const MATCH_KM = 0.2;
const googleOnly = stores.filter((s) => !osmStores.some((o) => haversineKm(s, o) < MATCH_KM));
const osmOnly = osmStores.filter((o) => !stores.some((s) => haversineKm(s, o) < MATCH_KM));

mkdirSync("data", { recursive: true });
writeFileSync("data/stores.json", `${JSON.stringify(stores, null, 2)}\n`);

console.log(`\nKept ${stores.length} stores (OSM has ${osmStores.length})`);
console.log(`Requests used: ${requests}`);
console.log(`\nRejected REWE-named places (${rejected.length}):`);
for (const r of rejected.sort()) console.log(`  ${r}`);
console.log(`\nKept but suspicious, few ratings or no hours (${suspicious.length}):`);
for (const s of suspicious) console.log(`  ${s}`);
console.log(`\nIn Google but not OSM (${googleOnly.length}):`);
for (const s of googleOnly) console.log(`  ${s.name} — ${s.address}, ${s.district}`);
console.log(`\nIn OSM but not Google (${osmOnly.length}):`);
for (const o of osmOnly) console.log(`  ${o.label} @ ${o.lat.toFixed(5)},${o.lng.toFixed(5)}`);
