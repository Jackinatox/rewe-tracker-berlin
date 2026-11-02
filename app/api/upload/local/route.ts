import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { photoMode, photoPrefix } from "@/lib/photos";

const TYPES: Record<string, string> = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png" };

/** Dev-only stand-in for Vercel Blob: stores photos in public/uploads. */
export async function POST(request: Request) {
  if (photoMode() !== "local") return new NextResponse(null, { status: 404 });
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const file = (await request.formData()).get("file");
  if (!(file instanceof File) || !TYPES[file.type] || file.size > 3 * 1024 * 1024)
    return NextResponse.json({ error: "Ungültige Datei" }, { status: 400 });

  const pathname = `${photoPrefix("local", session.user.id)}${randomUUID()}.${TYPES[file.type]}`;
  const target = path.join(process.cwd(), "public", pathname);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ url: `/${pathname}`, pathname });
}
