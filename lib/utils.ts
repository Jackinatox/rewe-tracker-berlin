import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

const DATE = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
export const formatDate = (d: Date) => DATE.format(d);

/** YYYY-MM-DD in Berlin time, for date inputs. */
export const todayInBerlin = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Berlin" });
