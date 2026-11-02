import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { StoreExplorer } from "@/components/store-explorer";
import { LinkButton, ProgressBar } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { getVisits, MAP_STORES, toStatuses } from "@/lib/queries";
import { DISTRICTS, STORES } from "@/lib/stores";

export default async function HomePage() {
  const session = await getSession();
  const statuses = session ? toStatuses(await getVisits(session.user.id)) : {};
  const visited = Object.keys(statuses).length;

  return (
    <div className="space-y-4">
      {session ? (
        <Link
          href={`/u/${session.user.username}`}
          className="flex items-center gap-4 rounded-xl border border-line bg-surface p-4 hover:bg-surface-2"
        >
          <div className="grow space-y-2">
            <div className="text-sm text-ink-2">
              Hallo {session.user.name}, du warst in <span className="font-semibold text-ink">{visited}</span> von{" "}
              {STORES.length} Rewes.
            </div>
            <ProgressBar value={visited} max={STORES.length} />
          </div>
          <ArrowRight className="size-5 shrink-0 text-muted" />
        </Link>
      ) : (
        <div className="space-y-3 rounded-xl border border-line bg-surface p-5">
          <h1 className="text-2xl font-bold tracking-tight">Welcher Rewe in Berlin ist der beste?</h1>
          <p className="text-ink-2">
            {STORES.length} Märkte, ein Ziel: Trag deine Besuche ein, bewerte Frische, Auswahl und Kassen – und teile
            dein Dashboard mit Freunden.
          </p>
          <div className="flex gap-2">
            <LinkButton href="/registrieren">Kostenlos registrieren</LinkButton>
            <LinkButton href="/anmelden" variant="secondary">
              Anmelden
            </LinkButton>
          </div>
        </div>
      )}

      <StoreExplorer stores={MAP_STORES} districts={DISTRICTS} statuses={statuses} loggedIn={!!session} />
    </div>
  );
}
