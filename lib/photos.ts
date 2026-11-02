import "server-only";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { del } from "@vercel/blob";

export type PhotoMode = "blob" | "local" | null;

export interface PhotoInput {
  url: string;
  pathname: string;
  width: number;
  height: number;
}

export const MAX_PHOTOS_PER_VISIT = 6;

/** Vercel Blob when configured; in local dev without a token, files go to public/uploads. */
export function photoMode(): PhotoMode {
  if (process.env.BLOB_READ_WRITE_TOKEN) return "blob";
  if (process.env.NODE_ENV === "development") return "local";
  return null;
}

export const photoPrefix = (mode: Exclude<PhotoMode, null>, userId: string) =>
  mode === "blob" ? `visits/${userId}/` : `uploads/${userId}/`;

/** Only accept photos the user uploaded to their own folder. */
export function isOwnedPhoto(p: PhotoInput, userId: string): boolean {
  if (p.pathname.includes("..")) return false;
  const mode = photoMode();
  if (mode === "local") return p.pathname.startsWith(photoPrefix(mode, userId)) && p.url === `/${p.pathname}`;
  if (mode === "blob") {
    try {
      const url = new URL(p.url);
      return (
        url.protocol === "https:" &&
        url.hostname.endsWith(".public.blob.vercel-storage.com") &&
        url.pathname === `/${p.pathname}` &&
        p.pathname.startsWith(photoPrefix(mode, userId))
      );
    } catch {
      return false;
    }
  }
  return false;
}

export async function deletePhotoFiles(photos: { url: string; pathname: string }[]) {
  if (photos.length === 0) return;
  const blobs = photos.filter((p) => p.url.startsWith("https://"));
  const local = photos.filter((p) => p.url.startsWith("/uploads/"));
  if (blobs.length > 0 && process.env.BLOB_READ_WRITE_TOKEN) await del(blobs.map((p) => p.url));
  await Promise.all(local.map((p) => unlink(path.join(process.cwd(), "public", p.pathname)).catch(() => {})));
}
