"use client";

import { Camera, Loader2, Trash2, X } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteVisit, discardUpload, saveVisit } from "@/app/actions/visits";
import type { PhotoInput, PhotoMode } from "@/lib/photos";
import { CATEGORIES, type CategoryKey, type CategoryScores } from "@/lib/ratings";
import { uploadPhoto } from "@/lib/upload-client";
import { StarInput } from "./stars";
import type { MapStore } from "./store-map";
import { Button, Card, Input, Label, Select, Textarea } from "./ui";

const MAX_PHOTOS = 6;

export interface VisitFormInitial {
  id: string;
  storeId: string;
  visitedAt: string;
  overall: number;
  scores: CategoryScores;
  note: string;
  photos: PhotoInput[];
}

export function VisitForm({
  stores,
  districts,
  defaultStoreId,
  today,
  photoMode,
  userId,
  initial,
}: {
  stores: MapStore[];
  districts: string[];
  defaultStoreId?: string;
  today: string;
  photoMode: PhotoMode;
  userId: string;
  initial?: VisitFormInitial;
}) {
  const [storeId, setStoreId] = useState(initial?.storeId ?? defaultStoreId ?? "");
  const [visitedAt, setVisitedAt] = useState(initial?.visitedAt ?? today);
  const [overall, setOverall] = useState<number | null>(initial?.overall ?? null);
  const [scores, setScores] = useState<CategoryScores>(initial?.scores ?? {});
  const [note, setNote] = useState(initial?.note ?? "");
  const [photos, setPhotos] = useState<PhotoInput[]>(initial?.photos ?? []);
  const [uploading, setUploading] = useState(0);
  const [showDetails, setShowDetails] = useState(Object.values(initial?.scores ?? {}).some((v) => v != null));
  const [pending, startTransition] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);
  const savedPhotos = new Set(initial?.photos.map((p) => p.pathname));

  async function addPhotos(files: FileList | null) {
    if (!files || !photoMode) return;
    const list = [...files].slice(0, MAX_PHOTOS - photos.length);
    if (list.length < files.length) toast.info(`Maximal ${MAX_PHOTOS} Fotos pro Besuch`);
    setUploading((n) => n + list.length);
    await Promise.all(
      list.map(async (file) => {
        try {
          const photo = await uploadPhoto(file, photoMode, userId);
          setPhotos((ps) => [...ps, photo]);
        } catch (e) {
          toast.error((e as Error).message || "Foto-Upload fehlgeschlagen");
        } finally {
          setUploading((n) => n - 1);
        }
      }),
    );
    if (fileInput.current) fileInput.current.value = "";
  }

  function removePhoto(photo: PhotoInput) {
    setPhotos((ps) => ps.filter((p) => p.pathname !== photo.pathname));
    // Photos already attached to the saved visit are deleted when the visit is saved.
    if (!savedPhotos.has(photo.pathname)) void discardUpload(photo);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!storeId) return toast.error("Bitte einen Markt auswählen");
    if (!overall) return toast.error("Bitte eine Gesamtwertung vergeben");
    startTransition(async () => {
      const result = await saveVisit(initial?.id ?? null, {
        storeId,
        visitedAt,
        overall,
        ...scores,
        note,
        photos,
      });
      if (result?.error) toast.error(result.error);
    });
  }

  function remove() {
    if (!initial || !confirm("Diesen Besuch wirklich löschen?")) return;
    startTransition(async () => {
      const result = await deleteVisit(initial.id);
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Card className="space-y-4">
        <div>
          <Label htmlFor="store">Markt</Label>
          <Select id="store" value={storeId} onChange={(e) => setStoreId(e.target.value)} required>
            <option value="" disabled>
              Markt auswählen…
            </option>
            {districts.map((d) => (
              <optgroup key={d} label={d}>
                {stores
                  .filter((s) => s.district === d)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} – {s.address}
                    </option>
                  ))}
              </optgroup>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="date">Datum</Label>
          <Input
            id="date"
            type="date"
            value={visitedAt}
            max={today}
            onChange={(e) => setVisitedAt(e.target.value)}
            required
          />
        </div>
      </Card>

      <Card>
        <div className="mb-1 text-sm font-medium text-ink-2">Gesamtwertung</div>
        <StarInput value={overall} onChange={setOverall} label="Gesamtwertung" size="lg" />
      </Card>

      <Card>
        <button
          type="button"
          onClick={() => setShowDetails((s) => !s)}
          className="flex w-full items-center justify-between text-left text-sm font-medium"
          aria-expanded={showDetails}
        >
          <span>
            Details bewerten <span className="font-normal text-muted">(optional)</span>
          </span>
          <span className="text-brand">{showDetails ? "Ausblenden" : "Anzeigen"}</span>
        </button>
        {showDetails && (
          <div className="mt-3 divide-y divide-line">
            {CATEGORIES.map(({ key, label, hint }) => (
              <div key={key} className="flex flex-wrap items-center justify-between gap-x-4 py-1.5">
                <div>
                  <div className="text-sm font-medium">{label}</div>
                  <div className="text-xs text-muted">{hint}</div>
                </div>
                <StarInput
                  value={scores[key] ?? null}
                  onChange={(v) => setScores((s) => ({ ...s, [key as CategoryKey]: v }))}
                  label={label}
                  clearable
                />
              </div>
            ))}
            <p className="pt-2 text-xs text-muted">Nochmal auf den gewählten Stern tippen, um ihn zu entfernen.</p>
          </div>
        )}
      </Card>

      <Card className="space-y-4">
        <div>
          <Label htmlFor="note">Notiz</Label>
          <Textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={2000}
            placeholder="Was war gut, was nicht? Tolle Käsetheke, lange Schlange…"
          />
          <p className="mt-1 text-xs text-muted">Notizen und Fotos sind auf deinem Dashboard öffentlich sichtbar.</p>
        </div>

        {photoMode ? (
          <div>
            <div className="mb-1.5 text-sm font-medium text-ink-2">Fotos</div>
            <div className="flex flex-wrap gap-2">
              {photos.map((p) => (
                <div key={p.pathname} className="relative">
                  {/* biome-ignore lint/performance/noImgElement: local preview of an uploaded photo */}
                  <img src={p.url} alt="" className="size-20 rounded-lg border border-line object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(p)}
                    className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-ink text-page"
                    aria-label="Foto entfernen"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
              {Array.from({ length: uploading }, (_, i) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: placeholders have no identity
                  key={i}
                  className="flex size-20 items-center justify-center rounded-lg border border-line bg-surface-2"
                >
                  <Loader2 className="size-5 animate-spin text-muted" />
                </div>
              ))}
              {photos.length + uploading < MAX_PHOTOS && (
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className="flex size-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-baseline text-xs text-ink-2 hover:bg-surface-2"
                >
                  <Camera className="size-5" />
                  Foto
                </button>
              )}
            </div>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => void addPhotos(e.target.files)}
            />
          </div>
        ) : (
          <p className="text-xs text-muted">Foto-Uploads sind noch nicht eingerichtet.</p>
        )}
      </Card>

      <div className="flex gap-2">
        <Button type="submit" size="lg" disabled={pending || uploading > 0} className="grow">
          {pending ? "Speichern…" : initial ? "Änderungen speichern" : "Besuch speichern"}
        </Button>
        {initial && (
          <Button variant="danger" size="lg" onClick={remove} disabled={pending} aria-label="Besuch löschen">
            <Trash2 />
          </Button>
        )}
      </div>
    </form>
  );
}
