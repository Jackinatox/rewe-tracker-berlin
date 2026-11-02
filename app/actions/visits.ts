"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { deletePhotoFiles, isOwnedPhoto, MAX_PHOTOS_PER_VISIT } from "@/lib/photos";
import { CATEGORIES } from "@/lib/ratings";
import { getStore } from "@/lib/stores";

const score = z.number().int().min(1).max(5);
const optionalScore = score.nullable().optional();

const visitSchema = z.object({
  storeId: z.string().refine((id) => getStore(id), "Unbekannter Markt"),
  visitedAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((d) => d >= "2000-01-01" && d <= new Date(Date.now() + 86_400_000).toISOString().slice(0, 10), {
      message: "Datum liegt in der Zukunft",
    }),
  overall: score,
  freshness: optionalScore,
  selection: optionalScore,
  crowding: optionalScore,
  checkout: optionalScore,
  cleanliness: optionalScore,
  staff: optionalScore,
  note: z.string().trim().max(2000).optional(),
  photos: z
    .array(
      z.object({
        url: z.string().max(500),
        pathname: z.string().max(300),
        width: z.number().int().positive(),
        height: z.number().int().positive(),
      }),
    )
    .max(MAX_PHOTOS_PER_VISIT),
});

export type VisitInput = z.input<typeof visitSchema>;
export type ActionResult = { error: string } | undefined;

async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/anmelden");
  return session.user;
}

function revalidateVisit(storeId: string, username: string | null | undefined) {
  revalidatePath("/");
  revalidatePath(`/markt/${storeId}`);
  if (username) revalidatePath(`/u/${username}`);
}

export async function saveVisit(id: string | null, input: VisitInput): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = visitSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };
  const { photos, note, visitedAt, ...rest } = parsed.data;

  if (!photos.every((p) => isOwnedPhoto(p, user.id))) return { error: "Ungültiges Foto" };

  const data = {
    ...rest,
    ...Object.fromEntries(CATEGORIES.map(({ key }) => [key, rest[key] ?? null])),
    note: note || null,
    visitedAt: new Date(`${visitedAt}T00:00:00Z`),
  };

  let storeId = data.storeId;
  if (id) {
    const existing = await db.visit.findUnique({ where: { id }, include: { photos: true } });
    if (!existing || existing.userId !== user.id) return { error: "Besuch nicht gefunden" };

    const keep = new Set(photos.map((p) => p.pathname));
    const removed = existing.photos.filter((p) => !keep.has(p.pathname));
    const known = new Set(existing.photos.map((p) => p.pathname));
    await db.visit.update({
      where: { id },
      data: {
        ...data,
        photos: {
          deleteMany: { id: { in: removed.map((p) => p.id) } },
          create: photos.filter((p) => !known.has(p.pathname)),
        },
      },
    });
    await deletePhotoFiles(removed);
    if (existing.storeId !== storeId) revalidatePath(`/markt/${existing.storeId}`);
  } else {
    const visit = await db.visit.create({ data: { ...data, userId: user.id, photos: { create: photos } } });
    storeId = visit.storeId;
  }

  revalidateVisit(storeId, user.username);
  redirect(`/markt/${storeId}?gespeichert=1`);
}

export async function deleteVisit(id: string): Promise<ActionResult> {
  const user = await requireUser();
  const visit = await db.visit.findUnique({ where: { id }, include: { photos: true } });
  if (!visit || visit.userId !== user.id) return { error: "Besuch nicht gefunden" };

  await db.visit.delete({ where: { id } });
  await deletePhotoFiles(visit.photos);
  revalidateVisit(visit.storeId, user.username);
  redirect(`/markt/${visit.storeId}`);
}

/** Removes an uploaded photo that never got attached to a visit (user removed it before saving). */
export async function discardUpload(photo: { url: string; pathname: string }): Promise<void> {
  const user = await requireUser();
  if (!isOwnedPhoto({ ...photo, width: 1, height: 1 }, user.id)) return;
  const attached = await db.photo.findFirst({ where: { pathname: photo.pathname } });
  if (!attached) await deletePhotoFiles([photo]);
}
