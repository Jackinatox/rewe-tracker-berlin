import { CATEGORIES } from "./ratings";
import type { Stats, VisitLike } from "./stats";

export interface Badge {
  id: string;
  title: string;
  description: string;
  /** Emoji, shown large on the badge. */
  icon: string;
  earned: boolean;
  /** Shown on locked badges, e.g. "7 / 10". */
  progress?: string;
}

const count = (current: number, goal: number) => `${Math.min(current, goal)} / ${goal}`;

export function computeBadges(stats: Stats, visits: VisitLike[]): Badge[] {
  const maxVisitsOneStore = Math.max(0, ...[...stats.scores.values()].map((s) => s.visits));
  const completeDistricts = stats.districts.filter((d) => d.visited === d.total);
  const touchedDistricts = stats.districts.filter((d) => d.visited > 0).length;
  const fullReview = visits.some((v) => CATEGORIES.every(({ key }) => v[key] != null));

  const milestones = [10, 25, 50, 100].map(
    (n): Badge => ({
      id: `stores-${n}`,
      title: `${n} Rewes`,
      description: `${n} verschiedene Rewes besucht`,
      icon: n >= 100 ? "🏆" : n >= 50 ? "🥇" : n >= 25 ? "🥈" : "🥉",
      earned: stats.visitedStores >= n,
      progress: count(stats.visitedStores, n),
    }),
  );

  return [
    {
      id: "first",
      title: "Erster Einkauf",
      description: "Den ersten Besuch eingetragen",
      icon: "🛒",
      earned: stats.totalVisits > 0,
    },
    ...milestones,
    {
      id: "all",
      title: "Alle Rewes Berlins",
      description: `Alle ${stats.totalStores} Rewes besucht`,
      icon: "👑",
      earned: stats.visitedStores >= stats.totalStores,
      progress: count(stats.visitedStores, stats.totalStores),
    },
    {
      id: "district",
      title: "Bezirk komplett",
      description: completeDistricts.length
        ? `Alle Rewes in ${completeDistricts.map((d) => d.name).join(", ")}`
        : "Alle Rewes eines Bezirks besucht",
      icon: "🗺️",
      earned: completeDistricts.length > 0,
    },
    {
      id: "all-districts",
      title: "Stadtentdecker",
      description: "In jedem Bezirk mindestens einen Rewe besucht",
      icon: "🧭",
      earned: touchedDistricts === stats.districts.length,
      progress: count(touchedDistricts, stats.districts.length),
    },
    {
      id: "regular",
      title: "Stammkunde",
      description: "5 Besuche im selben Rewe",
      icon: "🔁",
      earned: maxVisitsOneStore >= 5,
      progress: count(maxVisitsOneStore, 5),
    },
    {
      id: "critic",
      title: "Gründlich",
      description: "Eine Bewertung mit allen Kategorien abgegeben",
      icon: "📝",
      earned: fullReview,
    },
    {
      id: "five-stars",
      title: "Volltreffer",
      description: "Einem Rewe 5 Sterne gegeben",
      icon: "⭐",
      earned: visits.some((v) => v.overall === 5),
    },
    {
      id: "photographer",
      title: "Fotograf",
      description: "10 Fotos hochgeladen",
      icon: "📸",
      earned: stats.totalPhotos >= 10,
      progress: count(stats.totalPhotos, 10),
    },
  ];
}
