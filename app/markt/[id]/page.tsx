import { Clock, ExternalLink, MapPin, Navigation, Plus } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SavedToast } from "@/components/saved-toast";
import { Stars } from "@/components/stars";
import { Card, CardTitle, LinkButton, Pill } from "@/components/ui";
import { VisitCard } from "@/components/visit-card";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { CATEGORIES, formatRating } from "@/lib/ratings";
import { scoreStores } from "@/lib/stats";
import { getStore } from "@/lib/stores";

export async function generateMetadata({ params }: PageProps<"/markt/[id]">): Promise<Metadata> {
  const store = getStore((await params).id);
  return { title: store?.name ?? "Markt" };
}

export default async function StorePage({ params, searchParams }: PageProps<"/markt/[id]">) {
  const { id } = await params;
  const store = getStore(id);
  if (!store) notFound();

  const session = await getSession();
  const visits = session
    ? await db.visit.findMany({
        where: { userId: session.user.id, storeId: id },
        include: { photos: { orderBy: { createdAt: "asc" } } },
        orderBy: [{ visitedAt: "desc" }, { createdAt: "desc" }],
      })
    : [];
  const score = scoreStores(visits).get(id);
  const saved = (await searchParams).gespeichert === "1";

  return (
    <div className="space-y-4">
      {saved && <SavedToast />}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">{store.name}</h1>
          {store.format !== "REWE" && <Pill>{store.format}</Pill>}
        </div>
        <p className="flex items-center gap-1.5 text-ink-2">
          <MapPin className="size-4 shrink-0" />
          {store.address}, {store.postcode} Berlin · {store.district}
        </p>
        {store.googleRating != null && (
          <p className="flex items-center gap-2 text-sm text-ink-2">
            Google: <Stars value={store.googleRating} size={14} />
            <span className="text-muted">({store.googleRatingCount?.toLocaleString("de-DE")} Bewertungen)</span>
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {session ? (
          <LinkButton href={`/besuch/neu?markt=${store.id}`}>
            <Plus /> Besuch eintragen
          </LinkButton>
        ) : (
          <LinkButton href={`/anmelden?next=/markt/${store.id}`}>Anmelden zum Bewerten</LinkButton>
        )}
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}&destination_place_id=${store.googlePlaceId}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-11 items-center gap-2 rounded-lg border border-line bg-surface px-4 text-sm font-medium hover:bg-surface-2"
        >
          <Navigation className="size-4" /> Route
        </a>
        <a
          href={store.googleMapsUri}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-11 items-center gap-2 rounded-lg border border-line bg-surface px-4 text-sm font-medium hover:bg-surface-2"
        >
          <ExternalLink className="size-4" /> Google Maps
        </a>
      </div>

      {score && (
        <Card>
          <CardTitle>Deine Wertung</CardTitle>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className="text-4xl font-bold">{formatRating(score.avg)}</span>
            <Stars value={score.avg} size={20} showValue={false} />
            <span className="text-sm text-ink-2">
              Ø aus {score.visits} {score.visits === 1 ? "Besuch" : "Besuchen"}
            </span>
          </div>
          {Object.keys(score.categories).length > 0 && (
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
              {CATEGORIES.filter(({ key }) => score.categories[key] != null).map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between gap-2 text-sm">
                  <dt className="text-ink-2">{label}</dt>
                  <dd className="font-medium tabular-nums">{formatRating(score.categories[key] as number)}</dd>
                </div>
              ))}
            </dl>
          )}
        </Card>
      )}

      {session && (
        <section className="space-y-2">
          <h2 className="font-semibold">Deine Besuche</h2>
          {visits.length === 0 && (
            <p className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-ink-2">
              Du warst hier noch nicht. Zeit für einen Einkauf!
            </p>
          )}
          {visits.map((v) => (
            <VisitCard key={v.id} visit={v} editable />
          ))}
        </section>
      )}

      {store.openingHours.length > 0 && (
        <Card>
          <CardTitle className="flex items-center gap-2">
            <Clock className="size-4" /> Öffnungszeiten
          </CardTitle>
          <ul className="space-y-0.5 text-sm text-ink-2">
            {store.openingHours.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted">Laut Google Maps, Stand November 2026</p>
        </Card>
      )}
    </div>
  );
}
