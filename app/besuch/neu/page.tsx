import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { VisitForm } from "@/components/visit-form";
import { getSession } from "@/lib/auth";
import { photoMode } from "@/lib/photos";
import { MAP_STORES } from "@/lib/queries";
import { DISTRICTS, getStore } from "@/lib/stores";
import { todayInBerlin } from "@/lib/utils";

export const metadata: Metadata = { title: "Besuch eintragen" };

export default async function NewVisitPage({ searchParams }: PageProps<"/besuch/neu">) {
  const { markt } = await searchParams;
  const storeId = typeof markt === "string" && getStore(markt) ? markt : undefined;
  const session = await getSession();
  if (!session) redirect(`/anmelden?next=${encodeURIComponent(`/besuch/neu${storeId ? `?markt=${storeId}` : ""}`)}`);

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Besuch eintragen</h1>
      <VisitForm
        stores={MAP_STORES}
        districts={DISTRICTS}
        defaultStoreId={storeId}
        today={todayInBerlin()}
        photoMode={photoMode()}
        userId={session.user.id}
      />
    </div>
  );
}
