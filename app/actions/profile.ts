"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { auth, getSession } from "@/lib/auth";

export async function updateDisplayName(name: string): Promise<{ error?: string; ok?: boolean }> {
  const session = await getSession();
  if (!session) return { error: "Nicht angemeldet" };
  const parsed = z.string().trim().min(1, "Name fehlt").max(40, "Name ist zu lang").safeParse(name);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  await auth.api.updateUser({ body: { name: parsed.data }, headers: await headers() });
  revalidatePath(`/u/${session.user.username}`);
  revalidatePath("/einstellungen");
  return { ok: true };
}
