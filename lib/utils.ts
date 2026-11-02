import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

const DATE = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
export const formatDate = (d: Date) => DATE.format(d);

/** YYYY-MM-DD in Berlin time, for date inputs. */
export const todayInBerlin = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Berlin" });

/** Lowercase, accent-free, ß → ss, so "strasse" finds "Straße" and "schoneberg" finds "Schöneberg". */
const fold = (s: string) =>
  s
    .toLowerCase()
    .replaceAll("ß", "ss")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

/** Matcher where every whitespace-separated word of the query must appear somewhere in the fields. */
export function matchesQuery(query: string) {
  const words = fold(query).split(/\s+/).filter(Boolean);
  return (...fields: string[]) => {
    const haystack = fold(fields.join(" "));
    return words.every((w) => haystack.includes(w));
  };
}
