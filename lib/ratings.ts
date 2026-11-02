export const CATEGORIES = [
  { key: "freshness", label: "Frische", hint: "Obst, Gemüse, Brot" },
  { key: "selection", label: "Auswahl", hint: "Sortiment, Regionales, Spezielles" },
  { key: "crowding", label: "Andrang", hint: "5 = angenehm leer" },
  { key: "checkout", label: "Kasse", hint: "Wartezeit, SB-Kassen" },
  { key: "cleanliness", label: "Sauberkeit", hint: "Ordnung, aufgeräumte Regale" },
  { key: "staff", label: "Personal", hint: "Freundlich, hilfsbereit" },
] as const;

export type CategoryKey = (typeof CATEGORIES)[number]["key"];
export type CategoryScores = Partial<Record<CategoryKey, number | null>>;

/**
 * Ordinal one-hue ramp for a 1–5 average (index 0 = 1★). Validated with the dataviz palette
 * validator (--ordinal) against the OSM tile background, which the pins sit on in both color modes.
 */
export const RATING_RAMP = ["#6da7ec", "#3987e5", "#256abf", "#184f95", "#0d366b"] as const;
export const UNVISITED_COLOR = "#898781";

export function ratingColor(avg: number): string {
  const i = Math.min(4, Math.max(0, Math.round(avg) - 1));
  return RATING_RAMP[i] as string;
}

export const formatRating = (n: number) => n.toFixed(1).replace(".", ",");
