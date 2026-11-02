import { ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import { Stars } from "@/components/stars";
import { StoreExplorer } from "@/components/store-explorer";
import { Card, CardTitle, LinkButton, ProgressBar } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { getVisits, MAP_STORES, toStatuses } from "@/lib/queries";
import { formatRating } from "@/lib/ratings";
import { computeStats } from "@/lib/stats";
import { DISTRICTS, getStore, STORES } from "@/lib/stores";
import { formatDate } from "@/lib/utils";

export default async function HomePage() {
  const session = await getSession();
  const visits = session ? await getVisits(session.user.id) : [];
  const stats = computeStats(visits);
  const pct = Math.round((stats.visitedStores / stats.totalStores) * 100);
  const touchedDistricts = stats.districts.filter((d) => d.visited > 0).length;
  // Districts that are started but not finished, closest to complete first.
  const almostDone = stats.districts
    .filter((d) => d.visited > 0 && d.visited < d.total)
    .sort((a, b) => a.total - a.visited - (b.total - b.visited) || b.visited / b.total - a.visited / a.total)
    .slice(0, 3);

  const summary = session ? (
    <Link
      href={`/u/${session.user.username}`}
      className="block space-y-2 rounded-xl border border-line bg-surface p-4 hover:bg-surface-2"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-ink-2">Hallo {session.user.name}</div>
        <span className="flex items-center gap-1 text-xs text-muted">
          Dashboard <ArrowRight className="size-3.5" />
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold tabular-nums">{stats.visitedStores}</span>
        <span className="text-ink-2">
          von {stats.totalStores} Rewes · {pct} %
        </span>
      </div>
      <ProgressBar value={stats.visitedStores} max={stats.totalStores} />
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2 tabular-nums">
        <span>
          <span className="font-semibold text-ink">{stats.totalVisits}</span>{" "}
          {stats.totalVisits === 1 ? "Besuch" : "Besuche"}
        </span>
        <span>
          Ø <span className="font-semibold text-ink">{stats.avgRating ? formatRating(stats.avgRating) : "–"}</span> ★
        </span>
        <span>
          <span className="font-semibold text-ink">{touchedDistricts}</span> / {DISTRICTS.length} Bezirke
        </span>
      </div>
    </Link>
  ) : (
    <div className="space-y-3 rounded-xl border border-line bg-surface p-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Welcher Rewe in Berlin ist der beste?</h1>
        <p className="mt-1 text-sm text-ink-2">
          {STORES.length} Märkte: Besuche eintragen, Frische, Auswahl und Kassen bewerten und dein Dashboard teilen.
        </p>
      </div>
      <div className="flex gap-2">
        <LinkButton href="/registrieren" size="sm">
          Kostenlos registrieren
        </LinkButton>
        <LinkButton href="/anmelden" variant="secondary" size="sm">
          Anmelden
        </LinkButton>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <StoreExplorer
        stores={MAP_STORES}
        districts={DISTRICTS}
        statuses={toStatuses(visits)}
        loggedIn={!!session}
        summary={summary}
      >
        {session &&
          (visits.length === 0 ? (
            <Card className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-ink-2">Noch keine Besuche. Warst du heute schon einkaufen?</p>
              <LinkButton href="/besuch/neu" size="sm">
                <Plus /> Ersten Besuch eintragen
              </LinkButton>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 [&>*]:min-w-0">
              <Card>
                <CardTitle className="flex items-baseline justify-between">
                  Zuletzt besucht
                  <Link href={`/u/${session.user.username}`} className="text-sm font-normal text-brand hover:underline">
                    Alle
                  </Link>
                </CardTitle>
                <ul className="space-y-2.5">
                  {visits.slice(0, 3).map((v) => (
                    <li key={v.id} className="flex items-center justify-between gap-3">
                      <Link href={`/markt/${v.storeId}`} className="min-w-0 hover:text-brand">
                        <div className="truncate text-sm font-medium">{getStore(v.storeId)?.name}</div>
                        <div className="text-xs text-muted">{formatDate(v.visitedAt)}</div>
                      </Link>
                      <Stars value={v.overall} size={13} showValue={false} />
                    </li>
                  ))}
                </ul>
              </Card>
              <Card>
                <CardTitle>{almostDone.length > 0 ? "Fast komplett" : "Bezirke"}</CardTitle>
                {almostDone.length > 0 ? (
                  <ul className="space-y-2.5">
                    {almostDone.map((d) => (
                      <li key={d.name}>
                        <div className="mb-1 flex justify-between gap-2 text-sm">
                          <span className="truncate">{d.name}</span>
                          <span className="shrink-0 text-xs text-ink-2 tabular-nums">
                            noch {d.total - d.visited} · {d.visited}/{d.total}
                          </span>
                        </div>
                        <ProgressBar value={d.visited} max={d.total} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-ink-2">Alle angefangenen Bezirke sind komplett.</p>
                )}
              </Card>
            </div>
          ))}
      </StoreExplorer>
    </div>
  );
}
