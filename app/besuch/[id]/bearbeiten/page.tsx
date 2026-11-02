import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { VisitForm } from "@/components/visit-form";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { photoMode } from "@/lib/photos";
import { MAP_STORES } from "@/lib/queries";
import { CATEGORIES } from "@/lib/ratings";
import { DISTRICTS } from "@/lib/stores";
import { todayInBerlin } from "@/lib/utils";

export const metadata: Metadata = { title: "Besuch bearbeiten" };

export default async function EditVisitPage({ params }: PageProps<"/besuch/[id]/bearbeiten">) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect(`/anmelden?next=/besuch/${id}/bearbeiten`);

  const visit = await db.visit.findUnique({ where: { id }, include: { photos: { orderBy: { createdAt: "asc" } } } });
  if (!visit || visit.userId !== session.user.id) notFound();

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Besuch bearbeiten</h1>
      <VisitForm
        stores={MAP_STORES}
        districts={DISTRICTS}
        today={todayInBerlin()}
        photoMode={photoMode()}
        userId={session.user.id}
        initial={{
          id: visit.id,
          storeId: visit.storeId,
          visitedAt: visit.visitedAt.toISOString().slice(0, 10),
          overall: visit.overall,
          scores: Object.fromEntries(CATEGORIES.map(({ key }) => [key, visit[key]])),
          note: visit.note ?? "",
          photos: visit.photos.map(({ url, pathname, width, height }) => ({ url, pathname, width, height })),
        }}
      />
    </div>
  );
}
