import { Pencil } from "lucide-react";
import Link from "next/link";
import type { VisitWithPhotos } from "@/lib/queries";
import { CATEGORIES, formatRating } from "@/lib/ratings";
import { getStore } from "@/lib/stores";
import { formatDate } from "@/lib/utils";
import { Stars } from "./stars";
import { Pill } from "./ui";

export function VisitCard({
  visit,
  editable = false,
  showStore = false,
}: {
  visit: VisitWithPhotos;
  editable?: boolean;
  showStore?: boolean;
}) {
  const store = showStore ? getStore(visit.storeId) : undefined;
  const scores = CATEGORIES.filter(({ key }) => visit[key] != null);

  return (
    <article className="space-y-2 rounded-xl border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {store && (
            <Link href={`/markt/${store.id}`} className="block truncate font-semibold hover:text-brand">
              {store.name}
            </Link>
          )}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Stars value={visit.overall} />
            <time className="text-sm text-ink-2" dateTime={visit.visitedAt.toISOString().slice(0, 10)}>
              {formatDate(visit.visitedAt)}
            </time>
          </div>
        </div>
        {editable && (
          <Link
            href={`/besuch/${visit.id}/bearbeiten`}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-ink-2 hover:bg-surface-2"
            aria-label="Besuch bearbeiten"
          >
            <Pencil className="size-4" />
          </Link>
        )}
      </div>
      {scores.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {scores.map(({ key, label }) => (
            <Pill key={key}>
              {label} {formatRating(visit[key] as number).replace(",0", "")}★
            </Pill>
          ))}
        </div>
      )}
      {visit.note && <p className="text-sm whitespace-pre-line text-ink-2">{visit.note}</p>}
      {visit.photos.length > 0 && <PhotoStrip photos={visit.photos} />}
    </article>
  );
}

export function PhotoStrip({ photos }: { photos: { id: string; url: string; width: number; height: number }[] }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {photos.map((p) => (
        <a key={p.id} href={p.url} target="_blank" rel="noreferrer" className="shrink-0">
          {/* biome-ignore lint/performance/noImgElement: photos are already resized WebP */}
          <img
            src={p.url}
            alt="Foto vom Besuch"
            width={p.width}
            height={p.height}
            loading="lazy"
            className="h-28 w-auto rounded-lg border border-line object-cover"
          />
        </a>
      ))}
    </div>
  );
}
