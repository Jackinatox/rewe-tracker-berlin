import storesJson from "../data/stores.json";

/** A Berlin Rewe, generated once by scripts/fetch-stores.ts. */
export interface Store {
  id: string;
  googlePlaceId: string;
  name: string;
  format: string;
  address: string;
  postcode: string;
  district: string;
  lat: number;
  lng: number;
  googleRating: number | null;
  googleRatingCount: number | null;
  googleMapsUri: string;
  openingHours: string[];
}

export const STORES = storesJson as Store[];

const byId = new Map(STORES.map((s) => [s.id, s]));
export const getStore = (id: string) => byId.get(id);

export const DISTRICTS = [...new Set(STORES.map((s) => s.district))].sort((a, b) => a.localeCompare(b, "de"));

export const storesInDistrict = (district: string) => STORES.filter((s) => s.district === district).length;
