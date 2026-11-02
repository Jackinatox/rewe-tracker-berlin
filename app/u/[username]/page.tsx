import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RatingTrendChart, VisitsPerMonthChart } from "@/components/dashboard-charts";
import { ShareButton } from "@/components/share-button";
import { Stars } from "@/components/stars";
import { StoreMap } from "@/components/store-map-lazy";
import { Card, CardTitle, LinkButton, Pill, ProgressBar } from "@/components/ui";
import { VisitCard } from "@/components/visit-card";
import { getSession } from "@/lib/auth";
import { computeBadges } from "@/lib/badges";
import { getUserByUsername, getVisits, MAP_STORES, toStatuses } from "@/lib/queries";
import { CATEGORIES, formatRating } from "@/lib/ratings";
import { computeStats, type StoreScore } from "@/lib/stats";
import { formatDate } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/u/[username]">): Promise<Metadata> {
  const user = await getUserByUsername((await params).username);
  if (!user) return { title: "Nicht gefunden" };
  const visits = await getVisits(user.id);
  const stats = computeStats(visits);
  return {
    title: `${user.name}s Rewe-Dashboard`,
    description: `${user.name} war in ${stats.visitedStores} von ${stats.totalStores} Berliner Rewes.`,
  };
}

export default async function DashboardPage({ params }: PageProps<"/u/[username]">) {
  const user = await getUserByUsername((await params).username);
  if (!user) notFound();

  const [session, visits] = await Promise.all([getSession(), getVisits(user.id)]);
  const isOwn = session?.user.id === user.id;
  const stats = computeStats(visits);
  const badges = computeBadges(stats, visits);
  const earned = badges.filter((b) => b.earned).length;
  const pct = Math.round((stats.visitedStores / stats.totalStores) * 100);

  const top = stats.ranked.slice(0, 5);
  const flop = stats.ranked.length > 5 ? stats.ranked.slice(-Math.min(5, stats.ranked.length - 5)).reverse() : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{user.name}</h1>
          <p className="text-sm text-ink-2">
            @{user.username} · dabei seit {formatDate(user.createdAt)}
          </p>
        </div>
        {isOwn && (
          <div className="flex gap-2">
            <ShareButton path={`/u/${user.username}`} title={`${user.name}s Rewe-Dashboard`} />
            <LinkButton href="/besuch/neu" size="sm">
              <Plus /> Besuch
            </LinkButton>
          </div>
        )}
      </div>

      {/* Headline numbers */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="col-span-2 sm:col-span-1">
          <div className="text-sm text-ink-2">Rewes besucht</div>
          <div className="mt-1 text-3xl font-bold">
            {stats.visitedStores}
            <span className="text-lg font-medium text-muted"> / {stats.totalStores}</span>
          </div>
          <ProgressBar value={stats.visitedStores} max={stats.totalStores} className="mt-2" />
          <div className="mt-1 text-xs text-muted">{pct} % von Berlin</div>
        </Card>
        <Card>
          <div className="text-sm text-ink-2">Besuche</div>
          <div className="mt-1 text-3xl font-bold">{stats.totalVisits}</div>
        </Card>
        <Card>
          <div className="text-sm text-ink-2">Ø Wertung</div>
          <div className="mt-1 text-3xl font-bold">{stats.avgRating ? formatRating(stats.avgRating) : "–"}</div>
        </Card>
        <Card className="col-span-2 sm:col-span-1">
          <div className="text-sm text-ink-2">Lieblings-Rewe</div>
          {stats.ranked[0] ? (
            <Link href={`/markt/${stats.ranked[0].store.id}`} className="mt-1 block font-semibold hover:text-brand">
              {stats.ranked[0].store.name}
              <span className="block text-sm font-normal text-ink-2">
                {formatRating(stats.ranked[0].avg)} ★ · {stats.ranked[0].store.district}
              </span>
            </Link>
          ) : (
            <div className="mt-1 text-3xl font-bold">–</div>
          )}
        </Card>
      </div>

      {stats.totalVisits === 0 && (
        <Card className="text-center">
          <p className="text-ink-2">
            {isOwn ? "Noch keine Besuche. Trag deinen ersten Rewe ein!" : `${user.name} hat noch keine Besuche.`}
          </p>
          {isOwn && (
            <LinkButton href="/besuch/neu" className="mt-3">
              <Plus /> Ersten Besuch eintragen
            </LinkButton>
          )}
        </Card>
      )}

      <StoreMap stores={MAP_STORES} statuses={toStatuses(visits)} className="h-[45vh]" canLog={isOwn} />

      {stats.ranked.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 [&>*]:min-w-0">
          <Card>
            <CardTitle>{flop.length > 0 ? "Top 5" : "Ranking"}</CardTitle>
            <RankList scores={top} start={1} />
          </Card>
          {flop.length > 0 && (
            <Card>
              <CardTitle>Flop 5</CardTitle>
              <RankList scores={flop} start={stats.ranked.length} descending />
            </Card>
          )}
        </div>
      )}

      {stats.totalVisits > 0 && (
        <div className="grid gap-4 md:grid-cols-2 [&>*]:min-w-0">
          <Card>
            <CardTitle>Besuche pro Monat</CardTitle>
            <VisitsPerMonthChart data={stats.months} />
          </Card>
          <Card>
            <CardTitle>Ø Wertung pro Monat</CardTitle>
            <RatingTrendChart data={stats.months} />
          </Card>
          <details className="text-sm text-ink-2 md:col-span-2">
            <summary className="cursor-pointer">Monatswerte als Tabelle</summary>
            <table className="mt-2 w-full max-w-md text-left tabular-nums">
              <thead className="text-muted">
                <tr>
                  <th className="py-1 font-medium">Monat</th>
                  <th className="py-1 text-right font-medium">Besuche</th>
                  <th className="py-1 text-right font-medium">Ø Wertung</th>
                </tr>
              </thead>
              <tbody>
                {stats.months.map((m) => (
                  <tr key={m.key} className="border-t border-line">
                    <td className="py-1">{m.label}</td>
                    <td className="py-1 text-right">{m.visits}</td>
                    <td className="py-1 text-right">{m.avg == null ? "–" : formatRating(m.avg)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 [&>*]:min-w-0">
        <Card>
          <CardTitle>Bezirke</CardTitle>
          <ul className="space-y-2.5">
            {stats.districts.map((d) => (
              <li key={d.name}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{d.name}</span>
                  <span className="text-ink-2 tabular-nums">
                    {d.visited} / {d.total}
                    {d.visited === d.total && " ✓"}
                  </span>
                </div>
                <ProgressBar value={d.visited} max={d.total} />
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardTitle>
            Abzeichen{" "}
            <span className="font-normal text-muted">
              {earned} / {badges.length}
            </span>
          </CardTitle>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {badges.map((b) => (
              <li
                key={b.id}
                className={`rounded-lg border p-2.5 text-center ${b.earned ? "border-line bg-surface-2" : "border-dashed border-line"}`}
                title={b.description}
              >
                <div className={`text-2xl ${b.earned ? "" : "opacity-30 grayscale"}`} aria-hidden>
                  {b.icon}
                </div>
                <div className={`mt-1 text-xs font-semibold ${b.earned ? "" : "text-muted"}`}>{b.title}</div>
                <div className="text-[11px] leading-tight text-muted">
                  {b.earned ? b.description : (b.progress ?? b.description)}
                </div>
                <span className="sr-only">{b.earned ? "erreicht" : "noch nicht erreicht"}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {visits.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-semibold">Letzte Besuche</h2>
          {visits.slice(0, 10).map((v) => (
            <VisitCard key={v.id} visit={v} showStore editable={isOwn} />
          ))}
        </section>
      )}
    </div>
  );
}

function RankList({
  scores,
  start,
  descending = false,
}: {
  scores: StoreScore[];
  start: number;
  descending?: boolean;
}) {
  return (
    <ol className="space-y-3">
      {scores.map((s, i) => (
        <li key={s.store.id} className="flex gap-3">
          <span className="w-6 shrink-0 pt-0.5 text-right text-sm font-semibold text-muted tabular-nums">
            {descending ? start - i : start + i}.
          </span>
          <div className="min-w-0 grow">
            <div className="flex items-start justify-between gap-2">
              <Link href={`/markt/${s.store.id}`} className="truncate font-medium hover:text-brand">
                {s.store.name}
              </Link>
              <Stars value={s.avg} size={13} />
            </div>
            <div className="text-xs text-muted">
              {s.store.district} · {s.visits} {s.visits === 1 ? "Besuch" : "Besuche"}
            </div>
            {Object.keys(s.categories).length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {CATEGORIES.filter(({ key }) => s.categories[key] != null).map(({ key, label }) => (
                  <Pill key={key}>
                    {label} {formatRating(s.categories[key] as number)}
                  </Pill>
                ))}
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
