import { upload } from "@vercel/blob/client";
import type { PhotoInput, PhotoMode } from "./photos";

const MAX_SIDE = 1600;

/** Downscale to at most 1600px and re-encode as WebP, so photos stay small on the free Blob tier. */
async function shrink(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Bild konnte nicht verarbeitet werden"))),
      "image/webp",
      0.82,
    ),
  );
  return { blob, width, height };
}

export async function uploadPhoto(file: File, mode: Exclude<PhotoMode, null>, userId: string): Promise<PhotoInput> {
  const { blob, width, height } = await shrink(file);
  const type = blob.type || "image/webp";

  if (mode === "blob") {
    const ext = type === "image/webp" ? "webp" : "jpg";
    const result = await upload(`visits/${userId}/photo.${ext}`, blob, {
      access: "public",
      handleUploadUrl: "/api/upload",
      contentType: type,
    });
    return { url: result.url, pathname: result.pathname, width, height };
  }

  const form = new FormData();
  form.append("file", new File([blob], "photo", { type }));
  const res = await fetch("/api/upload/local", { method: "POST", body: form });
  const body = (await res.json()) as { url?: string; pathname?: string; error?: string };
  if (!res.ok || !body.url || !body.pathname) throw new Error(body.error ?? "Upload fehlgeschlagen");
  return { url: body.url, pathname: body.pathname, width, height };
}
